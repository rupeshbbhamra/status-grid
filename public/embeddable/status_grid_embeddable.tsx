import React, { useEffect } from 'react';
import { BehaviorSubject, combineLatest, merge, startWith, Subscription, switchMap, tap } from 'rxjs';
import type { EmbeddablePublicDefinition } from '@kbn/embeddable-plugin/public';
import { PlacementStrategy } from '@kbn/embeddable-plugin/public';
import { buildPhraseFilter, type TimeRange } from '@kbn/es-query';
import {
  fetch$,
  initializeStateApi,
  initializeStateManager,
  initializeTitleManager,
  titleComparators,
  useBatchedPublishingSubjects,
  type StateComparators,
  type WithAllKeys,
} from '@kbn/presentation-publishing';
import { openLazyFlyout } from '@kbn/presentation-util';
import { ON_APPLY_FILTER } from '@kbn/ui-actions-plugin/common/trigger_ids';
import {
  DEFAULT_CONFIG,
  getConfigProblem,
  STATUS_GRID_EMBEDDABLE_TYPE,
  type StatusCell,
  type StatusGridConfig,
} from '../../common';
import type { DataView, Services, StatusGridApi, StatusGridSerializedState } from '../types';
import { fetchCells } from './fetch_cells';
import { StatusGridView } from './status_grid_view';

/** Every key listed, including optional ones, so the state manager creates a setter for each. */
const CONFIG_DEFAULTS: WithAllKeys<StatusGridConfig> = {
  ...DEFAULT_CONFIG,
  dataViewId: undefined,
  entityField: undefined,
  statusField: undefined,
  metricField: undefined,
  warningThreshold: undefined,
  criticalThreshold: undefined,
};

const CONFIG_KEYS = Object.keys(CONFIG_DEFAULTS) as Array<keyof StatusGridConfig>;

const pickConfig = (state?: Partial<StatusGridSerializedState>): Partial<StatusGridConfig> => {
  const out: Partial<StatusGridConfig> = {};
  for (const key of CONFIG_KEYS) {
    if (state?.[key] !== undefined) (out as Record<string, unknown>)[key] = state[key];
  }
  return out;
};

export const getStatusGridFactory = (services: Services) => {
  const factory: EmbeddablePublicDefinition<StatusGridSerializedState, StatusGridApi> = {
    type: STATUS_GRID_EMBEDDABLE_TYPE,
    getPlacementHints: () => ({
      width: 24,
      height: 12,
      strategy: PlacementStrategy.findTopLeftMostOpenSpace,
    }),
    layoutConstraints: { minWidth: 6, minHeight: 4 },

    buildEmbeddable: async ({ initialState, finalizeApi, parentApi, uuid }) => {
      const subscriptions = new Subscription();
      const titleManager = initializeTitleManager(initialState ?? {});
      const configManager = initializeStateManager<StatusGridConfig>(
        pickConfig(initialState),
        CONFIG_DEFAULTS
      );

      const cells$ = new BehaviorSubject<StatusCell[]>([]);
      const dataLoading$ = new BehaviorSubject<boolean | undefined>(false);
      const blockingError$ = new BehaviorSubject<Error | undefined>(undefined);
      const dataViews$ = new BehaviorSubject<DataView[] | undefined>(undefined);

      // Keep the published data view in sync, so the dashboard filter bar knows the fields.
      subscriptions.add(
        configManager.api.dataViewId$
          .pipe(
            switchMap(async (id) => {
              if (!id) return undefined;
              try {
                return await services.dataViews.get(id);
              } catch {
                return undefined;
              }
            })
          )
          .subscribe((dv) => dataViews$.next(dv ? [dv] : undefined))
      );

      const comparators = Object.fromEntries(
        CONFIG_KEYS.map((key) => [key, 'referenceEquality'])
      ) as StateComparators<StatusGridConfig>;

      const stateApi = initializeStateApi<StatusGridSerializedState>({
        uuid,
        parentApi,
        serializeState: () => ({
          ...titleManager.getLatestState(),
          ...configManager.getLatestState(),
        }),
        anyStateChange$: merge(titleManager.anyStateChange$, configManager.anyStateChange$),
        getComparators: () => ({ ...titleComparators, ...comparators }),
        applySerializedState: (next) => {
          titleManager.reinitializeState(next);
          configManager.reinitializeState(pickConfig(next));
        },
      });

      const api: StatusGridApi = finalizeApi({
        ...titleManager.api,
        ...stateApi,
        blockingError$,
        dataLoading$,
        dataViews$,
        isEditingEnabled: () => true,
        getTypeDisplayName: () => 'status grid',
        onEdit: async () => {
          const before = configManager.getLatestState();
          openLazyFlyout({
            core: services.core,
            parentApi: api.parentApi,
            flyoutProps: { size: 's', focusedPanelId: api.uuid },
            loadContent: async ({ closeFlyout, ariaLabelledBy }) => {
              const { StatusGridEditor } = await import('../editor/status_grid_editor');
              return (
                <StatusGridEditor
                  ariaLabelledBy={ariaLabelledBy}
                  dataViews={services.dataViews}
                  isCreate={false}
                  initialConfig={before}
                  onCancel={closeFlyout}
                  onSave={(next) => {
                    configManager.reinitializeState(next);
                    closeFlyout();
                  }}
                />
              );
            },
          });
        },
      });

      // Re-query when the dashboard's time/filters/query change, or when this panel's settings change.
      let abortController: AbortController | undefined;
      subscriptions.add(
        combineLatest([fetch$(api), configManager.anyStateChange$.pipe(startWith(undefined))])
          .pipe(
            tap(() => abortController?.abort()),
            switchMap(async ([ctx]) => {
              const config = configManager.getLatestState();
              blockingError$.next(undefined);
              if (getConfigProblem(config)) return { cells: [] as StatusCell[] };

              abortController = new AbortController();
              const signal = abortController.signal;
              dataLoading$.next(true);
              try {
                const dataView = await services.dataViews.get(config.dataViewId!);
                const timeRange: TimeRange | undefined = ctx.timeslice
                  ? {
                      from: new Date(ctx.timeslice[0]).toISOString(),
                      to: new Date(ctx.timeslice[1]).toISOString(),
                      mode: 'absolute',
                    }
                  : ctx.timeRange;
                const cells = await fetchCells({
                  config,
                  dataView,
                  data: services.data,
                  filters: ctx.filters ?? [],
                  query: ctx.query,
                  timeRange,
                  abortSignal: signal,
                  sessionId: ctx.searchSessionId,
                });
                return { cells };
              } catch (error) {
                if ((error as Error)?.name === 'AbortError') return undefined;
                return { error: error as Error };
              }
            })
          )
          .subscribe((result) => {
            if (!result) return; // a newer request replaced this one
            dataLoading$.next(false);
            if ('error' in result && result.error) blockingError$.next(result.error);
            if ('cells' in result && result.cells) cells$.next(result.cells);
          })
      );

      const onTileClick = async (cell: StatusCell) => {
        const config = configManager.getLatestState();
        const dataView = dataViews$.getValue()?.[0];
        const field = dataView && config.entityField ? dataView.getFieldByName(config.entityField) : undefined;
        if (!dataView || !field) return;
        const filter = buildPhraseFilter(field, cell.key, dataView);
        await services.uiActions.executeTriggerActions(ON_APPLY_FILTER, {
          embeddable: api,
          filters: [filter],
          timeFieldName: dataView.timeFieldName,
        });
      };

      return {
        api,
        Component: () => {
          // Subscribing to these makes the panel re-render when its settings change.
          const [cells] = useBatchedPublishingSubjects(
            cells$,
            configManager.api.showValue$,
            configManager.api.tileMinWidth$,
            configManager.api.dataViewId$,
            configManager.api.entityField$,
            configManager.api.statusField$,
            configManager.api.metricField$,
            configManager.api.mode$
          );
          const configState = configManager.getLatestState();

          useEffect(() => () => subscriptions.unsubscribe(), []);

          return (
            <StatusGridView
              cells={cells}
              config={configState}
              configProblem={getConfigProblem(configState)}
              onTileClick={onTileClick}
            />
          );
        },
      };
    },
  };
  return factory;
};

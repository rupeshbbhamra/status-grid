import React, { useEffect, useState } from 'react';
import { BehaviorSubject, merge, Subscription } from 'rxjs';
import type { DefaultEmbeddableApi, EmbeddablePublicDefinition } from '@kbn/embeddable-plugin/public';
import { PlacementStrategy } from '@kbn/embeddable-plugin/public';
import {
  apiPublishesDescription,
  apiPublishesTimeRange,
  apiPublishesTitle,
  fetch$,
  initializeStateApi,
  initializeStateManager,
  initializeTitleManager,
  titleComparators,
  useBatchedPublishingSubjects,
  useFetchContext,
  type SerializedTitles,
  type StateComparators,
} from '@kbn/presentation-publishing';
import { openLazyFlyout } from '@kbn/presentation-util';
import {
  DASHBOARD_HEADER_TYPE,
  DEFAULT_HEADER,
  normalizeHeader,
  type HeaderConfig,
} from '../../common';
import type { Services } from '../types';
import { HeaderView } from './header_view';

export type HeaderSerializedState = SerializedTitles & Partial<HeaderConfig>;
export type HeaderApi = DefaultEmbeddableApi<HeaderSerializedState>;

const KEYS = Object.keys(DEFAULT_HEADER) as Array<keyof HeaderConfig>;

const pick = (state?: Partial<HeaderSerializedState>): HeaderConfig => {
  const raw: Partial<HeaderConfig> = {};
  for (const key of KEYS) {
    if (state?.[key] !== undefined) (raw as Record<string, unknown>)[key] = state[key];
  }
  return normalizeHeader(raw);
};

/** The dashboard's own name and description, kept in sync as they change. */
function watchDashboard(parentApi: unknown, subs: Subscription) {
  const title$ = new BehaviorSubject<string | undefined>(undefined);
  const description$ = new BehaviorSubject<string | undefined>(undefined);
  if (apiPublishesTitle(parentApi)) {
    subs.add(parentApi.title$.subscribe((t) => title$.next(t ?? undefined)));
  }
  if (apiPublishesDescription(parentApi)) {
    subs.add(parentApi.description$.subscribe((d) => description$.next(d ?? undefined)));
  }
  return { title$, description$ };
}

export const getHeaderFactory = (services: Services) => {
  const factory: EmbeddablePublicDefinition<HeaderSerializedState, HeaderApi> = {
    type: DASHBOARD_HEADER_TYPE,
    getPlacementHints: () => ({ width: 48, height: 6, strategy: PlacementStrategy.placeAtTop }),
    layoutConstraints: { minWidth: 6, minHeight: 2 },

    buildEmbeddable: async ({ initialState, finalizeApi, parentApi, uuid }) => {
      const subscriptions = new Subscription();
      const titleManager = initializeTitleManager(initialState ?? {});
      const headerManager = initializeStateManager<HeaderConfig>(pick(initialState), DEFAULT_HEADER);
      const dashboard = watchDashboard(parentApi, subscriptions);
      const updatedAt$ = new BehaviorSubject<Date | undefined>(undefined);

      const comparators = Object.fromEntries(
        KEYS.map((k) => [k, 'referenceEquality'])
      ) as StateComparators<HeaderConfig>;

      const stateApi = initializeStateApi<HeaderSerializedState>({
        uuid,
        parentApi,
        serializeState: () => ({ ...titleManager.getLatestState(), ...headerManager.getLatestState() }),
        anyStateChange$: merge(titleManager.anyStateChange$, headerManager.anyStateChange$),
        getComparators: () => ({ ...titleComparators, ...comparators }),
        applySerializedState: (next) => {
          titleManager.reinitializeState(next);
          headerManager.reinitializeState(pick(next));
        },
      });

      const api: HeaderApi = finalizeApi({
        ...titleManager.api,
        ...stateApi,
        isEditingEnabled: () => true,
        getTypeDisplayName: () => 'dashboard header',
        onEdit: async () => {
          openLazyFlyout({
            core: services.core,
            parentApi: api.parentApi,
            flyoutProps: { size: 'm', focusedPanelId: api.uuid },
            loadContent: async ({ closeFlyout, ariaLabelledBy }) => {
              const { HeaderEditor } = await import('./header_editor');
              return (
                <HeaderEditor
                  ariaLabelledBy={ariaLabelledBy}
                  isCreate={false}
                  initialConfig={headerManager.getLatestState()}
                  dashboard={{ title: dashboard.title$.value, description: dashboard.description$.value }}
                  timeRange={apiPublishesTimeRange(api.parentApi) ? api.parentApi.timeRange$.value : undefined}
                  onCancel={closeFlyout}
                  onSave={(next) => {
                    headerManager.reinitializeState(next);
                    closeFlyout();
                  }}
                />
              );
            },
          });
        },
      });

      // Every time the dashboard (re)loads data — refresh button, auto-refresh, time change.
      subscriptions.add(fetch$(api).subscribe(() => updatedAt$.next(new Date())));

      return {
        api,
        Component: () => {
          const [title, description, updatedAt] = useBatchedPublishingSubjects(
            dashboard.title$,
            dashboard.description$,
            updatedAt$
          );
          const [, rerender] = useState(0);
          useEffect(() => {
            const sub = headerManager.anyStateChange$.subscribe(() => rerender((n) => n + 1));
            return () => sub.unsubscribe();
          }, []);
          useEffect(() => () => subscriptions.unsubscribe(), []);
          const { timeRange } = useFetchContext(api);

          return (
            <HeaderView
              config={headerManager.getLatestState()}
              dashboard={{ title, description }}
              timeRange={timeRange}
              updatedAt={updatedAt}
            />
          );
        },
      };
    },
  };
  return factory;
};

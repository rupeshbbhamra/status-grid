import React, { useEffect, useState } from 'react';
import { merge } from 'rxjs';
import type { DefaultEmbeddableApi, EmbeddablePublicDefinition } from '@kbn/embeddable-plugin/public';
import { PlacementStrategy } from '@kbn/embeddable-plugin/public';
import {
  apiPublishesTimeRange,
  initializeStateApi,
  initializeStateManager,
  initializeTitleManager,
  titleComparators,
  useFetchContext,
  type SerializedTitles,
  type StateComparators,
} from '@kbn/presentation-publishing';
import { openLazyFlyout } from '@kbn/presentation-util';
import {
  DEFAULT_TITLE_CONFIG,
  normalizeTitleConfig,
  STYLED_TITLE_EMBEDDABLE_TYPE,
  type TitleConfig,
} from '../../common';
import type { Services } from '../types';
import { StyledTitleView } from './styled_title_view';

export type StyledTitleSerializedState = SerializedTitles & Partial<TitleConfig>;
export type StyledTitleApi = DefaultEmbeddableApi<StyledTitleSerializedState>;

const KEYS = Object.keys(DEFAULT_TITLE_CONFIG) as Array<keyof TitleConfig>;

const pick = (state?: Partial<StyledTitleSerializedState>): TitleConfig => {
  const raw: Partial<TitleConfig> = {};
  for (const key of KEYS) {
    if (state?.[key] !== undefined) (raw as Record<string, unknown>)[key] = state[key];
  }
  return normalizeTitleConfig(raw);
};

export const getStyledTitleFactory = (services: Services) => {
  const factory: EmbeddablePublicDefinition<StyledTitleSerializedState, StyledTitleApi> = {
    type: STYLED_TITLE_EMBEDDABLE_TYPE,
    getPlacementHints: () => ({ width: 48, height: 5, strategy: PlacementStrategy.placeAtTop }),
    layoutConstraints: { minWidth: 4, minHeight: 2 },

    buildEmbeddable: async ({ initialState, finalizeApi, parentApi, uuid }) => {
      const titleManager = initializeTitleManager(initialState ?? {});
      const styleManager = initializeStateManager<TitleConfig>(pick(initialState), DEFAULT_TITLE_CONFIG);

      const comparators = Object.fromEntries(
        KEYS.map((k) => [k, 'referenceEquality'])
      ) as StateComparators<TitleConfig>;

      const stateApi = initializeStateApi<StyledTitleSerializedState>({
        uuid,
        parentApi,
        serializeState: () => ({ ...titleManager.getLatestState(), ...styleManager.getLatestState() }),
        anyStateChange$: merge(titleManager.anyStateChange$, styleManager.anyStateChange$),
        getComparators: () => ({ ...titleComparators, ...comparators }),
        applySerializedState: (next) => {
          titleManager.reinitializeState(next);
          styleManager.reinitializeState(pick(next));
        },
      });

      const api: StyledTitleApi = finalizeApi({
        ...titleManager.api,
        ...stateApi,
        isEditingEnabled: () => true,
        getTypeDisplayName: () => 'styled title',
        onEdit: async () => {
          openLazyFlyout({
            core: services.core,
            parentApi: api.parentApi,
            flyoutProps: { size: 'm', focusedPanelId: api.uuid },
            loadContent: async ({ closeFlyout, ariaLabelledBy }) => {
              const { StyledTitleEditor } = await import('./styled_title_editor');
              return (
                <StyledTitleEditor
                  ariaLabelledBy={ariaLabelledBy}
                  isCreate={false}
                  initialConfig={styleManager.getLatestState()}
                  timeRange={
                    apiPublishesTimeRange(api.parentApi) ? api.parentApi.timeRange$.value : undefined
                  }
                  onCancel={closeFlyout}
                  onSave={(next) => {
                    styleManager.reinitializeState(next);
                    closeFlyout();
                  }}
                />
              );
            },
          });
        },
      });

      return {
        api,
        Component: () => {
          // Re-render whenever any style setting changes.
          const [, rerender] = useState(0);
          useEffect(() => {
            const sub = styleManager.anyStateChange$.subscribe(() => rerender((n) => n + 1));
            return () => sub.unsubscribe();
          }, []);
          const { timeRange } = useFetchContext(api);
          return <StyledTitleView config={styleManager.getLatestState()} timeRange={timeRange} />;
        },
      };
    },
  };
  return factory;
};

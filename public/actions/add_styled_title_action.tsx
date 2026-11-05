import { i18n } from '@kbn/i18n';
import { ADD_PANEL_VISUALIZATION_GROUP } from '@kbn/embeddable-plugin/public';
import {
  apiCanAddNewPanel,
  apiPublishesTimeRange,
  type EmbeddableApiContext,
} from '@kbn/presentation-publishing';
import { openLazyFlyout } from '@kbn/presentation-util';
import { IncompatibleActionError } from '@kbn/ui-actions-plugin/public';
import {
  ADD_STYLED_TITLE_ACTION_ID,
  applyPreset,
  DEFAULT_TITLE_CONFIG,
  STYLED_TITLE_EMBEDDABLE_TYPE,
} from '../../common';
import type { Services } from '../types';
import type { StyledTitleSerializedState } from '../title/styled_title_embeddable';

export const createAddStyledTitleAction = (services: Services) => ({
  id: ADD_STYLED_TITLE_ACTION_ID,
  grouping: [ADD_PANEL_VISUALIZATION_GROUP],
  order: 9,
  getIconType: () => 'visText',
  getDisplayName: () =>
    i18n.translate('statusGrid.addTitle.displayName', { defaultMessage: 'Styled title' }),
  getDisplayNameTooltip: () =>
    i18n.translate('statusGrid.addTitle.tooltip', {
      defaultMessage: 'A dashboard heading or banner with your own colors, size and icon.',
    }),
  isCompatible: async ({ embeddable }: EmbeddableApiContext) => apiCanAddNewPanel(embeddable),
  execute: async ({ embeddable, returnFocus }: EmbeddableApiContext) => {
    if (!apiCanAddNewPanel(embeddable)) throw new IncompatibleActionError();

    openLazyFlyout({
      core: services.core,
      parentApi: embeddable,
      returnFocus,
      flyoutProps: { size: 'm' },
      loadContent: async ({ closeFlyout, ariaLabelledBy }) => {
        const { StyledTitleEditor } = await import('../title/styled_title_editor');
        return (
          <StyledTitleEditor
            ariaLabelledBy={ariaLabelledBy}
            isCreate
            initialConfig={applyPreset(DEFAULT_TITLE_CONFIG, 'blue-banner')}
            timeRange={apiPublishesTimeRange(embeddable) ? embeddable.timeRange$.value : undefined}
            onCancel={closeFlyout}
            onSave={(config) => {
              closeFlyout();
              embeddable.addNewPanel<StyledTitleSerializedState>(
                {
                  panelType: STYLED_TITLE_EMBEDDABLE_TYPE,
                  // Start without the panel frame so it looks like part of the dashboard.
                  serializedState: { ...config, hide_title: true, hide_border: true },
                },
                { displaySuccessMessage: true }
              );
            }}
          />
        );
      },
    });
  },
});

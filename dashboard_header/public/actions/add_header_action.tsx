import { i18n } from '@kbn/i18n';
import { ADD_PANEL_ANNOTATION_GROUP } from '@kbn/embeddable-plugin/public';
import {
  apiCanAddNewPanel,
  apiPublishesDescription,
  apiPublishesTimeRange,
  apiPublishesTitle,
  type EmbeddableApiContext,
} from '@kbn/presentation-publishing';
import { openLazyFlyout } from '@kbn/presentation-util';
import { IncompatibleActionError } from '@kbn/ui-actions-plugin/public';
import { ADD_DASHBOARD_HEADER_ACTION_ID, DASHBOARD_HEADER_TYPE, DEFAULT_HEADER } from '../../common';
import type { Services } from '../types';
import type { HeaderSerializedState } from '../header/header_embeddable';

export const createAddHeaderAction = (services: Services) => ({
  id: ADD_DASHBOARD_HEADER_ACTION_ID,
  grouping: [ADD_PANEL_ANNOTATION_GROUP],
  order: 30,
  getIconType: () => 'visText',
  getDisplayName: () =>
    i18n.translate('dashboardHeader.add.displayName', { defaultMessage: 'Dashboard header' }),
  getDisplayNameTooltip: () =>
    i18n.translate('dashboardHeader.add.tooltip', {
      defaultMessage: "Shows the dashboard's name as a styled title, readable in light and dark themes.",
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
        const { HeaderEditor } = await import('../header/header_editor');
        return (
          <HeaderEditor
            ariaLabelledBy={ariaLabelledBy}
            isCreate
            initialConfig={DEFAULT_HEADER}
            dashboard={{
              title: apiPublishesTitle(embeddable) ? embeddable.title$.value : undefined,
              description: apiPublishesDescription(embeddable) ? embeddable.description$.value : undefined,
            }}
            timeRange={apiPublishesTimeRange(embeddable) ? embeddable.timeRange$.value : undefined}
            onCancel={closeFlyout}
            onSave={(config) => {
              closeFlyout();
              embeddable.addNewPanel<HeaderSerializedState>(
                {
                  panelType: DASHBOARD_HEADER_TYPE,
                  // No panel frame, so it reads as part of the dashboard rather than a box on it.
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

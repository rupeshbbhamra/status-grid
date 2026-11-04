import { i18n } from '@kbn/i18n';
import { ADD_PANEL_VISUALIZATION_GROUP } from '@kbn/embeddable-plugin/public';
import { apiCanAddNewPanel, type EmbeddableApiContext } from '@kbn/presentation-publishing';
import { openLazyFlyout } from '@kbn/presentation-util';
import { IncompatibleActionError } from '@kbn/ui-actions-plugin/public';
import { ADD_STATUS_GRID_ACTION_ID, DEFAULT_CONFIG, STATUS_GRID_EMBEDDABLE_TYPE } from '../../common';
import type { Services, StatusGridSerializedState } from '../types';

export const createAddStatusGridAction = (services: Services) => ({
  id: ADD_STATUS_GRID_ACTION_ID,
  grouping: [ADD_PANEL_VISUALIZATION_GROUP],
  order: 10,
  getIconType: () => 'apps',
  getDisplayName: () =>
    i18n.translate('statusGrid.addPanel.displayName', { defaultMessage: 'Status grid' }),
  getDisplayNameTooltip: () =>
    i18n.translate('statusGrid.addPanel.tooltip', {
      defaultMessage: 'One green, yellow or red tile per service, host or queue.',
    }),
  isCompatible: async ({ embeddable }: EmbeddableApiContext) => apiCanAddNewPanel(embeddable),
  execute: async ({ embeddable, returnFocus }: EmbeddableApiContext) => {
    if (!apiCanAddNewPanel(embeddable)) throw new IncompatibleActionError();

    openLazyFlyout({
      core: services.core,
      parentApi: embeddable,
      returnFocus,
      flyoutProps: { size: 's' },
      loadContent: async ({ closeFlyout, ariaLabelledBy }) => {
        const { StatusGridEditor } = await import('../editor/status_grid_editor');
        const defaultDataViewId = (await services.dataViews.getDefaultId()) ?? undefined;
        return (
          <StatusGridEditor
            ariaLabelledBy={ariaLabelledBy}
            dataViews={services.dataViews}
            isCreate
            initialConfig={{ ...DEFAULT_CONFIG, dataViewId: defaultDataViewId }}
            onCancel={closeFlyout}
            onSave={(config) => {
              closeFlyout();
              embeddable.addNewPanel<StatusGridSerializedState>(
                {
                  panelType: STATUS_GRID_EMBEDDABLE_TYPE,
                  serializedState: { ...config },
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

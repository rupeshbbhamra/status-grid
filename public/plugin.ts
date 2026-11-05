import type { CoreSetup, CoreStart, Plugin } from '@kbn/core/public';
import {
  ADD_PANEL_TRIGGER,
  ADD_STATUS_GRID_ACTION_ID,
  ADD_STYLED_TITLE_ACTION_ID,
  STATUS_GRID_EMBEDDABLE_TYPE,
  STYLED_TITLE_EMBEDDABLE_TYPE,
} from '../common';
import type {
  StatusGridPluginSetup,
  StatusGridPluginStart,
  StatusGridSetupDeps,
  StatusGridStartDeps,
} from './types';

export class StatusGridPlugin
  implements
    Plugin<StatusGridPluginSetup, StatusGridPluginStart, StatusGridSetupDeps, StatusGridStartDeps>
{
  public setup(
    core: CoreSetup<StatusGridStartDeps>,
    { embeddable }: StatusGridSetupDeps
  ): StatusGridPluginSetup {
    // Register the panel type. The code is loaded only when a dashboard actually shows one.
    embeddable.registerEmbeddablePublicDefinition(STATUS_GRID_EMBEDDABLE_TYPE, async () => {
      const [{ getStatusGridFactory }, [coreStart, deps]] = await Promise.all([
        import('./embeddable/status_grid_embeddable'),
        core.getStartServices(),
      ]);
      return getStatusGridFactory({ core: coreStart, ...deps });
    });

    embeddable.registerEmbeddablePublicDefinition(STYLED_TITLE_EMBEDDABLE_TYPE, async () => {
      const [{ getStyledTitleFactory }, [coreStart, deps]] = await Promise.all([
        import('./title/styled_title_embeddable'),
        core.getStartServices(),
      ]);
      return getStyledTitleFactory({ core: coreStart, ...deps });
    });
    return {};
  }

  public start(core: CoreStart, deps: StatusGridStartDeps): StatusGridPluginStart {
    // Adds "Status grid" to the dashboard's Add panel menu.
    deps.uiActions.addTriggerActionAsync(
      ADD_PANEL_TRIGGER,
      ADD_STATUS_GRID_ACTION_ID,
      async () => {
        const { createAddStatusGridAction } = await import('./actions/add_status_grid_action');
        return createAddStatusGridAction({ core, ...deps });
      }
    );

    // Adds "Styled title" to the same menu.
    deps.uiActions.addTriggerActionAsync(
      ADD_PANEL_TRIGGER,
      ADD_STYLED_TITLE_ACTION_ID,
      async () => {
        const { createAddStyledTitleAction } = await import('./actions/add_styled_title_action');
        return createAddStyledTitleAction({ core, ...deps });
      }
    );
    return {};
  }

  public stop() {}
}

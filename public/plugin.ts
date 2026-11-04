import type { CoreSetup, CoreStart, Plugin } from '@kbn/core/public';
import { ADD_PANEL_TRIGGER } from '@kbn/ui-actions-plugin/common/trigger_ids';
import { ADD_STATUS_GRID_ACTION_ID, STATUS_GRID_EMBEDDABLE_TYPE } from '../common';
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
    return {};
  }

  public stop() {}
}

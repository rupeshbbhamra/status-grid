import type { CoreSetup, CoreStart, Plugin } from '@kbn/core/public';
import { ADD_DASHBOARD_HEADER_ACTION_ID, ADD_PANEL_TRIGGER, DASHBOARD_HEADER_TYPE } from '../common';
import type {
  DashboardHeaderPluginSetup,
  DashboardHeaderPluginStart,
  SetupDeps,
  StartDeps,
} from './types';

export class DashboardHeaderPlugin
  implements Plugin<DashboardHeaderPluginSetup, DashboardHeaderPluginStart, SetupDeps, StartDeps>
{
  public setup(core: CoreSetup<StartDeps>, { embeddable }: SetupDeps): DashboardHeaderPluginSetup {
    // Code (and fonts) load only when a dashboard actually shows a header.
    embeddable.registerEmbeddablePublicDefinition(DASHBOARD_HEADER_TYPE, async () => {
      const [{ getHeaderFactory }, [coreStart, deps]] = await Promise.all([
        import('./header/header_embeddable'),
        core.getStartServices(),
      ]);
      return getHeaderFactory({ core: coreStart, ...deps });
    });
    return {};
  }

  public start(core: CoreStart, deps: StartDeps): DashboardHeaderPluginStart {
    deps.uiActions.addTriggerActionAsync(
      ADD_PANEL_TRIGGER,
      ADD_DASHBOARD_HEADER_ACTION_ID,
      async () => {
        const { createAddHeaderAction } = await import('./actions/add_header_action');
        return createAddHeaderAction({ core, ...deps });
      }
    );
    return {};
  }

  public stop() {}
}

import type { CoreStart } from '@kbn/core/public';
import type { EmbeddableSetup, EmbeddableStart } from '@kbn/embeddable-plugin/public';
import type { UiActionsSetup, UiActionsStart } from '@kbn/ui-actions-plugin/public';

export interface SetupDeps {
  embeddable: EmbeddableSetup;
  uiActions: UiActionsSetup;
}

export interface StartDeps {
  embeddable: EmbeddableStart;
  uiActions: UiActionsStart;
}

export interface Services extends StartDeps {
  core: CoreStart;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DashboardHeaderPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DashboardHeaderPluginStart {}

import type { CoreStart } from '@kbn/core/public';
import type { DataPublicPluginStart } from '@kbn/data-plugin/public';
import type { DataViewsPublicPluginStart } from '@kbn/data-views-plugin/public';
import type { DataView } from '@kbn/data-views-plugin/common';
import type {
  DefaultEmbeddableApi,
  EmbeddableSetup,
  EmbeddableStart,
} from '@kbn/embeddable-plugin/public';
import type {
  PublishesDataLoading,
  PublishesDataViews,
  SerializedTitles,
} from '@kbn/presentation-publishing';
import type { UiActionsSetup, UiActionsStart } from '@kbn/ui-actions-plugin/public';
import type { StatusGridConfig } from '../common';

export interface StatusGridSetupDeps {
  embeddable: EmbeddableSetup;
  uiActions: UiActionsSetup;
}

export interface StatusGridStartDeps {
  embeddable: EmbeddableStart;
  uiActions: UiActionsStart;
  data: DataPublicPluginStart;
  dataViews: DataViewsPublicPluginStart;
}

export interface Services extends StatusGridStartDeps {
  core: CoreStart;
}

/** What gets saved in the dashboard for each panel. */
export type StatusGridSerializedState = SerializedTitles & Partial<StatusGridConfig>;

export type StatusGridApi = DefaultEmbeddableApi<StatusGridSerializedState> &
  PublishesDataViews &
  PublishesDataLoading;

export type { DataView };

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface StatusGridPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface StatusGridPluginStart {}

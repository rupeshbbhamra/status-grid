import { DashboardHeaderPlugin } from './plugin';

export function plugin() {
  return new DashboardHeaderPlugin();
}

export type { DashboardHeaderPluginSetup, DashboardHeaderPluginStart } from './types';

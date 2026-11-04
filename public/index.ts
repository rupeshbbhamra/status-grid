import { StatusGridPlugin } from './plugin';

export function plugin() {
  return new StatusGridPlugin();
}

export type { StatusGridPluginSetup, StatusGridPluginStart } from './types';

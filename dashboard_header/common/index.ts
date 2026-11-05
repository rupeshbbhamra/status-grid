export const PLUGIN_ID = 'dashboardHeader';
export const DASHBOARD_HEADER_TYPE = 'dashboard_header';
export const ADD_DASHBOARD_HEADER_ACTION_ID = 'ADD_DASHBOARD_HEADER_PANEL';

/**
 * Kibana's add-panel trigger id. It lives in the uiActions plugin's `common` folder, which
 * external plugins can't import at runtime, so the value is copied here.
 */
export const ADD_PANEL_TRIGGER = 'ADD_PANEL_TRIGGER';

export * from './colors';
export * from './header_types';

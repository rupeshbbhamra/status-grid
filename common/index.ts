export const PLUGIN_ID = 'statusGrid';
export const STATUS_GRID_EMBEDDABLE_TYPE = 'status_grid';
export const ADD_STATUS_GRID_ACTION_ID = 'ADD_STATUS_GRID_PANEL';

/**
 * Kibana trigger ids. They live in the uiActions plugin's `common` folder, which external
 * plugins can't import at runtime, so the values are copied here (same in 9.5.4 and 9.5.6).
 */
export const ADD_PANEL_TRIGGER = 'ADD_PANEL_TRIGGER';
export const ON_APPLY_FILTER = 'on_apply_filter';

export const STYLED_TITLE_EMBEDDABLE_TYPE = 'styled_title';
export const ADD_STYLED_TITLE_ACTION_ID = 'ADD_STYLED_TITLE_PANEL';

export * from './types';
export * from './status_logic';
export * from './title_types';

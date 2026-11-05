export type StatusLevel = 'ok' | 'warning' | 'critical' | 'unknown';

export type GridMode = 'status' | 'metric';
export type MetricAgg = 'count' | 'avg' | 'max' | 'min' | 'sum' | 'last';
export type SortBy = 'name' | 'severity';

/**
 * Everything the panel needs to know to query and draw. Saved with the dashboard.
 */
export interface StatusGridConfig {
  /** Data view to query. */
  dataViewId?: string;
  /** Keyword field: one tile per distinct value (e.g. service.name). */
  entityField?: string;

  /** 'status' = color from a text field's latest value. 'metric' = color from a number vs thresholds. */
  mode: GridMode;

  // ---- status mode ----
  /** Keyword field holding the status text (e.g. status, health). */
  statusField?: string;
  /** Comma-separated values that mean OK / warning / critical (case-insensitive). */
  okValues: string;
  warningValues: string;
  criticalValues: string;

  // ---- metric mode ----
  metricField?: string;
  metricAgg: MetricAgg;
  warningThreshold?: number;
  criticalThreshold?: number;
  /** true: bigger numbers are worse (CPU %, error count). false: smaller is worse (uptime %, free disk). */
  higherIsWorse: boolean;

  // ---- display ----
  maxEntities: number;
  sortBy: SortBy;
  showValue: boolean;
  /** Minimum tile width in px. */
  tileMinWidth: number;
}

export const DEFAULT_CONFIG: Required<
  Pick<
    StatusGridConfig,
    | 'mode'
    | 'okValues'
    | 'warningValues'
    | 'criticalValues'
    | 'metricAgg'
    | 'higherIsWorse'
    | 'maxEntities'
    | 'sortBy'
    | 'showValue'
    | 'tileMinWidth'
  >
> = {
  mode: 'status',
  okValues: 'ok, up, green, healthy, running, resolved, closed',
  warningValues: 'warning, warn, degraded, yellow, pending, in progress',
  criticalValues: 'critical, down, red, error, failed, unhealthy, open',
  metricAgg: 'avg',
  higherIsWorse: true,
  maxEntities: 100,
  sortBy: 'severity',
  showValue: true,
  tileMinWidth: 140,
};

export interface StatusCell {
  key: string;
  /** Raw status text, or the metric number. */
  value: string | number | null;
  status: StatusLevel;
  /** ISO timestamp of the newest document for this entity, when the data view has a time field. */
  lastSeen?: string;
  docCount: number;
}

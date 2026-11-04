import type { StatusCell, StatusGridConfig, StatusLevel } from './types';

const SEVERITY_ORDER: Record<StatusLevel, number> = {
  critical: 0,
  warning: 1,
  unknown: 2,
  ok: 3,
};

/** Returns a config problem a person should fix, or undefined when the panel can query. */
export function getConfigProblem(cfg: StatusGridConfig): string | undefined {
  if (!cfg.dataViewId) return 'Choose a data view.';
  if (!cfg.entityField) return 'Choose the field that names each tile.';
  if (cfg.mode === 'status' && !cfg.statusField) return 'Choose the status field.';
  if (cfg.mode === 'metric') {
    if (cfg.metricAgg !== 'count' && !cfg.metricField) return 'Choose the metric field.';
    if (cfg.warningThreshold === undefined && cfg.criticalThreshold === undefined) {
      return 'Set a warning or critical threshold.';
    }
  }
  return undefined;
}

export function parseValueList(list: string | undefined): Set<string> {
  return new Set(
    (list ?? '')
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function classifyStatusText(value: unknown, cfg: StatusGridConfig): StatusLevel {
  if (value === null || value === undefined) return 'unknown';
  const v = String(value).trim().toLowerCase();
  // critical is checked first so a value listed twice by mistake errs on the loud side
  if (parseValueList(cfg.criticalValues).has(v)) return 'critical';
  if (parseValueList(cfg.warningValues).has(v)) return 'warning';
  if (parseValueList(cfg.okValues).has(v)) return 'ok';
  return 'unknown';
}

export function classifyMetric(value: unknown, cfg: StatusGridConfig): StatusLevel {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'unknown';
  const { warningThreshold: warn, criticalThreshold: crit, higherIsWorse } = cfg;
  const breaches = (t: number | undefined) =>
    t !== undefined && (higherIsWorse ? value >= t : value <= t);
  if (breaches(crit)) return 'critical';
  if (breaches(warn)) return 'warning';
  return 'ok';
}

/**
 * Builds the `aggs` section of the Elasticsearch request.
 * Filters, query and time range are added by Kibana's SearchSource.
 */
export function buildAggs(cfg: StatusGridConfig, timeField?: string): Record<string, unknown> {
  const subAggs: Record<string, unknown> = {};

  const latestHit = (field: string) => ({
    top_hits: {
      size: 1,
      _source: false,
      docvalue_fields: [field],
      ...(timeField ? { sort: [{ [timeField]: { order: 'desc' } }] } : {}),
    },
  });

  if (cfg.mode === 'status') {
    subAggs.latest = latestHit(cfg.statusField!);
  } else if (cfg.metricAgg === 'count') {
    // the bucket's doc_count is the value; no sub-aggregation needed
  } else if (cfg.metricAgg === 'last') {
    subAggs.latest = latestHit(cfg.metricField!);
  } else {
    subAggs.metric = { [cfg.metricAgg]: { field: cfg.metricField } };
  }

  if (timeField) {
    subAggs.last_seen = { max: { field: timeField } };
  }

  return {
    entities: {
      terms: {
        field: cfg.entityField,
        size: Math.max(1, Math.min(cfg.maxEntities || 100, 1000)),
        order: { _key: 'asc' },
      },
      aggs: subAggs,
    },
  };
}

interface Bucket {
  key: string | number;
  key_as_string?: string;
  doc_count: number;
  latest?: { hits?: { hits?: Array<{ fields?: Record<string, unknown[]> }> } };
  metric?: { value: number | null };
  last_seen?: { value: number | null; value_as_string?: string };
}

/** Turns the Elasticsearch aggregation response into tiles. */
export function parseResponse(
  aggregations: Record<string, unknown> | undefined,
  cfg: StatusGridConfig
): StatusCell[] {
  const buckets = ((aggregations?.entities as { buckets?: Bucket[] })?.buckets ?? []) as Bucket[];

  const cells: StatusCell[] = buckets.map((b) => {
    let value: string | number | null = null;

    if (cfg.mode === 'metric' && cfg.metricAgg === 'count') {
      value = b.doc_count;
    } else if (b.latest) {
      const field = cfg.mode === 'status' ? cfg.statusField! : cfg.metricField!;
      const raw = b.latest.hits?.hits?.[0]?.fields?.[field]?.[0];
      value = raw === undefined || raw === null ? null : (raw as string | number);
    } else if (b.metric) {
      value = b.metric.value;
    }

    const status =
      cfg.mode === 'status' ? classifyStatusText(value, cfg) : classifyMetric(value, cfg);

    const lastSeen =
      b.last_seen?.value_as_string ??
      (typeof b.last_seen?.value === 'number' ? new Date(b.last_seen.value).toISOString() : undefined);

    return {
      key: b.key_as_string ?? String(b.key),
      value,
      status,
      lastSeen,
      docCount: b.doc_count,
    };
  });

  return sortCells(cells, cfg.sortBy);
}

export function sortCells(cells: StatusCell[], sortBy: StatusGridConfig['sortBy']): StatusCell[] {
  const byName = (a: StatusCell, b: StatusCell) =>
    a.key.localeCompare(b.key, undefined, { numeric: true, sensitivity: 'base' });
  const sorted = [...cells];
  if (sortBy === 'severity') {
    sorted.sort((a, b) => SEVERITY_ORDER[a.status] - SEVERITY_ORDER[b.status] || byName(a, b));
  } else {
    sorted.sort(byName);
  }
  return sorted;
}

export function summarize(cells: StatusCell[]): Record<StatusLevel, number> {
  const out: Record<StatusLevel, number> = { ok: 0, warning: 0, critical: 0, unknown: 0 };
  for (const c of cells) out[c.status] += 1;
  return out;
}

export function formatValue(value: StatusCell['value']): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return value.toLocaleString();
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return String(value);
}

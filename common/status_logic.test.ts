import {
  buildAggs,
  classifyMetric,
  classifyStatusText,
  getConfigProblem,
  parseResponse,
} from './status_logic';
import { DEFAULT_CONFIG, type StatusGridConfig } from './types';

const statusCfg: StatusGridConfig = {
  ...DEFAULT_CONFIG,
  dataViewId: 'dv',
  entityField: 'service.name',
  statusField: 'status',
};

const metricCfg: StatusGridConfig = {
  ...DEFAULT_CONFIG,
  dataViewId: 'dv',
  entityField: 'host.name',
  mode: 'metric',
  metricField: 'cpu.pct',
  metricAgg: 'avg',
  warningThreshold: 70,
  criticalThreshold: 90,
};

describe('classifyStatusText', () => {
  it('maps listed values case-insensitively', () => {
    expect(classifyStatusText('UP', statusCfg)).toBe('ok');
    expect(classifyStatusText(' Degraded ', statusCfg)).toBe('warning');
    expect(classifyStatusText('down', statusCfg)).toBe('critical');
  });
  it('treats unlisted or missing values as unknown', () => {
    expect(classifyStatusText('maintenance', statusCfg)).toBe('unknown');
    expect(classifyStatusText(null, statusCfg)).toBe('unknown');
  });
});

describe('classifyMetric', () => {
  it('higher is worse', () => {
    expect(classifyMetric(50, metricCfg)).toBe('ok');
    expect(classifyMetric(70, metricCfg)).toBe('warning');
    expect(classifyMetric(95, metricCfg)).toBe('critical');
  });
  it('lower is worse', () => {
    const cfg = { ...metricCfg, higherIsWorse: false, warningThreshold: 20, criticalThreshold: 5 };
    expect(classifyMetric(50, cfg)).toBe('ok');
    expect(classifyMetric(15, cfg)).toBe('warning');
    expect(classifyMetric(5, cfg)).toBe('critical');
  });
  it('works with only one threshold', () => {
    const cfg = { ...metricCfg, warningThreshold: undefined };
    expect(classifyMetric(80, cfg)).toBe('ok');
    expect(classifyMetric(91, cfg)).toBe('critical');
  });
  it('no value is unknown', () => {
    expect(classifyMetric(null, metricCfg)).toBe('unknown');
  });
});

describe('getConfigProblem', () => {
  it('flags missing pieces', () => {
    expect(getConfigProblem({ ...DEFAULT_CONFIG })).toMatch(/data view/);
    expect(getConfigProblem({ ...statusCfg, statusField: undefined })).toMatch(/status field/);
    expect(
      getConfigProblem({ ...metricCfg, warningThreshold: undefined, criticalThreshold: undefined })
    ).toMatch(/threshold/);
    expect(getConfigProblem(statusCfg)).toBeUndefined();
    expect(getConfigProblem(metricCfg)).toBeUndefined();
  });
});

describe('buildAggs', () => {
  it('status mode uses latest document by time', () => {
    const aggs = buildAggs(statusCfg, '@timestamp') as any;
    expect(aggs.entities.terms.field).toBe('service.name');
    expect(aggs.entities.aggs.latest.top_hits.sort).toEqual([{ '@timestamp': { order: 'desc' } }]);
    expect(aggs.entities.aggs.latest.top_hits.docvalue_fields).toEqual(['status']);
    expect(aggs.entities.aggs.last_seen).toEqual({ max: { field: '@timestamp' } });
  });
  it('metric mode uses the chosen aggregation', () => {
    const aggs = buildAggs(metricCfg, undefined) as any;
    expect(aggs.entities.aggs.metric).toEqual({ avg: { field: 'cpu.pct' } });
    expect(aggs.entities.aggs.last_seen).toBeUndefined();
  });
  it('count mode needs no field and uses doc_count', () => {
    const cfg = { ...metricCfg, metricAgg: 'count' as const, metricField: undefined, warningThreshold: 1, criticalThreshold: 5 };
    expect(getConfigProblem(cfg)).toBeUndefined();
    const aggs = buildAggs(cfg) as any;
    expect(Object.keys(aggs.entities.aggs)).toEqual([]);
    const cells = parseResponse({ entities: { buckets: [{ key: 'Email', doc_count: 7 }, { key: 'VPN', doc_count: 0 }] } }, cfg);
    expect(cells.map((c) => [c.key, c.value, c.status])).toEqual([['Email', 7, 'critical'], ['VPN', 0, 'ok']]);
  });
  it('caps tile count', () => {
    const aggs = buildAggs({ ...statusCfg, maxEntities: 99999 }) as any;
    expect(aggs.entities.terms.size).toBe(1000);
  });
});

describe('parseResponse', () => {
  it('turns buckets into tiles, worst first', () => {
    const cells = parseResponse(
      {
        entities: {
          buckets: [
            { key: 'api', doc_count: 4, latest: { hits: { hits: [{ fields: { status: ['up'] } }] } }, last_seen: { value: 1730000000000, value_as_string: '2024-10-27T03:33:20.000Z' } },
            { key: 'db', doc_count: 2, latest: { hits: { hits: [{ fields: { status: ['down'] } }] } } },
            { key: 'cache', doc_count: 1, latest: { hits: { hits: [{ fields: { status: ['degraded'] } }] } } },
            { key: 'web', doc_count: 1, latest: { hits: { hits: [] } } },
          ],
        },
      },
      statusCfg
    );
    expect(cells.map((c) => [c.key, c.status])).toEqual([
      ['db', 'critical'],
      ['cache', 'warning'],
      ['web', 'unknown'],
      ['api', 'ok'],
    ]);
    expect(cells.find((c) => c.key === 'api')!.lastSeen).toBe('2024-10-27T03:33:20.000Z');
  });
  it('handles metric buckets and empty responses', () => {
    const cells = parseResponse(
      { entities: { buckets: [{ key: 'h1', doc_count: 3, metric: { value: 92.5 } }] } },
      { ...metricCfg, sortBy: 'name' }
    );
    expect(cells[0]).toMatchObject({ key: 'h1', value: 92.5, status: 'critical' });
    expect(parseResponse(undefined, statusCfg)).toEqual([]);
  });
});

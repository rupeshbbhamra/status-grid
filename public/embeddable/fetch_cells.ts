import { lastValueFrom } from 'rxjs';
import type { DataPublicPluginStart } from '@kbn/data-plugin/public';
import type { DataView } from '@kbn/data-views-plugin/common';
import type { AggregateQuery, Filter, Query, TimeRange } from '@kbn/es-query';
import { buildAggs, parseResponse, type StatusCell, type StatusGridConfig } from '../../common';

/**
 * Runs one aggregation request that respects the dashboard's filters, query bar and time picker.
 */
export async function fetchCells({
  config,
  dataView,
  data,
  filters,
  query,
  timeRange,
  abortSignal,
  sessionId,
}: {
  config: StatusGridConfig;
  dataView: DataView;
  data: DataPublicPluginStart;
  filters: Filter[];
  query?: Query | AggregateQuery;
  timeRange?: TimeRange;
  abortSignal: AbortSignal;
  sessionId?: string;
}): Promise<StatusCell[]> {
  const searchSource = await data.search.searchSource.create();
  searchSource.setField('index', dataView);
  searchSource.setField('size', 0);
  searchSource.setField('trackTotalHits', false);

  const allFilters = [...filters];
  const timeFilter = timeRange
    ? data.query.timefilter.timefilter.createFilter(dataView, timeRange)
    : undefined;
  if (timeFilter) allFilters.push(timeFilter);
  searchSource.setField('filter', allFilters);

  // ES|QL queries on the dashboard can't be applied to an aggregation request, so they're skipped.
  if (query && 'query' in query) {
    searchSource.setField('query', query);
  }

  searchSource.setField('aggs', buildAggs(config, dataView.timeFieldName));

  const { rawResponse } = await lastValueFrom(
    searchSource.fetch$({ abortSignal, sessionId, legacyHitsTotal: false })
  );

  return parseResponse(rawResponse.aggregations as Record<string, unknown> | undefined, config);
}

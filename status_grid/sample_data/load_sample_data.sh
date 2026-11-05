#!/usr/bin/env bash
# Loads a small "service-status-demo" index so you can try the Status grid panel.
#
# Usage:
#   ES_URL=https://localhost:9200 ES_USER=elastic ES_PASS=changeme ./load_sample_data.sh
#
# Then in Kibana create a data view for "service-status-demo" with @timestamp as the time field.

set -euo pipefail
ES_URL="${ES_URL:-http://localhost:9200}"
AUTH=()
[[ -n "${ES_USER:-}" ]] && AUTH=(-u "${ES_USER}:${ES_PASS:-}")
CURL=(curl -sS -k "${AUTH[@]}" -H 'Content-Type: application/json')
INDEX=service-status-demo

"${CURL[@]}" -X DELETE "$ES_URL/$INDEX" >/dev/null || true
"${CURL[@]}" -X PUT "$ES_URL/$INDEX" -d '{
  "mappings": { "properties": {
    "@timestamp":   { "type": "date" },
    "service.name": { "type": "keyword" },
    "status":       { "type": "keyword" },
    "cpu.pct":      { "type": "float" },
    "env":          { "type": "keyword" }
  } }
}' >/dev/null

services=(auth-api billing-api cart-api catalog-api checkout-api email-worker \
          inventory-api orders-api payments-gw reports-job search-api ticket-sync)
statuses=(up up up up up up degraded down up up up up)
cpus=(22 35 41 18 77 12 69 96 55 31 48 88)

now=$(date -u +%s)
bulk=""
for i in "${!services[@]}"; do
  for back in 30 20 10 1; do   # 4 docs per service, newest wins
    ts=$(date -u -d "@$((now - back*60))" +%Y-%m-%dT%H:%M:%SZ)
    st=${statuses[$i]}
    [[ $back -gt 1 ]] && st=up   # older docs were healthy, so "latest status" really matters
    cpu=$(( cpus[i] - back/2 ))
    env=$([[ $((i % 2)) -eq 0 ]] && echo prod || echo staging)
    bulk+='{"index":{"_index":"'$INDEX'"}}'$'\n'
    bulk+='{"@timestamp":"'$ts'","service.name":"'${services[$i]}'","status":"'$st'","cpu.pct":'$cpu',"env":"'$env'"}'$'\n'
  done
done

printf '%s' "$bulk" | "${CURL[@]}" -X POST "$ES_URL/_bulk?refresh=true" --data-binary @- \
  | grep -q '"errors":false' && echo "Loaded $(( ${#services[@]} * 4 )) docs into $INDEX" \
  || { echo "Bulk load reported errors"; exit 1; }

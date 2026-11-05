# Status grid — Kibana dashboard panel

Adds a **Status grid** panel to Kibana dashboards: one tile per service, host, queue
or anything else, colored green / yellow / red.

- **Latest status mode** — each tile takes the newest document's status text
  (e.g. `up`, `degraded`, `down`). You choose which words mean green, yellow and red.
- **Metric threshold mode** — each tile takes a document count, or avg / max / min / sum /
  last value of a number field, and compares it to your yellow and red thresholds
  (higher-is-worse or lower-is-worse).
- Follows the dashboard's time picker, query bar and filters.
- Click a tile to filter the whole dashboard to that entity.
- Summary counts on top, worst-first ordering, hover for value, last-seen time and doc count.

Built for **Kibana 9.5.4** (checked against the 9.5.4 source APIs).

## Folder layout

```
kibana.json                 plugin manifest
common/                     query building + color logic (no Kibana imports, unit-tested)
public/plugin.ts            registers the panel and the "Add panel" menu item
public/embeddable/          the panel: fetching data, rendering tiles, click-to-filter
public/editor/              the settings flyout (add / edit)
public/actions/             "Add panel → Status grid" menu action
sample_data/                script that loads demo data to try it out
```

## Build it on GitHub (easiest)

The repo's workflow (`.github/workflows/main.yml`) builds the installable zip on GitHub's servers.

1. Push this folder to a GitHub repo (private is fine), with `kibana.json` at the repo root.
2. **Actions → Build Kibana plugin → Run workflow**, enter your exact Kibana version (default 9.5.4).
3. Wait ~30–60 minutes. Open the finished run → **Artifacts → statusGrid-9.5.4** to download.
4. GitHub wraps artifacts in a zip: unzip the download once to get `statusGrid-9.5.4.zip` —
   that inner file is what you install.

Pushing a tag such as `v1.0.0` also builds it and attaches `statusGrid-9.5.4.zip` directly
to a GitHub Release, with no extra unzip step.

## Build it on your own machine

Kibana plugins must be built inside a Kibana source checkout of **the exact version**
you run. For 9.5.4:

```bash
git clone --depth 1 --branch v9.5.4 https://github.com/elastic/kibana.git
cd kibana
nvm install                     # uses the Node version in .nvmrc (24.19.0 for 9.5.4)
npm install -g yarn@1.22.22     # Kibana 9.5.4 uses yarn (pnpm only from 9.5.6)
cp -r /path/to/status_grid plugins/status_grid
yarn kbn bootstrap

cd plugins/status_grid
node ../../scripts/plugin_helpers build --kibana-version 9.5.4
```

The installable zip is written to `plugins/status_grid/build/statusGrid-9.5.4.zip`.

Bootstrap downloads a lot and takes a while the first time — use a machine with
16 GB+ RAM.

## Install it

On the Kibana server (self-managed only — Elastic Cloud doesn't allow custom plugins):

```bash
bin/kibana-plugin install file:///path/to/statusGrid-9.5.4.zip
# restart Kibana
```

Remove with `bin/kibana-plugin remove statusGrid`.

## Develop with live reload

From the Kibana checkout root:

```bash
yarn es snapshot            # terminal 1: local Elasticsearch
yarn start                  # terminal 2: Kibana in dev mode, picks up plugins/status_grid
```

## Try it with sample data

```bash
ES_URL=http://localhost:9200 ES_USER=elastic ES_PASS=changeme ./sample_data/load_sample_data.sh
```

Then:

1. **Stack Management → Data views → Create** for `service-status-demo`, time field `@timestamp`.
2. Open a dashboard → **Add panel → Status grid** (under *Other visualizations*).
3. *One tile per*: `service.name`, *Status field*: `status`. You should see 1 red, 1 yellow, 10 green.
4. Edit the panel and switch to **Metric threshold**: `cpu.pct`, Average, yellow 70, red 90.

## Using it with BMC Helix data

Typical setups once tickets/CIs are indexed:

| Goal | One tile per | Mode | Field / thresholds |
|---|---|---|---|
| Service health from monitoring events | `service.name` | Latest status | `status` |
| Open incidents per business service | `business_service` | Metric, Count | yellow 1, red 5 |
| Oldest open ticket age per support group | `assigned_group` | Metric, Max | `age_hours`, yellow 24, red 72 |
| CI operational state | `ci.name` | Latest status | `ci.status` |

Add a dashboard filter such as `status: Open` to scope the tiles.

## Run the logic tests

```bash
# from the Kibana checkout root
yarn test:jest plugins/status_grid/common
```

## Upgrading Kibana

Rebuild against the new version's source (`--kibana-version x.y.z`). Note that from 9.5.6 Kibana uses pnpm instead of yarn, so swap `yarn` for `pnpm` in the commands above. If the build fails,
compare `public/embeddable/status_grid_embeddable.tsx` with
`examples/embeddable_examples/public/react_embeddables/search/` in that Kibana
version — the panel APIs follow that example.

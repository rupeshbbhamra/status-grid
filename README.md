# Kibana dashboard plugins

Two independent Kibana 9.5.4 plugins, built together by one GitHub workflow:

| Folder | Plugin | What it adds |
|---|---|---|
| [`status_grid/`](status_grid/README.md) | `statusGrid` | **Status grid** panel: one green / yellow / red tile per service, host or group |
| [`dashboard_header/`](dashboard_header/README.md) | `dashboardHeader` | **Dashboard header** panel: the dashboard's name as a styled title, readable in light and dark themes |

Install either or both — they don't depend on each other.

## Build

Every push to `main` that changes a plugin builds both. To build by hand:
**Actions → Build Kibana plugin → Run workflow**.

When the run finishes, open it and download the artifacts **statusGrid-9.5.4** and
**dashboardHeader-9.5.4**. GitHub wraps each in an extra zip — unzip it once, and the zip inside
is the file to install.

## Install (works offline)

```bash
cd /usr/share/kibana
sudo -u kibana bin/kibana-plugin install file:///tmp/statusGrid-9.5.4.zip
sudo -u kibana bin/kibana-plugin install file:///tmp/dashboardHeader-9.5.4.zip
sudo systemctl restart kibana
```

To upgrade, `bin/kibana-plugin remove <pluginId>` first, then install the new zip.
Plugins must be built for your exact Kibana version.

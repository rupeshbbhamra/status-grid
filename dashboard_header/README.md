# Dashboard header — Kibana dashboard panel

Adds **Add panel → Annotations and Navigation → Dashboard header**: a styled title for the top
of a dashboard (or any section of it).

- **Dashboard name, automatically.** The title shows the dashboard's saved name and updates by
  itself when the dashboard is renamed. Or type your own title.
- **Subtitle** from the dashboard's description, your own text, or none.
- **Small label** above the title (e.g. a team or system name), plus the **time range** and
  **last refreshed** time if you want them.
- **Colors that work in light and dark themes.** Pick one of 9 colors (or any custom color) and a
  background style: none, side bar, underline, soft tint or solid. Every text color is
  computed for the current theme and checked for contrast (WCAG AA 4.5:1), so it stays readable
  when someone switches Kibana to dark mode.
- **8 fonts**: Kibana's Inter and Roboto Mono, plus 6 bundled display fonts — Montserrat,
  Poppins, Space Grotesk, Oswald, Rajdhani and Playfair Display. The font files ship inside the
  plugin, so they work on Kibana servers with no internet access.
- Title size 14–96 px, subtitle size, weight, alignment, ALL CAPS, spacing, and 44 icons
  (optionally in a colored circle).
- **10 quick styles** that change the look but keep your text.
- The settings panel shows a **live preview in both light and dark themes** side by side.
- New headers start with Kibana's panel frame hidden, so they look like part of the dashboard.

Built for **Kibana 9.5.4**.

## Install

Build with the GitHub workflow in this repo, download the `dashboardHeader-9.5.4` artifact,
unzip it once, then on the Kibana server:

```bash
cd /usr/share/kibana
sudo -u kibana bin/kibana-plugin install file:///tmp/dashboardHeader-9.5.4.zip
sudo systemctl restart kibana
```

Remove with `bin/kibana-plugin remove dashboardHeader`.

## Fonts and licenses

The six display fonts are from Google Fonts (via Fontsource), latin subset, weights 500 and
700, under the SIL Open Font License 1.1 — see `public/fonts/licenses/`. They're loaded only
when a header that uses them is on screen.

## Tests

`common/colors.test.ts` checks 510 text/background combinations (2 themes × 5 background
styles × 17 colors, including deliberately awkward custom colors) for WCAG contrast.

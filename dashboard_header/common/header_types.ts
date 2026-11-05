import { isHex, PALETTE, type BackgroundStyle, type ColorName } from './colors';

export type FontId =
  | 'kibana'
  | 'montserrat'
  | 'poppins'
  | 'playfair'
  | 'oswald'
  | 'spaceGrotesk'
  | 'rajdhani'
  | 'mono';

export const FONTS: Array<{ id: FontId; label: string; note: string }> = [
  { id: 'kibana', label: 'Inter (Kibana)', note: 'Matches the rest of Kibana' },
  { id: 'montserrat', label: 'Montserrat', note: 'Wide, modern headline' },
  { id: 'poppins', label: 'Poppins', note: 'Round, friendly' },
  { id: 'spaceGrotesk', label: 'Space Grotesk', note: 'Techy, distinctive' },
  { id: 'oswald', label: 'Oswald', note: 'Tall, condensed — great for wall screens' },
  { id: 'rajdhani', label: 'Rajdhani', note: 'Squared, control-room look' },
  { id: 'playfair', label: 'Playfair Display', note: 'Elegant serif for reports' },
  { id: 'mono', label: 'Roboto Mono (Kibana)', note: 'Monospace' },
];

export type TitleSource = 'dashboard' | 'custom';
export type SubtitleSource = 'none' | 'description' | 'custom';
export type Align = 'left' | 'center' | 'right';
export type Weight = 'medium' | 'bold';
export type Padding = 's' | 'm' | 'l';

export interface HeaderConfig {
  // ---- content ----
  /** 'dashboard' = the dashboard's saved name, updated automatically when renamed. */
  titleSource: TitleSource;
  customTitle: string;
  /** 'description' = the dashboard's saved description. */
  subtitleSource: SubtitleSource;
  customSubtitle: string;
  /** Small label above the title, e.g. a team or system name. */
  eyebrow: string;
  showTimeRange: boolean;
  /** "Updated 14:05" — refreshes every time the dashboard reloads data. */
  showUpdated: boolean;

  // ---- look ----
  color: ColorName;
  customColor: string;
  backgroundStyle: BackgroundStyle;
  font: FontId;
  titleSize: number;
  subtitleSize: number;
  weight: Weight;
  align: Align;
  uppercase: boolean;
  /** EUI icon name, '' for none. */
  icon: string;
  iconBadge: boolean;
  padding: Padding;
}

export const DEFAULT_HEADER: HeaderConfig = {
  titleSource: 'dashboard',
  customTitle: '',
  subtitleSource: 'description',
  customSubtitle: '',
  eyebrow: '',
  showTimeRange: true,
  showUpdated: false,
  color: 'blue',
  customColor: '',
  backgroundStyle: 'bar',
  font: 'kibana',
  titleSize: 30,
  subtitleSize: 14,
  weight: 'bold',
  align: 'left',
  uppercase: false,
  icon: 'dashboardApp',
  iconBadge: true,
  padding: 'm',
};

type StyleKeys =
  | 'color'
  | 'customColor'
  | 'backgroundStyle'
  | 'font'
  | 'titleSize'
  | 'subtitleSize'
  | 'weight'
  | 'align'
  | 'uppercase'
  | 'icon'
  | 'iconBadge'
  | 'padding';

export interface HeaderPreset {
  id: string;
  name: string;
  style: Partial<Pick<HeaderConfig, StyleKeys>>;
}

/** Presets change only the look, never the text. Every one works in light and dark themes. */
export const PRESETS: HeaderPreset[] = [
  { id: 'accent', name: 'Accent bar', style: { color: 'blue', backgroundStyle: 'bar', font: 'kibana', titleSize: 30, weight: 'bold', align: 'left', uppercase: false, icon: 'dashboardApp', iconBadge: true } },
  { id: 'clean', name: 'Clean', style: { color: 'slate', backgroundStyle: 'none', font: 'kibana', titleSize: 28, weight: 'bold', align: 'left', uppercase: false, icon: '', iconBadge: false } },
  { id: 'underline', name: 'Underline', style: { color: 'teal', backgroundStyle: 'underline', font: 'montserrat', titleSize: 28, weight: 'bold', align: 'left', uppercase: false, icon: '', iconBadge: false } },
  { id: 'soft', name: 'Soft tint', style: { color: 'teal', backgroundStyle: 'tint', font: 'poppins', titleSize: 28, weight: 'bold', align: 'left', uppercase: false, icon: 'visBarVertical', iconBadge: true } },
  { id: 'banner', name: 'Bold banner', style: { color: 'blue', backgroundStyle: 'solid', font: 'montserrat', titleSize: 32, weight: 'bold', align: 'left', uppercase: false, icon: 'dashboardApp', iconBadge: true } },
  { id: 'ops', name: 'Ops wall screen', style: { color: 'slate', backgroundStyle: 'solid', font: 'oswald', titleSize: 40, weight: 'bold', align: 'center', uppercase: true, icon: 'online', iconBadge: false } },
  { id: 'control', name: 'Control room', style: { color: 'green', backgroundStyle: 'bar', font: 'rajdhani', titleSize: 34, weight: 'bold', align: 'left', uppercase: true, icon: 'compute', iconBadge: true } },
  { id: 'modern', name: 'Modern', style: { color: 'purple', backgroundStyle: 'tint', font: 'spaceGrotesk', titleSize: 30, weight: 'bold', align: 'left', uppercase: false, icon: 'sparkles', iconBadge: true } },
  { id: 'executive', name: 'Executive', style: { color: 'purple', backgroundStyle: 'underline', font: 'playfair', titleSize: 34, weight: 'bold', align: 'center', uppercase: false, icon: '', iconBadge: false } },
  { id: 'alert', name: 'Incident alert', style: { color: 'red', backgroundStyle: 'solid', font: 'kibana', titleSize: 26, weight: 'bold', align: 'left', uppercase: false, icon: 'warning', iconBadge: false } },
];

/** EUI icons offered in the picker. */
export const ICONS: string[] = [
  'dashboardApp', 'visBarVertical', 'visLine', 'visPie', 'visGauge', 'visMetric', 'visTable',
  'online', 'offline', 'warning', 'alert', 'error', 'checkInCircleFilled', 'bell', 'clock',
  'calendar', 'users', 'user', 'globe', 'cloudSunny', 'cloudStormy', 'compute', 'database',
  'storage', 'node', 'wrench', 'gear', 'bug', 'flag', 'starFilled', 'heart', 'bolt',
  'securityApp', 'lock', 'logoElastic', 'timeline', 'list', 'document', 'email', 'tag',
  'sparkles', 'briefcase', 'home', 'cheer',
];

export const applyPreset = (config: HeaderConfig, presetId: string): HeaderConfig => {
  const p = PRESETS.find((x) => x.id === presetId);
  return p ? { ...config, ...p.style } : config;
};

const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback;

const clamp = (n: unknown, min: number, max: number, fallback: number) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback;
};

/** Fills gaps and repairs bad values from older or hand-edited saved state. */
export function normalizeHeader(raw: Partial<HeaderConfig> | undefined): HeaderConfig {
  const c = { ...DEFAULT_HEADER, ...(raw ?? {}) };
  const colorNames = [...(Object.keys(PALETTE) as ColorName[]), 'custom' as ColorName];
  return {
    titleSource: oneOf(c.titleSource, ['dashboard', 'custom'] as const, 'dashboard'),
    customTitle: String(c.customTitle ?? '').slice(0, 200),
    subtitleSource: oneOf(c.subtitleSource, ['none', 'description', 'custom'] as const, 'description'),
    customSubtitle: String(c.customSubtitle ?? '').slice(0, 1000),
    eyebrow: String(c.eyebrow ?? '').slice(0, 100),
    showTimeRange: Boolean(c.showTimeRange),
    showUpdated: Boolean(c.showUpdated),
    color: oneOf(c.color, colorNames, 'blue'),
    customColor: isHex(c.customColor) ? c.customColor.trim() : '',
    backgroundStyle: oneOf(c.backgroundStyle, ['none', 'bar', 'underline', 'tint', 'solid'] as const, 'bar'),
    font: oneOf(c.font, FONTS.map((f) => f.id), 'kibana'),
    titleSize: clamp(c.titleSize, 14, 96, DEFAULT_HEADER.titleSize),
    subtitleSize: clamp(c.subtitleSize, 10, 40, DEFAULT_HEADER.subtitleSize),
    weight: oneOf(c.weight, ['medium', 'bold'] as const, 'bold'),
    align: oneOf(c.align, ['left', 'center', 'right'] as const, 'left'),
    uppercase: Boolean(c.uppercase),
    icon: ICONS.includes(c.icon) ? c.icon : '',
    iconBadge: Boolean(c.iconBadge),
    padding: oneOf(c.padding, ['s', 'm', 'l'] as const, 'm'),
  };
}

/** What the header actually displays, given what the dashboard publishes. */
export function resolveText(
  c: HeaderConfig,
  dashboard: { title?: string; description?: string }
): { title: string; subtitle: string; usingDashboardName: boolean } {
  const dashTitle = (dashboard.title ?? '').trim();
  const title =
    c.titleSource === 'dashboard'
      ? dashTitle || 'Untitled dashboard'
      : c.customTitle.trim() || dashTitle || 'Untitled dashboard';
  const subtitle =
    c.subtitleSource === 'description'
      ? (dashboard.description ?? '').trim()
      : c.subtitleSource === 'custom'
      ? c.customSubtitle.trim()
      : '';
  return { title, subtitle, usingDashboardName: c.titleSource === 'dashboard' || !c.customTitle.trim() };
}

export const formatUpdated = (d: Date | undefined): string =>
  d
    ? `Updated ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
    : '';

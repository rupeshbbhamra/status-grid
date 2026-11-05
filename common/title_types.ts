export type TitleAlign = 'left' | 'center' | 'right';
export type TitleWeight = 'regular' | 'medium' | 'bold';
export type TitleFont = 'default' | 'serif' | 'mono';
export type TitlePadding = 's' | 'm' | 'l';

/** Everything a styled title panel saves with the dashboard. Empty color = follow Kibana's theme. */
export interface TitleConfig {
  text: string;
  subtitle: string;
  fontSize: number;
  subtitleSize: number;
  weight: TitleWeight;
  font: TitleFont;
  align: TitleAlign;
  uppercase: boolean;
  textColor: string;
  subtitleColor: string;
  backgroundColor: string;
  /** Colored bar on the left edge; empty for none. */
  accentColor: string;
  /** EUI icon name shown before the title; empty for none. */
  icon: string;
  /** Show the dashboard's current time range under the title. */
  showTimeRange: boolean;
  padding: TitlePadding;
}

export const DEFAULT_TITLE_CONFIG: TitleConfig = {
  text: 'Dashboard title',
  subtitle: '',
  fontSize: 28,
  subtitleSize: 14,
  weight: 'bold',
  font: 'default',
  align: 'left',
  uppercase: false,
  textColor: '',
  subtitleColor: '',
  backgroundColor: '',
  accentColor: '',
  icon: '',
  showTimeRange: false,
  padding: 'm',
};

export interface TitlePreset {
  id: string;
  name: string;
  /** Style only: presets never overwrite the person's text. */
  style: Partial<Omit<TitleConfig, 'text' | 'subtitle'>>;
}

export const TITLE_PRESETS: TitlePreset[] = [
  {
    id: 'plain',
    name: 'Plain heading',
    style: { fontSize: 28, weight: 'bold', align: 'left', textColor: '', subtitleColor: '', backgroundColor: '', accentColor: '', icon: '', uppercase: false, font: 'default' },
  },
  {
    id: 'blue-banner',
    name: 'Blue banner',
    style: { fontSize: 32, weight: 'bold', align: 'left', textColor: '#FFFFFF', subtitleColor: '#D6E6FF', backgroundColor: '#0B64DD', accentColor: '', icon: 'dashboardApp', uppercase: false },
  },
  {
    id: 'section',
    name: 'Section divider',
    style: { fontSize: 20, weight: 'medium', align: 'left', textColor: '', subtitleColor: '', backgroundColor: '', accentColor: '#0B64DD', icon: '', uppercase: true },
  },
  {
    id: 'noc',
    name: 'NOC wall screen',
    style: { fontSize: 40, weight: 'bold', align: 'center', textColor: '#FFFFFF', subtitleColor: '#A2ABBA', backgroundColor: '#1D1E24', accentColor: '', icon: 'online', uppercase: true },
  },
  {
    id: 'critical',
    name: 'Critical alert',
    style: { fontSize: 26, weight: 'bold', align: 'left', textColor: '#FFFFFF', subtitleColor: '#FFE0DE', backgroundColor: '#BD271E', accentColor: '', icon: 'warning', uppercase: false },
  },
  {
    id: 'warning',
    name: 'Warning note',
    style: { fontSize: 20, weight: 'medium', align: 'left', textColor: '#6A4906', subtitleColor: '#825803', backgroundColor: '#FEF1D6', accentColor: '#D6A100', icon: 'alert', uppercase: false },
  },
  {
    id: 'success',
    name: 'Healthy green',
    style: { fontSize: 26, weight: 'bold', align: 'left', textColor: '#FFFFFF', subtitleColor: '#D3F2EA', backgroundColor: '#007871', accentColor: '', icon: 'checkInCircleFilled', uppercase: false },
  },
  {
    id: 'purple',
    name: 'Executive purple',
    style: { fontSize: 34, weight: 'bold', align: 'center', textColor: '#FFFFFF', subtitleColor: '#E5DBFB', backgroundColor: '#6146B5', accentColor: '', icon: 'visBarVertical', uppercase: false, font: 'serif' },
  },
];

/** EUI icons offered in the picker — a curated, ITSM-friendly subset. */
export const TITLE_ICONS: string[] = [
  'dashboardApp', 'visBarVertical', 'visLine', 'visPie', 'visGauge', 'visMetric', 'visTable',
  'online', 'offline', 'warning', 'alert', 'error', 'checkInCircleFilled', 'bell', 'clock',
  'calendar', 'users', 'user', 'globe', 'cloudSunny', 'cloudStormy', 'compute', 'database',
  'storage', 'node', 'wrench', 'gear', 'bug', 'flag', 'starFilled', 'heart', 'bolt',
  'securityApp', 'lock', 'logoElastic', 'timeline', 'list', 'document', 'email', 'tag',
];

export const applyPreset = (config: TitleConfig, presetId: string): TitleConfig => {
  const preset = TITLE_PRESETS.find((p) => p.id === presetId);
  return preset ? { ...config, ...preset.style } : config;
};

const clamp = (n: unknown, min: number, max: number, fallback: number) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback;
};

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const cleanColor = (c: unknown) => (typeof c === 'string' && HEX.test(c.trim()) ? c.trim() : '');

/** Fills gaps and repairs out-of-range values from older or hand-edited saved state. */
export const normalizeTitleConfig = (raw: Partial<TitleConfig> | undefined): TitleConfig => {
  const c = { ...DEFAULT_TITLE_CONFIG, ...(raw ?? {}) };
  return {
    ...c,
    text: String(c.text ?? ''),
    subtitle: String(c.subtitle ?? ''),
    fontSize: clamp(c.fontSize, 12, 120, DEFAULT_TITLE_CONFIG.fontSize),
    subtitleSize: clamp(c.subtitleSize, 10, 60, DEFAULT_TITLE_CONFIG.subtitleSize),
    weight: (['regular', 'medium', 'bold'] as const).includes(c.weight) ? c.weight : 'bold',
    font: (['default', 'serif', 'mono'] as const).includes(c.font) ? c.font : 'default',
    align: (['left', 'center', 'right'] as const).includes(c.align) ? c.align : 'left',
    padding: (['s', 'm', 'l'] as const).includes(c.padding) ? c.padding : 'm',
    textColor: cleanColor(c.textColor),
    subtitleColor: cleanColor(c.subtitleColor),
    backgroundColor: cleanColor(c.backgroundColor),
    accentColor: cleanColor(c.accentColor),
    icon: TITLE_ICONS.includes(c.icon) ? c.icon : '',
    uppercase: Boolean(c.uppercase),
    showTimeRange: Boolean(c.showTimeRange),
  };
};

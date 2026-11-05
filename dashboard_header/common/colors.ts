/**
 * Color math for theme-aware headers. Every text color is checked against the background it
 * sits on (WCAG 2.1 contrast), so headers stay readable in both Kibana's light and dark themes.
 */

export type Rgb = [number, number, number];

export const hexToRgb = (hex: string): Rgb => {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length === 8) h = h.slice(0, 6);
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const rgbToHex = ([r, g, b]: Rgb): string =>
  '#' +
  [r, g, b]
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

export const isHex = (s: unknown): s is string =>
  typeof s === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s.trim());

/** Blend `a` toward `b` by t (0 = a, 1 = b). */
export const mix = (a: string, b: string, t: number): string => {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return rgbToHex([0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * t) as Rgb);
};

export const luminance = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
};

/** Nudges `fg` toward black or white (whichever the background needs) until it reaches `min` contrast. */
export const ensureContrast = (fg: string, bg: string, min = 4.5): string => {
  if (contrast(fg, bg) >= min) return fg.toUpperCase();
  const target = luminance(bg) > 0.18 ? '#000000' : '#FFFFFF';
  for (let t = 0.05; t <= 1.0001; t += 0.05) {
    const c = mix(fg, target, t);
    if (contrast(c, bg) >= min) return c;
  }
  return target;
};

export interface ThemeRef {
  mode: 'light' | 'dark';
  /** Page/panel background of the current Kibana theme. */
  background: string;
  heading: string;
  paragraph: string;
}

/** Kibana 9.5 (Borealis) theme values, used as defaults and in tests. Runtime uses the live theme. */
export const BOREALIS: Record<'light' | 'dark', ThemeRef> = {
  light: { mode: 'light', background: '#FFFFFF', heading: '#111C2C', paragraph: '#1D2A3E' },
  dark: { mode: 'dark', background: '#0B1628', heading: '#E3E8F2', paragraph: '#CAD3E2' },
};

export type ColorName =
  | 'blue'
  | 'teal'
  | 'green'
  | 'purple'
  | 'pink'
  | 'red'
  | 'orange'
  | 'gold'
  | 'slate'
  | 'custom';

/** Mid-tone base for each named color; light/dark variants are derived from it. */
export const PALETTE: Record<Exclude<ColorName, 'custom'>, { label: string; base: string }> = {
  blue: { label: 'Blue', base: '#0B64DD' },
  teal: { label: 'Teal', base: '#00807A' },
  green: { label: 'Green', base: '#008A5E' },
  purple: { label: 'Purple', base: '#6146B5' },
  pink: { label: 'Pink', base: '#C61E6E' },
  red: { label: 'Red', base: '#C61E25' },
  orange: { label: 'Orange', base: '#D65A00' },
  gold: { label: 'Gold', base: '#B88300' },
  slate: { label: 'Slate', base: '#516381' },
};

export type BackgroundStyle = 'none' | 'bar' | 'underline' | 'tint' | 'solid';

export interface ResolvedColors {
  background: string; // 'transparent' or a hex
  title: string;
  subtitle: string;
  eyebrow: string;
  icon: string;
  iconBadgeBg: string;
  /** Accent bar / underline color. */
  decoration: string;
  /** The color everything was checked against (the real background, never 'transparent'). */
  effectiveBackground: string;
}

export const baseColorFor = (name: ColorName, custom: string): string =>
  name === 'custom' ? (isHex(custom) ? custom.trim() : PALETTE.blue.base) : PALETTE[name].base;

export function resolveColors(
  name: ColorName,
  customColor: string,
  style: BackgroundStyle,
  theme: ThemeRef
): ResolvedColors & { iconOnBadge: string } {
  const r = resolveColorsRaw(name, customColor, style, theme);
  // Icons are graphics: WCAG asks 3:1 against whatever is behind them.
  return { ...r, iconOnBadge: ensureContrast(r.icon, r.iconBadgeBg, 3) };
}

function resolveColorsRaw(
  name: ColorName,
  customColor: string,
  style: BackgroundStyle,
  theme: ThemeRef
): ResolvedColors {
  const base = baseColorFor(name, customColor);
  const dark = theme.mode === 'dark';
  const pageBg = theme.background;

  // Accent tuned to the page: base in light mode, a lifted version in dark mode.
  const accent = ensureContrast(dark ? mix(base, '#FFFFFF', 0.3) : base, pageBg, 4.5);

  if (style === 'solid') {
    // Slightly deeper in dark mode so a bright banner doesn't glare.
    let bg = dark ? mix(base, '#000000', 0.18) : base;
    const lightText = '#FFFFFF';
    const darkText = '#0B1628';
    let text = contrast(lightText, bg) >= contrast(darkText, bg) ? lightText : darkText;
    if (contrast(text, bg) < 4.5) {
      // Mid-tone custom color: deepen the banner until white text passes.
      bg = ensureContrast(bg, lightText, 4.5);
      text = lightText;
    }
    const subtitle = ensureContrast(mix(text, bg, 0.18), bg, 4.5);
    return {
      background: bg,
      effectiveBackground: bg,
      title: text,
      subtitle,
      eyebrow: subtitle,
      icon: text,
      iconBadgeBg: mix(bg, text, 0.18),
      decoration: text,
    };
  }

  if (style === 'tint') {
    const bg = dark ? mix(base, pageBg, 0.78) : mix(base, '#FFFFFF', 0.9);
    const title = ensureContrast(dark ? mix(base, '#FFFFFF', 0.82) : mix(base, '#000000', 0.55), bg, 7);
    const subtitle = ensureContrast(dark ? mix(base, '#FFFFFF', 0.6) : mix(base, '#000000', 0.35), bg, 4.5);
    const strong = ensureContrast(dark ? mix(base, '#FFFFFF', 0.45) : base, bg, 4.5);
    return {
      background: bg,
      effectiveBackground: bg,
      title,
      subtitle,
      eyebrow: strong,
      icon: strong,
      iconBadgeBg: dark ? mix(base, pageBg, 0.55) : mix(base, '#FFFFFF', 0.75),
      decoration: strong,
    };
  }

  // none / bar / underline: page background, theme text, accent for highlights.
  return {
    background: 'transparent',
    effectiveBackground: pageBg,
    title: ensureContrast(theme.heading, pageBg, 7),
    subtitle: ensureContrast(theme.paragraph, pageBg, 4.5),
    eyebrow: accent,
    icon: accent,
    iconBadgeBg: dark ? mix(base, pageBg, 0.72) : mix(base, '#FFFFFF', 0.86),
    decoration: accent,
  };
}

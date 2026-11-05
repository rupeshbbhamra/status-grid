import {
  BOREALIS,
  contrast,
  ensureContrast,
  mix,
  PALETTE,
  resolveColors,
  type BackgroundStyle,
  type ColorName,
} from './colors';
import { PRESETS } from './header_types';

const STYLES: BackgroundStyle[] = ['none', 'bar', 'underline', 'tint', 'solid'];
const NAMED = Object.keys(PALETTE) as Array<Exclude<ColorName, 'custom'>>;
// Deliberately awkward custom colors: neon, near-white, near-black, mid-grey.
const CUSTOM = ['#FFFF00', '#00FFFF', '#F5F5F5', '#111111', '#808080', '#FF69B4', '#7FFF00', '#3366FF'];

describe('color math', () => {
  it('contrast of black on white is 21', () => {
    expect(Math.round(contrast('#000000', '#FFFFFF'))).toBe(21);
  });
  it('mix goes from a to b', () => {
    expect(mix('#000000', '#FFFFFF', 0)).toBe('#000000');
    expect(mix('#000000', '#FFFFFF', 1)).toBe('#FFFFFF');
  });
  it('ensureContrast fixes low-contrast pairs', () => {
    const fixed = ensureContrast('#CCCCCC', '#FFFFFF', 4.5);
    expect(contrast(fixed, '#FFFFFF') >= 4.5).toBe(true);
  });
});

describe('readable in BOTH themes', () => {
  const failures: string[] = [];
  const check = (label: string, fg: string, bg: string, min: number) => {
    const c = contrast(fg, bg);
    if (c < min) failures.push(`${label}: ${fg} on ${bg} = ${c.toFixed(2)} (< ${min})`);
  };

  for (const mode of ['light', 'dark'] as const) {
    for (const style of STYLES) {
      const cases: Array<[ColorName, string]> = [
        ...NAMED.map((n) => [n, ''] as [ColorName, string]),
        ...CUSTOM.map((h) => ['custom', h] as [ColorName, string]),
      ];
      for (const [name, custom] of cases) {
        const r = resolveColors(name, custom, style, BOREALIS[mode]);
        const bg = r.effectiveBackground;
        const label = `${mode}/${style}/${name}${custom ? ' ' + custom : ''}`;
        check(`${label} title`, r.title, bg, 4.5);
        check(`${label} subtitle`, r.subtitle, bg, 4.5);
        check(`${label} eyebrow`, r.eyebrow, bg, 4.5);
        check(`${label} icon`, r.icon, bg, 3);
        check(`${label} icon-on-badge`, r.iconOnBadge, r.iconBadgeBg, 3);
        if (style === 'bar' || style === 'underline') check(`${label} decoration`, r.decoration, bg, 3);
      }
    }
  }

  it('every text color meets WCAG AA (4.5:1), icons and bars meet 3:1 — 2 themes × 5 styles × 17 colors', () => {
    expect(failures).toEqual([]);
  });

  it('every preset is readable in light and dark', () => {
    const presetFails: string[] = [];
    for (const p of PRESETS) {
      for (const mode of ['light', 'dark'] as const) {
        const r = resolveColors(p.style.color ?? 'blue', '', p.style.backgroundStyle ?? 'bar', BOREALIS[mode]);
        if (contrast(r.title, r.effectiveBackground) < 4.5) presetFails.push(`${p.id}/${mode}`);
      }
    }
    expect(presetFails).toEqual([]);
  });

  it('headings on plain backgrounds hit AAA (7:1)', () => {
    for (const mode of ['light', 'dark'] as const) {
      const r = resolveColors('blue', '', 'none', BOREALIS[mode]);
      expect(contrast(r.title, r.effectiveBackground) >= 7).toBe(true);
    }
  });
});

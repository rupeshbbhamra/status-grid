import {
  applyPreset,
  DEFAULT_HEADER,
  FONTS,
  ICONS,
  normalizeHeader,
  PRESETS,
  resolveText,
} from './header_types';

describe('resolveText', () => {
  it('uses the dashboard name automatically', () => {
    const t = resolveText(DEFAULT_HEADER, { title: 'ITSM overview', description: 'BMC Helix tickets' });
    expect(t.title).toBe('ITSM overview');
    expect(t.subtitle).toBe('BMC Helix tickets');
    expect(t.usingDashboardName).toBe(true);
  });
  it('falls back for unsaved dashboards', () => {
    expect(resolveText(DEFAULT_HEADER, {}).title).toBe('Untitled dashboard');
  });
  it('custom title wins, empty custom falls back to the dashboard name', () => {
    const c = { ...DEFAULT_HEADER, titleSource: 'custom' as const, customTitle: 'Service desk' };
    expect(resolveText(c, { title: 'X' }).title).toBe('Service desk');
    expect(resolveText({ ...c, customTitle: '  ' }, { title: 'X' }).title).toBe('X');
  });
  it('subtitle sources', () => {
    const d = { title: 'X', description: 'desc' };
    expect(resolveText({ ...DEFAULT_HEADER, subtitleSource: 'none' }, d).subtitle).toBe('');
    expect(resolveText({ ...DEFAULT_HEADER, subtitleSource: 'custom', customSubtitle: 'hi' }, d).subtitle).toBe('hi');
  });
});

describe('presets', () => {
  it('keep the text', () => {
    const mine = { ...DEFAULT_HEADER, titleSource: 'custom' as const, customTitle: 'Mine', eyebrow: 'Team' };
    const out = applyPreset(mine, 'ops');
    expect(out.customTitle).toBe('Mine');
    expect(out.eyebrow).toBe('Team');
    expect(out.font).toBe('oswald');
  });
  it('produce configs that survive normalizing unchanged', () => {
    for (const p of PRESETS) {
      const c = applyPreset(DEFAULT_HEADER, p.id);
      expect(normalizeHeader(c)).toEqual(c);
    }
  });
  it('only use known fonts and icons', () => {
    const fontIds = FONTS.map((f) => f.id);
    for (const p of PRESETS) {
      if (p.style.font) expect(fontIds.includes(p.style.font)).toBe(true);
      if (p.style.icon) expect(ICONS.includes(p.style.icon)).toBe(true);
    }
  });
});

describe('normalizeHeader', () => {
  it('defaults for empty state', () => {
    expect(normalizeHeader(undefined)).toEqual(DEFAULT_HEADER);
  });
  it('repairs bad values', () => {
    const out = normalizeHeader({
      titleSize: 500,
      font: 'comic-sans' as never,
      color: 'beige' as never,
      customColor: 'red;}',
      backgroundStyle: 'gradient' as never,
      icon: 'nope',
    });
    expect(out.titleSize).toBe(96);
    expect(out.font).toBe('kibana');
    expect(out.color).toBe('blue');
    expect(out.customColor).toBe('');
    expect(out.backgroundStyle).toBe('bar');
    expect(out.icon).toBe('');
  });
});

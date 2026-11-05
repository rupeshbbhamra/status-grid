import {
  applyPreset,
  DEFAULT_TITLE_CONFIG,
  normalizeTitleConfig,
  TITLE_ICONS,
  TITLE_PRESETS,
} from './title_types';

describe('applyPreset', () => {
  it('changes style but keeps the text', () => {
    const mine = { ...DEFAULT_TITLE_CONFIG, text: 'ITSM overview', subtitle: 'BMC Helix' };
    const out = applyPreset(mine, 'critical');
    expect(out.text).toBe('ITSM overview');
    expect(out.subtitle).toBe('BMC Helix');
    expect(out.backgroundColor).toBe('#BD271E');
    expect(out.icon).toBe('warning');
  });
  it('ignores unknown presets', () => {
    expect(applyPreset(DEFAULT_TITLE_CONFIG, 'nope')).toEqual(DEFAULT_TITLE_CONFIG);
  });
  it('every preset produces a config that survives normalizing unchanged', () => {
    for (const p of TITLE_PRESETS) {
      const c = applyPreset(DEFAULT_TITLE_CONFIG, p.id);
      expect(normalizeTitleConfig(c)).toEqual(c);
    }
  });
  it('preset icons are all in the picker list', () => {
    for (const p of TITLE_PRESETS) {
      if (p.style.icon) expect(TITLE_ICONS.includes(p.style.icon)).toBe(true);
    }
  });
});

describe('normalizeTitleConfig', () => {
  it('fills defaults for empty state', () => {
    expect(normalizeTitleConfig(undefined)).toEqual(DEFAULT_TITLE_CONFIG);
  });
  it('repairs bad values from hand-edited saved objects', () => {
    const out = normalizeTitleConfig({
      fontSize: 999,
      subtitleSize: -5,
      align: 'diagonal' as never,
      weight: 'heavy' as never,
      textColor: 'red; background:url(x)',
      backgroundColor: ' #0b64dd ',
      icon: 'notARealIcon',
    });
    expect(out.fontSize).toBe(120);
    expect(out.subtitleSize).toBe(10);
    expect(out.align).toBe('left');
    expect(out.weight).toBe('bold');
    expect(out.textColor).toBe('');
    expect(out.backgroundColor).toBe('#0b64dd');
    expect(out.icon).toBe('');
  });
});

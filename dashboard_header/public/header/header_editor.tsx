import React, { useEffect, useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiButtonGroup,
  EuiColorPicker,
  EuiComboBox,
  EuiFieldText,
  EuiFlexGrid,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiFormRow,
  EuiHorizontalRule,
  EuiIcon,
  EuiRange,
  EuiSpacer,
  EuiSuperSelect,
  EuiSwitch,
  EuiText,
  EuiTextArea,
  EuiThemeProvider,
  EuiTitle,
  EuiToolTip,
  useEuiTheme,
} from '@elastic/eui';
import { css } from '@emotion/react';
import type { TimeRange } from '@kbn/es-query';
import {
  applyPreset,
  BOREALIS,
  FONTS,
  ICONS,
  normalizeHeader,
  PALETTE,
  PRESETS,
  resolveColors,
  type ColorName,
  type HeaderConfig,
} from '../../common';
import { fontFamily, preloadAllFonts } from '../fonts/fonts';
import { HeaderView, type DashboardInfo } from './header_view';

interface Props {
  ariaLabelledBy: string;
  initialConfig: Partial<HeaderConfig>;
  isCreate: boolean;
  dashboard: DashboardInfo;
  timeRange?: TimeRange;
  onSave: (config: HeaderConfig) => void;
  onCancel: () => void;
}

/** Renders the header on that theme's real page background. */
function PreviewSurface({ label, children }: { label: string; children: React.ReactNode }) {
  const { euiTheme } = useEuiTheme();
  return (
    <div
      css={css`
        background: ${euiTheme.colors.backgroundBasePlain};
        border: 1px solid ${euiTheme.colors.borderBasePlain};
        border-radius: ${euiTheme.border.radius.medium};
        padding: ${euiTheme.size.s};
      `}
    >
      <div css={css`font-size: 11px; color: ${euiTheme.colors.textSubdued}; margin-bottom: 4px;`}>
        {label}
      </div>
      {children}
    </div>
  );
}

const COLOR_NAMES = Object.keys(PALETTE) as Array<Exclude<ColorName, 'custom'>>;

export function HeaderEditor({
  ariaLabelledBy,
  initialConfig,
  isCreate,
  dashboard,
  timeRange,
  onSave,
  onCancel,
}: Props) {
  const [config, setConfig] = useState<HeaderConfig>(normalizeHeader(initialConfig));
  const update = (patch: Partial<HeaderConfig>) => setConfig((c) => ({ ...c, ...patch }));
  const { euiTheme, colorMode } = useEuiTheme();
  const clean = normalizeHeader(config);

  useEffect(() => {
    preloadAllFonts();
  }, []);

  const swatchMode = colorMode === 'DARK' ? 'dark' : 'light';
  const swatch = (name: Exclude<ColorName, 'custom'>) => {
    const accent = resolveColors(name, '', 'none', BOREALIS[swatchMode]).decoration;
    const selected = config.color === name;
    return (
      <EuiToolTip key={name} content={PALETTE[name].label}>
        <button
          type="button"
          aria-label={PALETTE[name].label}
          aria-pressed={selected}
          onClick={() => update({ color: name })}
          css={css`
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: ${accent};
            border: 2px solid ${selected ? euiTheme.colors.textHeading : 'transparent'};
            box-shadow: inset 0 0 0 2px ${euiTheme.colors.backgroundBasePlain};
            cursor: pointer;
          `}
        />
      </EuiToolTip>
    );
  };

  return (
    <>
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="s">
          <h2 id={ariaLabelledBy}>{isCreate ? 'Add dashboard header' : 'Edit dashboard header'}</h2>
        </EuiTitle>
      </EuiFlyoutHeader>

      <EuiFlyoutBody>
        {/* Live preview in both themes, so it's clear the header works in each. */}
        <EuiFlexGroup gutterSize="s" direction="column">
          <EuiFlexItem>
            <EuiThemeProvider colorMode="light">
              <PreviewSurface label="Light theme">
                <HeaderView config={clean} dashboard={dashboard} timeRange={timeRange} updatedAt={new Date()} fillHeight={false} />
              </PreviewSurface>
            </EuiThemeProvider>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiThemeProvider colorMode="dark">
              <PreviewSurface label="Dark theme">
                <HeaderView config={clean} dashboard={dashboard} timeRange={timeRange} updatedAt={new Date()} fillHeight={false} />
              </PreviewSurface>
            </EuiThemeProvider>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size="m" />
        <EuiText size="xs"><strong>Quick styles</strong> <span css={css`color: ${euiTheme.colors.textSubdued};`}>— change the look, keep your text</span></EuiText>
        <EuiSpacer size="xs" />
        <EuiFlexGrid columns={2} gutterSize="s">
          {PRESETS.map((p) => (
            <EuiFlexItem key={p.id}>
              <EuiButton
                size="s"
                color="text"
                fullWidth
                onClick={() => setConfig((c) => applyPreset(c, p.id))}
                css={css`font-family: ${fontFamily(p.style.font ?? 'kibana', euiTheme.font)};`}
              >
                {p.name}
              </EuiButton>
            </EuiFlexItem>
          ))}
        </EuiFlexGrid>

        <EuiHorizontalRule margin="m" />
        <EuiTitle size="xxs"><h3>Text</h3></EuiTitle>
        <EuiSpacer size="s" />

        <EuiFormRow label="Title" fullWidth>
          <EuiButtonGroup
            legend="Title"
            isFullWidth
            buttonSize="compressed"
            idSelected={config.titleSource}
            onChange={(id) => update({ titleSource: id as HeaderConfig['titleSource'] })}
            options={[
              { id: 'dashboard', label: 'Dashboard name (automatic)' },
              { id: 'custom', label: 'Custom text' },
            ]}
          />
        </EuiFormRow>
        {config.titleSource === 'dashboard' ? (
          <EuiText size="xs" color="subdued">
            <p>
              Shows “{dashboard.title || 'Untitled dashboard'}” and updates by itself when the
              dashboard is renamed.
            </p>
          </EuiText>
        ) : (
          <EuiFormRow fullWidth>
            <EuiFieldText
              fullWidth
              placeholder={dashboard.title || 'Service desk overview'}
              value={config.customTitle}
              onChange={(e) => update({ customTitle: e.target.value })}
            />
          </EuiFormRow>
        )}

        <EuiFormRow label="Subtitle" fullWidth>
          <EuiButtonGroup
            legend="Subtitle"
            isFullWidth
            buttonSize="compressed"
            idSelected={config.subtitleSource}
            onChange={(id) => update({ subtitleSource: id as HeaderConfig['subtitleSource'] })}
            options={[
              { id: 'none', label: 'None' },
              { id: 'description', label: 'Dashboard description' },
              { id: 'custom', label: 'Custom' },
            ]}
          />
        </EuiFormRow>
        {config.subtitleSource === 'description' && !dashboard.description && (
          <EuiText size="xs" color="subdued">
            <p>This dashboard has no description yet. Add one in the dashboard's settings.</p>
          </EuiText>
        )}
        {config.subtitleSource === 'custom' && (
          <EuiFormRow helpText="Press Enter for a new line." fullWidth>
            <EuiTextArea
              fullWidth
              rows={2}
              value={config.customSubtitle}
              onChange={(e) => update({ customSubtitle: e.target.value })}
            />
          </EuiFormRow>
        )}

        <EuiFormRow label="Small label above the title" helpText="Optional, e.g. a team or system name." fullWidth>
          <EuiFieldText
            fullWidth
            placeholder="IT Service Management"
            value={config.eyebrow}
            onChange={(e) => update({ eyebrow: e.target.value })}
          />
        </EuiFormRow>
        <EuiFormRow fullWidth>
          <EuiSwitch label="Show the time range" checked={config.showTimeRange} onChange={(e) => update({ showTimeRange: e.target.checked })} />
        </EuiFormRow>
        <EuiFormRow fullWidth>
          <EuiSwitch label="Show when data last refreshed" checked={config.showUpdated} onChange={(e) => update({ showUpdated: e.target.checked })} />
        </EuiFormRow>

        <EuiHorizontalRule margin="m" />
        <EuiTitle size="xxs"><h3>Color</h3></EuiTitle>
        <EuiSpacer size="s" />

        <EuiFlexGroup gutterSize="s" wrap responsive={false} alignItems="center">
          {COLOR_NAMES.map((n) => (
            <EuiFlexItem grow={false} key={n}>{swatch(n)}</EuiFlexItem>
          ))}
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="xs"
              iconType="color"
              onClick={() => update({ color: 'custom' })}
              isSelected={config.color === 'custom'}
            >
              Custom
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
        {config.color === 'custom' && (
          <EuiFormRow
            label="Custom color"
            helpText="Any color works: text colors adjust automatically to stay readable in light and dark themes."
            fullWidth
          >
            <EuiColorPicker
              fullWidth
              color={config.customColor}
              onChange={(text, { hex, isValid }) => update({ customColor: isValid ? hex : text })}
            />
          </EuiFormRow>
        )}
        <EuiSpacer size="s" />
        <EuiFormRow label="Background" fullWidth>
          <EuiButtonGroup
            legend="Background"
            isFullWidth
            buttonSize="compressed"
            idSelected={config.backgroundStyle}
            onChange={(id) => update({ backgroundStyle: id as HeaderConfig['backgroundStyle'] })}
            options={[
              { id: 'none', label: 'None' },
              { id: 'bar', label: 'Side bar' },
              { id: 'underline', label: 'Underline' },
              { id: 'tint', label: 'Soft' },
              { id: 'solid', label: 'Solid' },
            ]}
          />
        </EuiFormRow>

        <EuiHorizontalRule margin="m" />
        <EuiTitle size="xxs"><h3>Font and size</h3></EuiTitle>
        <EuiSpacer size="s" />

        <EuiFormRow label="Font" fullWidth>
          <EuiSuperSelect
            fullWidth
            valueOfSelected={config.font}
            onChange={(v) => update({ font: v })}
            options={FONTS.map((f) => ({
              value: f.id,
              inputDisplay: <span css={css`font-family: ${fontFamily(f.id, euiTheme.font)}; font-weight: 700;`}>{f.label}</span>,
              dropdownDisplay: (
                <>
                  <div css={css`font-family: ${fontFamily(f.id, euiTheme.font)}; font-weight: 700; font-size: 16px;`}>{f.label}</div>
                  <EuiText size="xs" color="subdued">{f.note}</EuiText>
                </>
              ),
            }))}
          />
        </EuiFormRow>
        <EuiFormRow label="Title size" fullWidth>
          <EuiRange fullWidth min={14} max={96} step={1} showInput value={config.titleSize} onChange={(e) => update({ titleSize: Number(e.currentTarget.value) })} />
        </EuiFormRow>
        <EuiFormRow label="Subtitle size" fullWidth>
          <EuiRange fullWidth min={10} max={40} step={1} showInput value={config.subtitleSize} onChange={(e) => update({ subtitleSize: Number(e.currentTarget.value) })} />
        </EuiFormRow>
        <EuiFlexGroup gutterSize="s">
          <EuiFlexItem>
            <EuiFormRow label="Weight" fullWidth>
              <EuiButtonGroup
                legend="Weight"
                isFullWidth
                buttonSize="compressed"
                idSelected={config.weight}
                onChange={(id) => update({ weight: id as HeaderConfig['weight'] })}
                options={[{ id: 'medium', label: 'Medium' }, { id: 'bold', label: 'Bold' }]}
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFormRow label="Alignment" fullWidth>
              <EuiButtonGroup
                legend="Alignment"
                isFullWidth
                isIconOnly
                buttonSize="compressed"
                idSelected={config.align}
                onChange={(id) => update({ align: id as HeaderConfig['align'] })}
                options={[
                  { id: 'left', label: 'Left', iconType: 'editorAlignLeft' },
                  { id: 'center', label: 'Center', iconType: 'editorAlignCenter' },
                  { id: 'right', label: 'Right', iconType: 'editorAlignRight' },
                ]}
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFormRow label="Spacing" fullWidth>
              <EuiButtonGroup
                legend="Spacing"
                isFullWidth
                buttonSize="compressed"
                idSelected={config.padding}
                onChange={(id) => update({ padding: id as HeaderConfig['padding'] })}
                options={[{ id: 's', label: 'S' }, { id: 'm', label: 'M' }, { id: 'l', label: 'L' }]}
              />
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFormRow fullWidth>
          <EuiSwitch label="ALL CAPS title" checked={config.uppercase} onChange={(e) => update({ uppercase: e.target.checked })} />
        </EuiFormRow>

        <EuiHorizontalRule margin="m" />
        <EuiTitle size="xxs"><h3>Icon</h3></EuiTitle>
        <EuiSpacer size="s" />
        <EuiFormRow fullWidth>
          <EuiComboBox
            fullWidth
            placeholder="No icon"
            singleSelection={{ asPlainText: true }}
            isClearable
            options={ICONS.map((i) => ({ label: i, value: i }))}
            selectedOptions={config.icon ? [{ label: config.icon, value: config.icon }] : []}
            onChange={(opts) => update({ icon: opts[0]?.value ?? '' })}
            renderOption={(opt) => (
              <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                <EuiFlexItem grow={false}><EuiIcon type={opt.value as string} /></EuiFlexItem>
                <EuiFlexItem>{opt.label}</EuiFlexItem>
              </EuiFlexGroup>
            )}
          />
        </EuiFormRow>
        <EuiFormRow fullWidth>
          <EuiSwitch
            label="Put the icon in a colored circle"
            disabled={!config.icon}
            checked={config.iconBadge}
            onChange={(e) => update({ iconBadge: e.target.checked })}
          />
        </EuiFormRow>

        <EuiSpacer size="m" />
        <EuiText size="xs" color="subdued">
          <p>
            New headers start with Kibana's panel frame hidden so they sit on the dashboard like a
            native heading. To change that: panel menu → Settings → Hide title / Hide border.
          </p>
        </EuiText>
      </EuiFlyoutBody>

      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty iconType="cross" onClick={onCancel} flush="left">Cancel</EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton fill onClick={() => onSave(normalizeHeader(config))}>
              {isCreate ? 'Add header' : 'Apply'}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </>
  );
}

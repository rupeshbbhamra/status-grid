import React, { useState } from 'react';
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
  EuiPanel,
  EuiRange,
  EuiSelect,
  EuiSpacer,
  EuiSwitch,
  EuiText,
  EuiTextArea,
  EuiTitle,
} from '@elastic/eui';
import type { TimeRange } from '@kbn/es-query';
import {
  applyPreset,
  normalizeTitleConfig,
  TITLE_ICONS,
  TITLE_PRESETS,
  type TitleConfig,
} from '../../common';
import { StyledTitleView } from './styled_title_view';

interface Props {
  ariaLabelledBy: string;
  initialConfig: Partial<TitleConfig>;
  isCreate: boolean;
  timeRange?: TimeRange;
  onSave: (config: TitleConfig) => void;
  onCancel: () => void;
}

const iconOptions = TITLE_ICONS.map((name) => ({ label: name, value: name }));

export function StyledTitleEditor({
  ariaLabelledBy,
  initialConfig,
  isCreate,
  timeRange,
  onSave,
  onCancel,
}: Props) {
  const [config, setConfig] = useState<TitleConfig>(normalizeTitleConfig(initialConfig));
  const update = (patch: Partial<TitleConfig>) => setConfig((c) => ({ ...c, ...patch }));

  const color = (key: 'textColor' | 'subtitleColor' | 'backgroundColor' | 'accentColor', label: string) => (
    <EuiFormRow label={label} fullWidth>
      <EuiColorPicker
        fullWidth
        isClearable
        placeholder="Theme default"
        color={config[key]}
        onChange={(text, { hex, isValid }) => update({ [key]: isValid ? hex : text } as Partial<TitleConfig>)}
      />
    </EuiFormRow>
  );

  return (
    <>
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="s">
          <h2 id={ariaLabelledBy}>{isCreate ? 'Add styled title' : 'Edit styled title'}</h2>
        </EuiTitle>
      </EuiFlyoutHeader>

      <EuiFlyoutBody>
        <EuiText size="xs" color="subdued">
          <strong>Preview</strong>
        </EuiText>
        <EuiSpacer size="xs" />
        <EuiPanel hasBorder paddingSize="s" color="plain">
          <StyledTitleView config={normalizeTitleConfig(config)} timeRange={timeRange} fillHeight={false} />
        </EuiPanel>

        <EuiSpacer size="m" />
        <EuiText size="xs" color="subdued">
          <strong>Quick styles</strong> — change colors and size, keep your text
        </EuiText>
        <EuiSpacer size="xs" />
        <EuiFlexGrid columns={2} gutterSize="s">
          {TITLE_PRESETS.map((p) => (
            <EuiFlexItem key={p.id}>
              <EuiButton
                size="s"
                color="text"
                fullWidth
                onClick={() => setConfig((c) => applyPreset(c, p.id))}
                style={{
                  background: p.style.backgroundColor || undefined,
                  color: p.style.textColor || undefined,
                  borderLeft: p.style.accentColor ? `4px solid ${p.style.accentColor}` : undefined,
                }}
              >
                {p.name}
              </EuiButton>
            </EuiFlexItem>
          ))}
        </EuiFlexGrid>

        <EuiHorizontalRule margin="m" />

        <EuiFormRow label="Title" fullWidth>
          <EuiFieldText fullWidth value={config.text} onChange={(e) => update({ text: e.target.value })} />
        </EuiFormRow>
        <EuiFormRow label="Subtitle" helpText="Optional. Press Enter for a new line." fullWidth>
          <EuiTextArea
            fullWidth
            rows={2}
            value={config.subtitle}
            onChange={(e) => update({ subtitle: e.target.value })}
          />
        </EuiFormRow>
        <EuiFormRow fullWidth>
          <EuiSwitch
            label="Show the dashboard's time range under the title"
            checked={config.showTimeRange}
            onChange={(e) => update({ showTimeRange: e.target.checked })}
          />
        </EuiFormRow>

        <EuiHorizontalRule margin="m" />

        <EuiFormRow label="Title size" fullWidth>
          <EuiRange
            fullWidth
            min={12}
            max={96}
            step={1}
            showInput
            value={config.fontSize}
            onChange={(e) => update({ fontSize: Number(e.currentTarget.value) })}
          />
        </EuiFormRow>
        <EuiFormRow label="Subtitle size" fullWidth>
          <EuiRange
            fullWidth
            min={10}
            max={40}
            step={1}
            showInput
            value={config.subtitleSize}
            onChange={(e) => update({ subtitleSize: Number(e.currentTarget.value) })}
          />
        </EuiFormRow>

        <EuiFlexGroup gutterSize="s">
          <EuiFlexItem>
            <EuiFormRow label="Weight" fullWidth>
              <EuiSelect
                fullWidth
                value={config.weight}
                onChange={(e) => update({ weight: e.target.value as TitleConfig['weight'] })}
                options={[
                  { value: 'regular', text: 'Regular' },
                  { value: 'medium', text: 'Medium' },
                  { value: 'bold', text: 'Bold' },
                ]}
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFormRow label="Font" fullWidth>
              <EuiSelect
                fullWidth
                value={config.font}
                onChange={(e) => update({ font: e.target.value as TitleConfig['font'] })}
                options={[
                  { value: 'default', text: 'Kibana default' },
                  { value: 'serif', text: 'Serif' },
                  { value: 'mono', text: 'Monospace' },
                ]}
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFormRow label="Spacing" fullWidth>
              <EuiSelect
                fullWidth
                value={config.padding}
                onChange={(e) => update({ padding: e.target.value as TitleConfig['padding'] })}
                options={[
                  { value: 's', text: 'Tight' },
                  { value: 'm', text: 'Normal' },
                  { value: 'l', text: 'Roomy' },
                ]}
              />
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiFormRow label="Alignment" fullWidth>
          <EuiButtonGroup
            legend="Alignment"
            isFullWidth
            idSelected={config.align}
            onChange={(id) => update({ align: id as TitleConfig['align'] })}
            options={[
              { id: 'left', label: 'Left', iconType: 'editorAlignLeft' },
              { id: 'center', label: 'Center', iconType: 'editorAlignCenter' },
              { id: 'right', label: 'Right', iconType: 'editorAlignRight' },
            ]}
          />
        </EuiFormRow>
        <EuiFormRow fullWidth>
          <EuiSwitch
            label="ALL CAPS"
            checked={config.uppercase}
            onChange={(e) => update({ uppercase: e.target.checked })}
          />
        </EuiFormRow>

        <EuiFormRow label="Icon" fullWidth>
          <EuiComboBox
            fullWidth
            placeholder="No icon"
            singleSelection={{ asPlainText: true }}
            isClearable
            options={iconOptions}
            selectedOptions={config.icon ? [{ label: config.icon, value: config.icon }] : []}
            onChange={(opts) => update({ icon: opts[0]?.value ?? '' })}
            renderOption={(opt) => (
              <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                <EuiFlexItem grow={false}>
                  <EuiIcon type={opt.value as string} />
                </EuiFlexItem>
                <EuiFlexItem>{opt.label}</EuiFlexItem>
              </EuiFlexGroup>
            )}
          />
        </EuiFormRow>

        <EuiHorizontalRule margin="m" />

        <EuiFlexGroup gutterSize="s">
          <EuiFlexItem>{color('textColor', 'Title color')}</EuiFlexItem>
          <EuiFlexItem>{color('subtitleColor', 'Subtitle color')}</EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup gutterSize="s">
          <EuiFlexItem>{color('backgroundColor', 'Background')}</EuiFlexItem>
          <EuiFlexItem>{color('accentColor', 'Left accent bar')}</EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size="m" />
        <EuiText size="xs" color="subdued">
          Tip: to show only the banner with no panel frame, open the panel menu → Settings and turn
          on <em>Hide title</em> and <em>Hide border</em>. New styled titles start with both on.
        </EuiText>
      </EuiFlyoutBody>

      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty iconType="cross" onClick={onCancel} flush="left">
              Cancel
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton fill onClick={() => onSave(normalizeTitleConfig(config))}>
              {isCreate ? 'Add panel' : 'Apply'}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </>
  );
}

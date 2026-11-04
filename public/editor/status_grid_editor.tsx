import React, { useEffect, useMemo, useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiButtonGroup,
  EuiCallOut,
  EuiComboBox,
  type EuiComboBoxOptionOption,
  EuiFieldNumber,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiFormRow,
  EuiHorizontalRule,
  EuiSelect,
  EuiSpacer,
  EuiSwitch,
  EuiTitle,
} from '@elastic/eui';
import type { DataViewsPublicPluginStart } from '@kbn/data-views-plugin/public';
import type { DataView, DataViewField } from '@kbn/data-views-plugin/common';
import {
  DEFAULT_CONFIG,
  getConfigProblem,
  type MetricAgg,
  type StatusGridConfig,
} from '../../common';

interface Props {
  ariaLabelledBy: string;
  dataViews: DataViewsPublicPluginStart;
  initialConfig: Partial<StatusGridConfig>;
  isCreate: boolean;
  onSave: (config: StatusGridConfig) => void;
  onCancel: () => void;
}

const toOptions = (fields: DataViewField[]): Array<EuiComboBoxOptionOption<string>> =>
  fields
    .map((f) => ({ label: f.name, value: f.name }))
    .sort((a, b) => a.label.localeCompare(b.label));

const selected = (name?: string) => (name ? [{ label: name, value: name }] : []);

export function StatusGridEditor({
  ariaLabelledBy,
  dataViews,
  initialConfig,
  isCreate,
  onSave,
  onCancel,
}: Props) {
  const [config, setConfig] = useState<StatusGridConfig>({ ...DEFAULT_CONFIG, ...initialConfig });
  const [dataViewList, setDataViewList] = useState<Array<{ id: string; title: string; name?: string }>>([]);
  const [dataView, setDataView] = useState<DataView | undefined>();
  const [showProblem, setShowProblem] = useState(false);

  const update = (patch: Partial<StatusGridConfig>) => setConfig((c) => ({ ...c, ...patch }));

  useEffect(() => {
    dataViews.getIdsWithTitle().then(setDataViewList);
  }, [dataViews]);

  useEffect(() => {
    let cancelled = false;
    if (!config.dataViewId) {
      setDataView(undefined);
      return;
    }
    dataViews.get(config.dataViewId).then((dv) => {
      if (!cancelled) setDataView(dv);
    });
    return () => {
      cancelled = true;
    };
  }, [dataViews, config.dataViewId]);

  const { keywordOptions, numberOptions } = useMemo(() => {
    const fields = dataView?.fields.filter((f) => f.aggregatable && !f.name.startsWith('_')) ?? [];
    return {
      keywordOptions: toOptions(fields.filter((f) => f.type === 'string' || f.type === 'ip')),
      numberOptions: toOptions(fields.filter((f) => f.type === 'number')),
    };
  }, [dataView]);

  const problem = getConfigProblem(config);

  const save = () => {
    if (problem) {
      setShowProblem(true);
      return;
    }
    onSave(config);
  };

  return (
    <>
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="s">
          <h2 id={ariaLabelledBy}>{isCreate ? 'Add status grid' : 'Edit status grid'}</h2>
        </EuiTitle>
      </EuiFlyoutHeader>

      <EuiFlyoutBody>
        <EuiFormRow label="Data view" fullWidth>
          <EuiSelect
            fullWidth
            hasNoInitialSelection={!config.dataViewId}
            value={config.dataViewId ?? ''}
            options={dataViewList.map((dv) => ({ value: dv.id, text: dv.name || dv.title }))}
            onChange={(e) =>
              update({
                dataViewId: e.target.value,
                entityField: undefined,
                statusField: undefined,
                metricField: undefined,
              })
            }
          />
        </EuiFormRow>

        <EuiFormRow
          label="One tile per"
          helpText="A keyword field such as service.name, host.name or queue."
          fullWidth
        >
          <EuiComboBox
            fullWidth
            singleSelection={{ asPlainText: true }}
            isDisabled={!dataView}
            options={keywordOptions}
            selectedOptions={selected(config.entityField)}
            onChange={(opts) => update({ entityField: opts[0]?.value })}
          />
        </EuiFormRow>

        <EuiFormRow label="Color tiles by" fullWidth>
          <EuiButtonGroup
            legend="Color tiles by"
            isFullWidth
            idSelected={config.mode}
            onChange={(id) => update({ mode: id as StatusGridConfig['mode'] })}
            options={[
              { id: 'status', label: 'Latest status text' },
              { id: 'metric', label: 'Metric threshold' },
            ]}
          />
        </EuiFormRow>

        {config.mode === 'status' ? (
          <>
            <EuiFormRow
              label="Status field"
              helpText="The newest document for each tile decides its color."
              fullWidth
            >
              <EuiComboBox
                fullWidth
                singleSelection={{ asPlainText: true }}
                isDisabled={!dataView}
                options={keywordOptions}
                selectedOptions={selected(config.statusField)}
                onChange={(opts) => update({ statusField: opts[0]?.value })}
              />
            </EuiFormRow>
            <EuiFormRow label="Green when the value is" helpText="Comma-separated, not case-sensitive." fullWidth>
              <EuiFieldText fullWidth value={config.okValues} onChange={(e) => update({ okValues: e.target.value })} />
            </EuiFormRow>
            <EuiFormRow label="Yellow when the value is" fullWidth>
              <EuiFieldText fullWidth value={config.warningValues} onChange={(e) => update({ warningValues: e.target.value })} />
            </EuiFormRow>
            <EuiFormRow label="Red when the value is" helpText="Anything not listed shows as gray." fullWidth>
              <EuiFieldText fullWidth value={config.criticalValues} onChange={(e) => update({ criticalValues: e.target.value })} />
            </EuiFormRow>
          </>
        ) : (
          <>
            <EuiFlexGroup gutterSize="s">
              <EuiFlexItem grow={2}>
                <EuiFormRow label="Metric field" fullWidth>
                  <EuiComboBox
                    fullWidth
                    singleSelection={{ asPlainText: true }}
                    isDisabled={!dataView || config.metricAgg === 'count'}
                    placeholder={config.metricAgg === 'count' ? 'Not needed for Count' : undefined}
                    options={numberOptions}
                    selectedOptions={selected(config.metricField)}
                    onChange={(opts) => update({ metricField: opts[0]?.value })}
                  />
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem grow={1}>
                <EuiFormRow label="Using" fullWidth>
                  <EuiSelect
                    fullWidth
                    value={config.metricAgg}
                    onChange={(e) => update({ metricAgg: e.target.value as MetricAgg })}
                    options={[
                      { value: 'count', text: 'Count of docs' },
                      { value: 'avg', text: 'Average' },
                      { value: 'max', text: 'Max' },
                      { value: 'min', text: 'Min' },
                      { value: 'sum', text: 'Sum' },
                      { value: 'last', text: 'Last value' },
                    ]}
                  />
                </EuiFormRow>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFormRow fullWidth>
              <EuiSwitch
                label={config.higherIsWorse ? 'Higher values are worse' : 'Lower values are worse'}
                checked={config.higherIsWorse}
                onChange={(e) => update({ higherIsWorse: e.target.checked })}
              />
            </EuiFormRow>
            <EuiFlexGroup gutterSize="s">
              <EuiFlexItem>
                <EuiFormRow label="Yellow at" fullWidth>
                  <EuiFieldNumber
                    fullWidth
                    value={config.warningThreshold ?? ''}
                    onChange={(e) =>
                      update({ warningThreshold: e.target.value === '' ? undefined : Number(e.target.value) })
                    }
                  />
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiFormRow label="Red at" fullWidth>
                  <EuiFieldNumber
                    fullWidth
                    value={config.criticalThreshold ?? ''}
                    onChange={(e) =>
                      update({ criticalThreshold: e.target.value === '' ? undefined : Number(e.target.value) })
                    }
                  />
                </EuiFormRow>
              </EuiFlexItem>
            </EuiFlexGroup>
          </>
        )}

        <EuiHorizontalRule margin="m" />

        <EuiFlexGroup gutterSize="s">
          <EuiFlexItem>
            <EuiFormRow label="Order tiles" fullWidth>
              <EuiSelect
                fullWidth
                value={config.sortBy}
                onChange={(e) => update({ sortBy: e.target.value as StatusGridConfig['sortBy'] })}
                options={[
                  { value: 'severity', text: 'Worst first' },
                  { value: 'name', text: 'By name' },
                ]}
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFormRow label="Max tiles" fullWidth>
              <EuiFieldNumber
                fullWidth
                min={1}
                max={1000}
                value={config.maxEntities}
                onChange={(e) => update({ maxEntities: Number(e.target.value) || 100 })}
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFormRow label="Tile width (px)" fullWidth>
              <EuiFieldNumber
                fullWidth
                min={60}
                max={600}
                value={config.tileMinWidth}
                onChange={(e) => update({ tileMinWidth: Number(e.target.value) || 140 })}
              />
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFormRow fullWidth>
          <EuiSwitch
            label="Show the value on each tile"
            checked={config.showValue}
            onChange={(e) => update({ showValue: e.target.checked })}
          />
        </EuiFormRow>

        {showProblem && problem && (
          <>
            <EuiSpacer size="m" />
            <EuiCallOut color="warning" iconType="warning" size="s" title={problem} />
          </>
        )}
      </EuiFlyoutBody>

      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty iconType="cross" onClick={onCancel} flush="left">
              Cancel
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton fill onClick={save}>
              {isCreate ? 'Add panel' : 'Apply'}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </>
  );
}

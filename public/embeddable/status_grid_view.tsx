import React from 'react';
import {
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiText,
  EuiToolTip,
  useEuiTheme,
} from '@elastic/eui';
import { css } from '@emotion/react';
import {
  formatValue,
  summarize,
  type StatusCell,
  type StatusGridConfig,
  type StatusLevel,
} from '../../common';

const LABEL: Record<StatusLevel, string> = {
  critical: 'Critical',
  warning: 'Warning',
  ok: 'OK',
  unknown: 'Unknown',
};

interface Props {
  cells: StatusCell[];
  config: StatusGridConfig;
  configProblem?: string;
  onTileClick?: (cell: StatusCell) => void;
}

export function StatusGridView({ cells, config, configProblem, onTileClick }: Props) {
  const { euiTheme } = useEuiTheme();

  const palette: Record<StatusLevel, { bg: string; fg: string; dot: string }> = {
    ok: { bg: euiTheme.colors.success, fg: euiTheme.colors.emptyShade, dot: 'success' },
    warning: { bg: euiTheme.colors.warning, fg: euiTheme.colors.ink, dot: 'warning' },
    critical: { bg: euiTheme.colors.danger, fg: euiTheme.colors.emptyShade, dot: 'danger' },
    unknown: { bg: euiTheme.colors.lightShade, fg: euiTheme.colors.ink, dot: 'subdued' },
  };

  if (configProblem) {
    return (
      <EuiEmptyPrompt
        iconType="apps"
        titleSize="xs"
        title={<h3>Status grid isn't set up yet</h3>}
        body={<p>{configProblem} Use the panel menu → Edit.</p>}
      />
    );
  }

  if (cells.length === 0) {
    return (
      <EuiEmptyPrompt
        iconType="search"
        titleSize="xs"
        title={<h3>No data</h3>}
        body={<p>Nothing matches the current time range and filters.</p>}
      />
    );
  }

  const counts = summarize(cells);

  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        padding: ${euiTheme.size.s};
        gap: ${euiTheme.size.s};
        overflow: hidden;
      `}
    >
      <EuiFlexGroup gutterSize="m" responsive={false} wrap alignItems="center">
        {(['critical', 'warning', 'ok', 'unknown'] as StatusLevel[])
          .filter((s) => counts[s] > 0)
          .map((s) => (
            <EuiFlexItem grow={false} key={s}>
              <EuiHealth color={palette[s].dot}>
                <EuiText size="xs">
                  <strong>{counts[s]}</strong> {LABEL[s].toLowerCase()}
                </EuiText>
              </EuiHealth>
            </EuiFlexItem>
          ))}
      </EuiFlexGroup>

      <div
        role="list"
        css={css`
          flex: 1;
          overflow: auto;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(${config.tileMinWidth || 140}px, 1fr));
          gap: ${euiTheme.size.xs};
          align-content: start;
        `}
      >
        {cells.map((cell) => {
          const colors = palette[cell.status];
          const tooltip = (
            <>
              <strong>{cell.key}</strong>
              <br />
              {LABEL[cell.status]} · {formatValue(cell.value)}
              {cell.lastSeen && (
                <>
                  <br />
                  Last seen {new Date(cell.lastSeen).toLocaleString()}
                </>
              )}
              <br />
              {cell.docCount.toLocaleString()} documents
              {onTileClick && (
                <>
                  <br />
                  <em>Click to filter the dashboard</em>
                </>
              )}
            </>
          );
          return (
            <EuiToolTip key={cell.key} content={tooltip} display="block">
              <button
                type="button"
                role="listitem"
                aria-label={`${cell.key}: ${LABEL[cell.status]}, ${formatValue(cell.value)}`}
                onClick={onTileClick ? () => onTileClick(cell) : undefined}
                css={css`
                  all: unset;
                  box-sizing: border-box;
                  width: 100%;
                  min-height: 56px;
                  padding: ${euiTheme.size.s} ${euiTheme.size.m};
                  border-radius: ${euiTheme.border.radius.medium};
                  background: ${colors.bg};
                  color: ${colors.fg};
                  cursor: ${onTileClick ? 'pointer' : 'default'};
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  overflow: hidden;
                  transition: filter 120ms ease;
                  &:hover {
                    filter: brightness(1.08);
                  }
                  &:focus-visible {
                    outline: 2px solid ${euiTheme.colors.primary};
                    outline-offset: 2px;
                  }
                `}
              >
                <span
                  css={css`
                    font-weight: ${euiTheme.font.weight.semiBold};
                    font-size: ${euiTheme.size.m};
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  `}
                >
                  {cell.key}
                </span>
                {config.showValue && (
                  <span
                    css={css`
                      font-size: 12px;
                      opacity: 0.9;
                      white-space: nowrap;
                      overflow: hidden;
                      text-overflow: ellipsis;
                    `}
                  >
                    {formatValue(cell.value)}
                  </span>
                )}
              </button>
            </EuiToolTip>
          );
        })}
      </div>
    </div>
  );
}

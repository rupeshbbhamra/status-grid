import React from 'react';
import { EuiIcon, PrettyDuration, useEuiTheme } from '@elastic/eui';
import { css } from '@emotion/react';
import type { TimeRange } from '@kbn/es-query';
import type { TitleConfig } from '../../common';

const WEIGHT = { regular: 400, medium: 500, bold: 700 } as const;

interface Props {
  config: TitleConfig;
  timeRange?: TimeRange;
  /** In the editor preview the box shouldn't stretch to fill a tall flyout. */
  fillHeight?: boolean;
}

export function StyledTitleView({ config, timeRange, fillHeight = true }: Props) {
  const { euiTheme } = useEuiTheme();

  const padding = { s: euiTheme.size.s, m: euiTheme.size.m, l: euiTheme.size.l }[config.padding];
  const fontFamily =
    config.font === 'mono'
      ? euiTheme.font.familyCode
      : config.font === 'serif'
      ? 'Georgia, "Times New Roman", serif'
      : euiTheme.font.family;
  const textColor = config.textColor || euiTheme.colors.textHeading;
  const subtitleColor = config.subtitleColor || euiTheme.colors.textSubdued;
  const justify = { left: 'flex-start', center: 'center', right: 'flex-end' }[config.align];
  const iconSize = Math.round(config.fontSize * 0.9);

  return (
    <div
      css={css`
        box-sizing: border-box;
        width: 100%;
        ${fillHeight ? 'height: 100%;' : ''}
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: ${padding} calc(${padding} * 1.5);
        background: ${config.backgroundColor || 'transparent'};
        border-left: ${config.accentColor ? `6px solid ${config.accentColor}` : 'none'};
        border-radius: ${config.backgroundColor ? euiTheme.border.radius.medium : '0'};
        text-align: ${config.align};
        font-family: ${fontFamily};
        overflow: hidden;
      `}
    >
      <div
        css={css`
          display: flex;
          align-items: center;
          justify-content: ${justify};
          gap: ${Math.round(config.fontSize * 0.35)}px;
          min-width: 0;
        `}
      >
        {config.icon && (
          <EuiIcon
            type={config.icon}
            aria-hidden="true"
            css={css`
              width: ${iconSize}px;
              height: ${iconSize}px;
              flex-shrink: 0;
              fill: ${textColor};
              color: ${textColor};
            `}
          />
        )}
        <h2
          css={css`
            margin: 0;
            font-size: ${config.fontSize}px;
            line-height: 1.15;
            font-weight: ${WEIGHT[config.weight]};
            color: ${textColor};
            font-family: inherit;
            text-transform: ${config.uppercase ? 'uppercase' : 'none'};
            letter-spacing: ${config.uppercase ? '0.04em' : 'normal'};
            overflow-wrap: anywhere;
          `}
        >
          {config.text || ' '}
        </h2>
      </div>

      {(config.subtitle || (config.showTimeRange && timeRange)) && (
        <div
          css={css`
            margin-top: ${Math.round(config.subtitleSize * 0.4)}px;
            font-size: ${config.subtitleSize}px;
            line-height: 1.4;
            color: ${subtitleColor};
            white-space: pre-line;
          `}
        >
          {config.subtitle}
          {config.subtitle && config.showTimeRange && timeRange ? ' · ' : null}
          {config.showTimeRange && timeRange && (
            <PrettyDuration
              timeFrom={timeRange.from}
              timeTo={timeRange.to}
              dateFormat="MMM D, YYYY @ HH:mm"
            />
          )}
        </div>
      )}
    </div>
  );
}

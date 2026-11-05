import React, { useEffect, useMemo } from 'react';
import { EuiIcon, PrettyDuration, useEuiTheme } from '@elastic/eui';
import { css } from '@emotion/react';
import type { TimeRange } from '@kbn/es-query';
import {
  BOREALIS,
  formatUpdated,
  isHex,
  resolveColors,
  resolveText,
  type HeaderConfig,
  type ThemeRef,
} from '../../common';
import { fontFamily, loadFont, weightValue } from '../fonts/fonts';

export interface DashboardInfo {
  title?: string;
  description?: string;
}

interface Props {
  config: HeaderConfig;
  dashboard: DashboardInfo;
  timeRange?: TimeRange;
  updatedAt?: Date;
  /** In the editor preview the header shouldn't stretch to fill a tall box. */
  fillHeight?: boolean;
}

/** The live Kibana theme as plain hex values, falling back to Borealis if a value isn't hex. */
export function useThemeRef(): ThemeRef {
  const { euiTheme, colorMode } = useEuiTheme();
  return useMemo(() => {
    const mode = colorMode === 'DARK' ? 'dark' : 'light';
    const fb = BOREALIS[mode];
    const pick = (v: unknown, fallback: string) => (isHex(v) ? (v as string) : fallback);
    return {
      mode,
      background: pick(euiTheme.colors.backgroundBasePlain, fb.background),
      heading: pick(euiTheme.colors.textHeading, fb.heading),
      paragraph: pick(euiTheme.colors.textParagraph, fb.paragraph),
    };
  }, [euiTheme, colorMode]);
}

export function HeaderView({ config, dashboard, timeRange, updatedAt, fillHeight = true }: Props) {
  const { euiTheme } = useEuiTheme();
  const theme = useThemeRef();
  const colors = useMemo(
    () => resolveColors(config.color, config.customColor, config.backgroundStyle, theme),
    [config.color, config.customColor, config.backgroundStyle, theme]
  );
  const text = resolveText(config, dashboard);
  const weight = weightValue(config.weight);

  useEffect(() => {
    loadFont(config.font, weight);
    loadFont(config.font, 500); // eyebrow
  }, [config.font, weight]);

  const family = fontFamily(config.font, euiTheme.font);
  const pad = { s: 8, m: 14, l: 22 }[config.padding];
  const justify = { left: 'flex-start', center: 'center', right: 'flex-end' }[config.align];
  const iconSize = Math.round(Math.max(18, config.titleSize * 0.75));
  const badgeSize = Math.round(iconSize * 1.7);
  const metaParts = [
    config.showTimeRange && timeRange ? 'time' : null,
    config.showUpdated && updatedAt ? formatUpdated(updatedAt) : null,
  ].filter(Boolean);

  const icon = config.icon ? (
    config.iconBadge ? (
      <span
        aria-hidden="true"
        css={css`
          flex-shrink: 0;
          width: ${badgeSize}px;
          height: ${badgeSize}px;
          border-radius: 50%;
          background: ${colors.iconBadgeBg};
          display: inline-flex;
          align-items: center;
          justify-content: center;
        `}
      >
        <EuiIcon type={config.icon} css={css`width: ${iconSize}px; height: ${iconSize}px; fill: ${colors.iconOnBadge}; color: ${colors.iconOnBadge};`} />
      </span>
    ) : (
      <EuiIcon
        type={config.icon}
        aria-hidden="true"
        css={css`flex-shrink: 0; width: ${iconSize}px; height: ${iconSize}px; fill: ${colors.icon}; color: ${colors.icon};`}
      />
    )
  ) : null;

  return (
    <header
      css={css`
        box-sizing: border-box;
        width: 100%;
        ${fillHeight ? 'height: 100%;' : ''}
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: ${pad}px ${Math.round(pad * 1.6)}px;
        background: ${colors.background};
        border-radius: ${colors.background === 'transparent' ? '0' : euiTheme.border.radius.medium};
        border-left: ${config.backgroundStyle === 'bar' ? `5px solid ${colors.decoration}` : 'none'};
        overflow: hidden;
        text-align: ${config.align};
      `}
    >
      <div
        css={css`
          display: flex;
          align-items: center;
          justify-content: ${justify};
          gap: ${Math.round(pad * 1.1)}px;
          min-width: 0;
          flex-direction: ${config.align === 'right' ? 'row-reverse' : 'row'};
        `}
      >
        {icon}
        <div css={css`min-width: 0;`}>
          {config.eyebrow && (
            <div
              css={css`
                font-family: ${family};
                font-weight: 500;
                font-size: ${Math.max(11, Math.round(config.subtitleSize * 0.85))}px;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: ${colors.eyebrow};
                margin-bottom: 2px;
              `}
            >
              {config.eyebrow}
            </div>
          )}
          <h2
            title={text.usingDashboardName ? 'Dashboard name (updates automatically)' : undefined}
            css={css`
              margin: 0;
              font-family: ${family};
              font-weight: ${weight};
              font-size: ${config.titleSize}px;
              line-height: 1.12;
              color: ${colors.title};
              text-transform: ${config.uppercase ? 'uppercase' : 'none'};
              letter-spacing: ${config.uppercase ? '0.03em' : '-0.01em'};
              overflow-wrap: anywhere;
            `}
          >
            {text.title}
          </h2>
          {config.backgroundStyle === 'underline' && (
            <div
              aria-hidden="true"
              css={css`
                height: 3px;
                width: ${Math.round(Math.min(120, config.titleSize * 2))}px;
                margin: ${Math.round(config.titleSize * 0.25)}px ${config.align === 'center' ? 'auto' : config.align === 'right' ? '0 0 0 auto' : '0'} 0;
                border-radius: 2px;
                background: ${colors.decoration};
              `}
            />
          )}
          {text.subtitle && (
            <div
              css={css`
                margin-top: ${Math.round(config.subtitleSize * 0.45)}px;
                font-family: ${euiTheme.font.family};
                font-size: ${config.subtitleSize}px;
                line-height: 1.45;
                color: ${colors.subtitle};
                white-space: pre-line;
              `}
            >
              {text.subtitle}
            </div>
          )}
          {metaParts.length > 0 && (
            <div
              css={css`
                margin-top: ${Math.round(config.subtitleSize * 0.35)}px;
                font-family: ${euiTheme.font.family};
                font-size: ${Math.max(11, config.subtitleSize - 2)}px;
                color: ${colors.subtitle};
                display: flex;
                gap: 6px;
                justify-content: ${justify};
                flex-wrap: wrap;
              `}
            >
              {config.showTimeRange && timeRange && (
                <span>
                  <EuiIcon type="calendar" size="s" css={css`fill: ${colors.subtitle}; margin-right: 4px; vertical-align: -1px;`} />
                  <PrettyDuration timeFrom={timeRange.from} timeTo={timeRange.to} dateFormat="MMM D, YYYY @ HH:mm" />
                </span>
              )}
              {config.showTimeRange && timeRange && config.showUpdated && updatedAt && <span aria-hidden="true">·</span>}
              {config.showUpdated && updatedAt && <span>{formatUpdated(updatedAt)}</span>}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import {
  TREND_METRICS,
  buildTrendPoints,
  niceCeil,
  trendDateLabel,
  trendFmt,
  trendIsEst,
  trendValue,
  trendYLabel,
  type TrendMetricKey,
  type TrendPoint,
  type TrendTabKey,
} from '@/lib/trend';
import type { DailyRecord } from '@/lib/types';

const H = 180;
const PAD_L = 44;
const PAD_R = 22;
const PAD_T = 16;
const PAD_B = 24;

function useChartWidth() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(560);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(Math.max(280, el.clientWidth || 560));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, width };
}

function axis(ptsLen: number, W: number) {
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const x = (i: number) => PAD_L + (ptsLen === 1 ? innerW / 2 : (innerW * i) / (ptsLen - 1));
  return { innerW, innerH, x };
}

export function TrendChart({
  dailyList,
  meanArpu,
  bare = false,
}: {
  dailyList: DailyRecord[];
  meanArpu: number | null;
  bare?: boolean;
}) {
  const theme = useTheme();
  const { ref, width } = useChartWidth();
  const [tab, setTab] = useState<TrendTabKey>('all');
  const [hover, setHover] = useState<{
    idx: number;
    key: TrendMetricKey | null;
    x: number;
    y: number;
  } | null>(null);

  const pts = useMemo(() => buildTrendPoints(dailyList, meanArpu), [dailyList, meanArpu]);
  const W = width;
  const ax = axis(pts.length, W);

  const chartModel = useMemo(() => {
    if (pts.length < 2) return null;

    if (tab === 'all') {
      const revVals = pts.map((d) => trendValue(d, 'revenue') ?? 0);
      const revMax = niceCeil(Math.max(...revVals, 0));
      const series = TREND_METRICS.map((m) => {
        const vals = pts.map((d) => trendValue(d, m.key) ?? 0);
        const base = m.key === 'revenue' ? revMax : Math.max(...vals, 1);
        const ys = vals.map((v) => PAD_T + ax.innerH * (1 - v / base));
        return { ...m, ys, base };
      });
      const ticks = [0, 1, 2, 3, 4].map((t) => ({
        v: (revMax * t) / 4,
        y: PAD_T + ax.innerH * (1 - t / 4),
        label: trendYLabel('revenue', (revMax * t) / 4),
      }));
      return { mode: 'all' as const, series, ticks, revMax };
    }

    const key = tab;
    const metric = TREND_METRICS.find((m) => m.key === key)!;
    const vals = pts.map((d) => trendValue(d, key));
    const realVals = vals.filter((v): v is number => v != null);
    if (realVals.length === 0) {
      return { mode: 'empty' as const, key, metric };
    }
    const niceMax = niceCeil(Math.max(...realVals));
    const ys = vals.map((v) => PAD_T + ax.innerH * (1 - (v ?? 0) / niceMax));
    const ticks = [0, 1, 2, 3, 4].map((t) => ({
      v: (niceMax * t) / 4,
      y: PAD_T + ax.innerH * (1 - t / 4),
      label: trendYLabel(key, (niceMax * t) / 4),
    }));
    return {
      mode: 'single' as const,
      key,
      metric,
      ys,
      vals,
      niceMax,
      ticks,
    };
  }, [pts, tab, ax.innerH]);

  const tip = useMemo(() => {
    if (!hover || !pts[hover.idx]) return null;
    const rec = pts[hover.idx];
    if (hover.key) {
      return {
        title: trendDateLabel(rec.date),
        rows: [
          {
            label: TREND_METRICS.find((m) => m.key === hover.key)?.label || '',
            color: TREND_METRICS.find((m) => m.key === hover.key)?.color || '#999',
            value: trendFmt(hover.key, trendValue(rec, hover.key)),
            est: trendIsEst(rec, hover.key),
          },
        ],
      };
    }
    return {
      title: trendDateLabel(rec.date),
      rows: TREND_METRICS.map((m) => ({
        label: m.label,
        color: m.color,
        value: trendFmt(m.key, trendValue(rec, m.key)),
        est: trendIsEst(rec, m.key),
      })),
    };
  }, [hover, pts]);

  const xLabels = useMemo(() => {
    if (pts.length === 0) return [];
    const step = Math.max(1, Math.round((pts.length - 1) / 4));
    const labels: Array<{ i: number; day: number }> = [];
    for (let i = 0; i < pts.length; i += step) {
      labels.push({ i, day: parseInt(pts[i].date.slice(8, 10), 10) });
    }
    return labels;
  }, [pts]);

  const bandW = pts.length > 1 ? ax.innerW / (pts.length - 1) : ax.innerW;
  const gridStroke = theme.palette.divider;
  const labelFill = theme.palette.text.secondary;

  const body = (
    <>
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1.2 }}>
        {([{ key: 'all' as const, label: '全部', color: theme.palette.text.primary }, ...TREND_METRICS] as Array<{
          key: TrendTabKey;
          label: string;
          color: string;
        }>).map((m) => {
          const active = tab === m.key;
          return (
            <Box
              key={m.key}
              component="button"
              type="button"
              onClick={() => setTab(m.key)}
              sx={{
                border: 1,
                borderColor: active ? m.color : 'divider',
                bgcolor: active ? m.color : 'transparent',
                color: active ? '#fff' : 'text.secondary',
                px: 1.25,
                py: 0.45,
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {m.label}
            </Box>
          );
        })}
      </Stack>

      <Box ref={ref} sx={{ position: 'relative', width: '100%', minHeight: H }}>
        {pts.length < 2 || !chartModel || chartModel.mode === 'empty' ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
            {pts.length < 2 ? '本月数据不足，暂无法绘制趋势' : '暂无真实收入数据'}
          </Typography>
        ) : (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            height={H}
            preserveAspectRatio="xMidYMid meet"
            style={{ display: 'block' }}
            onMouseLeave={() => setHover(null)}
          >
            {chartModel.ticks.map((t, i) => (
              <g key={i}>
                <line x1={PAD_L} y1={t.y} x2={W - PAD_R} y2={t.y} stroke={gridStroke} strokeWidth={1} />
                <text x={PAD_L - 6} y={t.y + 3} fill={labelFill} fontSize={10} textAnchor="end">
                  {t.label}
                </text>
              </g>
            ))}

            {chartModel.mode === 'all' ? (
              <text x={PAD_L} y={10} fill={labelFill} fontSize={10}>
                左轴为收入 · 其余按自身峰值归一化对比走势
              </text>
            ) : null}

            {chartModel.mode === 'single' ? (
              <SingleSeries
                pts={pts}
                ys={chartModel.ys}
                color={chartModel.metric.color}
                metricKey={chartModel.key}
                ax={ax}
              />
            ) : (
              chartModel.series.map((se) => (
                <g key={se.key}>
                  <polyline
                    fill="none"
                    stroke={se.color}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={pts.map((_, i) => `${ax.x(i)},${se.ys[i]}`).join(' ')}
                  />
                  {pts.map((d, i) => (
                    <circle
                      key={`${se.key}-${d.date}`}
                      cx={ax.x(i)}
                      cy={se.ys[i]}
                      r={2.3}
                      fill={theme.palette.background.paper}
                      stroke={se.color}
                      strokeWidth={2}
                      strokeDasharray={trendIsEst(d, se.key) ? '2 2' : undefined}
                    />
                  ))}
                </g>
              ))
            )}

            {hover ? (
              <>
                <line
                  x1={ax.x(hover.idx)}
                  y1={PAD_T}
                  x2={ax.x(hover.idx)}
                  y2={PAD_T + ax.innerH}
                  stroke={theme.palette.text.secondary}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  opacity={0.7}
                />
                {(chartModel.mode === 'all'
                  ? chartModel.series
                  : [{ key: chartModel.key, color: chartModel.metric.color, ys: chartModel.ys }]
                ).map((se) =>
                  se.ys[hover.idx] == null ? null : (
                    <circle
                      key={`focus-${se.key}`}
                      cx={ax.x(hover.idx)}
                      cy={se.ys[hover.idx]}
                      r={4.2}
                      fill={theme.palette.background.paper}
                      stroke={se.color}
                      strokeWidth={2.5}
                    />
                  ),
                )}
              </>
            ) : null}

            {pts.map((d, i) => (
              <rect
                key={`hit-${d.date}`}
                x={ax.x(i) - bandW / 2}
                y={PAD_T}
                width={bandW}
                height={ax.innerH}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseMove={(e) => {
                  const box = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setHover({
                    idx: i,
                    key: tab === 'all' ? null : tab,
                    x: e.clientX - box.left,
                    y: e.clientY - box.top,
                  });
                }}
              />
            ))}

            {xLabels.map((l) => (
              <text key={l.i} x={ax.x(l.i)} y={H - 7} fill={labelFill} fontSize={10} textAnchor="middle">
                {l.day}
              </text>
            ))}
          </svg>
        )}

        {tip && hover ? (
          <Box
            sx={{
              position: 'absolute',
              left: Math.min(Math.max(hover.x, 60), Math.max(60, width - 60)),
              top: Math.max(28, hover.y - 12),
              transform: 'translate(-50%, -100%)',
              bgcolor: 'rgba(17,24,39,0.92)',
              color: '#fff',
              fontSize: 11,
              px: 1,
              py: 0.6,
              borderRadius: 1,
              pointerEvents: 'none',
              zIndex: 2,
              whiteSpace: 'nowrap',
            }}
          >
            <Box component="span" sx={{ fontWeight: 700, mr: 0.75 }}>
              {tip.title}
            </Box>
            {tip.rows.map((r) => (
              <Box
                key={r.label}
                sx={{ display: tip.rows.length > 1 ? 'flex' : 'inline-flex', alignItems: 'center', gap: 0.6 }}
              >
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: r.color, flexShrink: 0 }} />
                {r.label} {r.value}
                {r.est ? ' · 预估' : ''}
              </Box>
            ))}
          </Box>
        ) : null}
      </Box>

      {tab === 'all' && pts.length >= 2 ? (
        <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.8 }}>
          {TREND_METRICS.map((m) => (
            <Stack key={m.key} direction="row" spacing={0.6} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: m.color }} />
              <Typography variant="caption" color="text.secondary">
                {m.label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      ) : null}
    </>
  );

  if (bare) return body;
  return <Card sx={{ p: { xs: 1.2, sm: 1.5 } }}>{body}</Card>;
}

function SingleSeries({
  pts,
  ys,
  color,
  metricKey,
  ax,
}: {
  pts: TrendPoint[];
  ys: number[];
  color: string;
  metricKey: TrendMetricKey;
  ax: { x: (i: number) => number; innerH: number };
}) {
  const theme = useTheme();
  const y0 = PAD_T + ax.innerH;
  const area = `M ${ax.x(0)},${y0} L ${pts.map((_, i) => `${ax.x(i)},${ys[i]}`).join(' L ')} L ${ax.x(pts.length - 1)},${y0} Z`;
  return (
    <g>
      <path d={area} fill={color} opacity={0.08} />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={pts.map((_, i) => `${ax.x(i)},${ys[i]}`).join(' ')}
      />
      {pts.map((d, i) => (
        <circle
          key={d.date}
          cx={ax.x(i)}
          cy={ys[i]}
          r={2.3}
          fill={theme.palette.background.paper}
          stroke={color}
          strokeWidth={2}
          strokeDasharray={trendIsEst(d, metricKey) ? '2 2' : undefined}
        />
      ))}
    </g>
  );
}

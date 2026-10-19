import { dayRevenueView, type DayRevenueView } from './estimate';
import { fmt, fmtInt } from './format';
import type { DailyRecord } from './types';

export type TrendMetricKey = 'revenue' | 'impression' | 'dau' | 'conv';

export const TREND_METRICS: Array<{ key: TrendMetricKey; label: string; color: string }> = [
  { key: 'revenue', label: '收入', color: '#f97316' },
  { key: 'impression', label: '曝光', color: '#3b82f6' },
  { key: 'dau', label: '日活', color: '#10b981' },
  { key: 'conv', label: '转化率', color: '#8b5cf6' },
];

export type TrendTabKey = 'all' | TrendMetricKey;

export interface TrendPoint {
  date: string;
  revenue: number | null;
  impression: number;
  dau: number;
  conv: number | null;
  revenueEst: boolean;
  convEst: boolean;
}

export function buildTrendPoints(
  dailyList: DailyRecord[],
  meanArpu: number | null,
): TrendPoint[] {
  return (dailyList || [])
    .map((rec) => {
      const view: DayRevenueView = dayRevenueView(rec, meanArpu);
      return {
        date: rec.date,
        revenue: view.value,
        impression: rec.impression || 0,
        dau: rec.dau || 0,
        conv: view.arpuPct,
        revenueEst: view.isEst,
        convEst: view.isEst,
      };
    })
    .filter((d) => d.revenue != null || d.dau > 0 || d.impression > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function trendValue(pt: TrendPoint, key: TrendMetricKey): number | null {
  if (key === 'revenue') return pt.revenue;
  if (key === 'impression') return pt.impression;
  if (key === 'dau') return pt.dau;
  if (key === 'conv') return pt.conv;
  return null;
}

export function trendIsEst(pt: TrendPoint, key: TrendMetricKey): boolean {
  if (key === 'revenue') return pt.revenueEst;
  if (key === 'conv') return pt.convEst;
  return false;
}

export function trendFmt(key: TrendMetricKey, v: number | null): string {
  if (v == null || Number.isNaN(v)) return '—';
  if (key === 'revenue') return `¥${fmt(v)}`;
  if (key === 'conv') return `${v.toFixed(1)}%`;
  return fmtInt(v);
}

export function trendYLabel(key: TrendMetricKey, v: number): string {
  if (key === 'conv') return `${v.toFixed(0)}%`;
  if (v >= 10000) return `${(v / 10000).toFixed(v >= 100000 ? 0 : 1)}w`;
  if (key === 'revenue') return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v));
  return String(Math.round(v));
}

export function trendDateLabel(dateStr: string): string {
  const p = dateStr.split('-');
  return `${parseInt(p[1], 10)}月${parseInt(p[2], 10)}日`;
}

export function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const norm = v / mag;
  let step: number;
  if (norm <= 1) step = 1;
  else if (norm <= 2) step = 2;
  else if (norm <= 5) step = 5;
  else step = 10;
  return step * mag;
}

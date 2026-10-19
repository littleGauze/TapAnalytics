import type { DailyRecord } from './types';

/**
 * 本月均值转化率（ARPU = 已结算日收入合计 / 对应日活合计）。
 * 与 TapSulor 注释一致：收益 T+1 未结算时，用该均值 × 当日活跃做单日预估。
 */
export function computeMeanArpu(dailyList: DailyRecord[] | undefined): number | null {
  let revenueSum = 0;
  let dauSum = 0;
  for (const d of dailyList || []) {
    if (d?.revenue == null || !(d.dau > 0)) continue;
    revenueSum += Number(d.revenue) || 0;
    dauSum += d.dau;
  }
  if (dauSum <= 0) return null;
  return revenueSum / dauSum;
}

export interface DayRevenueView {
  /** 展示用金额：真实收益优先，否则为预估值 */
  value: number | null;
  /** 是否为预估值（真实收益未同步） */
  isEst: boolean;
  /** 用于展示的转化率（真实日转化，或均值转化） */
  arpuPct: number | null;
}

/**
 * 单日收益展示：有真实结算用真实值；否则用本月均值 ARPU × 当日 DAU 预估。
 */
export function dayRevenueView(
  rec: DailyRecord | null | undefined,
  meanArpu: number | null,
): DayRevenueView {
  if (!rec) return { value: null, isEst: false, arpuPct: null };

  if (rec.revenue != null) {
    const arpuPct = rec.dau > 0 ? (rec.revenue / rec.dau) * 100 : null;
    return { value: rec.revenue, isEst: false, arpuPct };
  }

  if (meanArpu != null && meanArpu > 0 && rec.dau > 0) {
    return {
      value: meanArpu * rec.dau,
      isEst: true,
      arpuPct: meanArpu * 100,
    };
  }

  return { value: null, isEst: false, arpuPct: null };
}

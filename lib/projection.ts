import type { RevenuePoint } from './types';

export function computeMonthProjection(
  dailyList: RevenuePoint[] | undefined,
  monthTotal: number | null | undefined,
) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const todayNum = now.getDate();
  const elapsedDays = Math.max(1, todayNum - 1);
  const remainingDays = daysInMonth - elapsedDays;
  const monthPrefix = `${y}-${String(m + 1).padStart(2, '0')}-`;

  const values: number[] = [];
  let listSum = 0;
  (dailyList || []).forEach((d) => {
    if (!d?.date || !String(d.date).startsWith(monthPrefix)) return;
    const day = parseInt(String(d.date).slice(8, 10), 10);
    if (Number.isNaN(day) || day < 1 || day > elapsedDays) return;
    const rev = Number(d.revenue) || 0;
    values.push(rev);
    listSum += rev;
  });

  const total = monthTotal != null && !Number.isNaN(monthTotal) ? Number(monthTotal) : listSum;
  const avg = elapsedDays > 0 ? total / elapsedDays : 0;

  let robustMean = avg;
  if (values.length >= 3) {
    const sorted = [...values].sort((a, b) => a - b);
    const trim = Math.max(1, Math.floor(sorted.length * 0.1));
    const slice = sorted.slice(trim, sorted.length - trim);
    if (slice.length > 0) {
      robustMean = slice.reduce((s, v) => s + v, 0) / slice.length;
    }
  }

  return {
    avg,
    projection: total + robustMean * remainingDays,
    elapsedDays,
    remainingDays,
    daysInMonth,
    robustMean,
  };
}

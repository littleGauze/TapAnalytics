import { NextResponse } from 'next/server';
import { currentAccount } from '@/lib/store';
import { developerIdOf } from '@/lib/api';
import { taptapFetch, TAPTAP_ORIGIN } from '@/lib/taptap';
import { dayBeforeStr, lastMonthSameDayRange, monthStartStr, todayStr, yesterdayStr } from '@/lib/dates';
import type { GameMetrics, RevenuePoint } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getJson(path: string, cookie: string) {
  const res = await taptapFetch(`${TAPTAP_ORIGIN}${path}`, cookie);
  return res.json;
}

function parseRevenue(json: any): { total: number | null; list: RevenuePoint[] } {
  if (!json?.success || !json.data) return { total: null, list: [] };
  const list = (json.data.list || []).map((i: any) => ({
    date: i.date,
    revenue: parseFloat(i.revenue) || 0,
  }));
  const total =
    json.data.total != null
      ? parseFloat(json.data.total)
      : list.reduce((s: number, i: RevenuePoint) => s + (i.revenue || 0), 0);
  return { total, list };
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const acc = currentAccount();
    if (!acc?.cookies) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    const { id: appId } = await ctx.params;
    const developerId = developerIdOf();
    const cookie = acc.cookies;
    const yesterday = yesterdayStr();
    const dayBefore = dayBeforeStr();
    const today = todayStr();
    const monthStart = monthStartStr();
    const lm = lastMonthSameDayRange();
    const q = `developer_id=${developerId}&app_id=${appId}`;

    const [rev2d, dau2d, monthRev, lastMonthRev, totalRev, pos2d] = await Promise.all([
      getJson(`/api/mini-app/v1/ad/payout-report-data?${q}&start_time=${dayBefore}&end_time=${yesterday}`, cookie),
      getJson(`/api/mini-app/v1/stats-by-day/device?${q}&start_date=${dayBefore}&end_date=${yesterday}`, cookie),
      getJson(`/api/mini-app/v1/ad/payout-report-data?${q}&start_time=${monthStart}&end_time=${today}`, cookie),
      getJson(`/api/mini-app/v1/ad/payout-report-data?${q}&start_time=${lm.start}&end_time=${lm.end}`, cookie),
      getJson(`/api/mini-app/v1/ad/payout-report-data?${q}&start_time=2020-01-01&end_time=${yesterday}`, cookie),
      getJson(`/api/dashboard/v2/stats-by-day/position/cn?${q}&start_date=${dayBefore}&end_date=${yesterday}&platform=android`, cookie),
    ]);

    const r2 = parseRevenue(rev2d);
    const yItem = r2.list.find((i) => i.date === yesterday);
    const dItem = r2.list.find((i) => i.date === dayBefore);
    const dauList = dau2d?.data?.list || [];
    const yDau = dauList.find((r: any) => r.date === yesterday);
    const dDau = dauList.find((r: any) => r.date === dayBefore);
    const posList = pos2d?.data?.list || [];
    const yPos = posList.find((r: any) => r.date === yesterday);
    const month = parseRevenue(monthRev);
    const lastMonth = parseRevenue(lastMonthRev);
    const total = parseRevenue(totalRev);

    const metrics: GameMetrics = {
      appId,
      todayRevenue: r2.total == null ? null : yItem ? yItem.revenue : 0,
      prevDayRevenue: dItem ? dItem.revenue : null,
      monthRevenue: month.total,
      lastMonthRevenue: lastMonth.total,
      totalRevenue: total.total,
      todayDAU: yDau ? yDau.active_device_num || 0 : 0,
      todayNewUsers: yDau ? yDau.new_active_device_num || 0 : 0,
      prevDayDAU: dDau ? dDau.active_device_num || 0 : null,
      todayImpression: yPos ? yPos.impression_cnt || 0 : null,
      monthRevenueList: month.list,
    };

    return NextResponse.json(metrics);
  } catch (err) {
    const message = (err as Error).message;
    const status = message === 'UNAUTHENTICATED' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

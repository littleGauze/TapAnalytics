import { NextResponse } from 'next/server';
import { currentAccount } from '@/lib/store';
import { developerIdOf } from '@/lib/api';
import { taptapFetch, TAPTAP_ORIGIN } from '@/lib/taptap';
import {
  currentMonthStr,
  dayBeforeStr,
  getMonthRange,
  lastMonthSameDayRange,
  monthStartStr,
  todayStr,
  yesterdayStr,
} from '@/lib/dates';
import type { DailyRecord, GameOverview, OverallMetrics, RevenuePoint } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getJson(path: string, cookie: string) {
  return taptapFetch(`${TAPTAP_ORIGIN}${path}`, cookie).then((r) => r.json);
}

function parseRevenue(json: any): { ok: boolean; total: number | null; list: RevenuePoint[] } {
  if (!json?.success || !json.data) return { ok: false, total: null, list: [] };
  const list = (json.data.list || []).map((i: any) => ({
    date: String(i.date),
    revenue: parseFloat(i.revenue) || 0,
  }));
  const total =
    json.data.total != null
      ? parseFloat(json.data.total)
      : list.reduce((s: number, i: RevenuePoint) => s + (i.revenue || 0), 0);
  return { ok: true, total, list };
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const acc = currentAccount();
    if (!acc?.cookies) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const { id: appId } = await ctx.params;
    const month = new URL(req.url).searchParams.get('month') || currentMonthStr();
    const developerId = developerIdOf();
    const cookie = acc.cookies;
    const q = `developer_id=${developerId}&app_id=${appId}`;

    const yesterday = yesterdayStr();
    const dayBefore = dayBeforeStr();
    const today = todayStr();
    const monthStart = monthStartStr();
    const lm = lastMonthSameDayRange();
    const { start, end } = getMonthRange(month);
    const liveEnd = month === currentMonthStr() ? today : end;
    const extraStart = daysAgo(29);

    const [
      rev2dJson,
      dau2dJson,
      pos2dJson,
      monthRevJson,
      lastMonthJson,
      totalRevJson,
      calRevJson,
      calDauJson,
      calPosJson,
      calDurJson,
      overallRetJson,
      overallConvJson,
      overallDurJson,
    ] = await Promise.all([
      getJson(`/api/mini-app/v1/ad/payout-report-data?${q}&start_time=${dayBefore}&end_time=${yesterday}`, cookie),
      getJson(`/api/mini-app/v1/stats-by-day/device?${q}&start_date=${dayBefore}&end_date=${yesterday}`, cookie),
      getJson(`/api/dashboard/v2/stats-by-day/position/cn?${q}&start_date=${dayBefore}&end_date=${yesterday}&platform=android`, cookie),
      getJson(`/api/mini-app/v1/ad/payout-report-data?${q}&start_time=${monthStart}&end_time=${today}`, cookie),
      getJson(`/api/mini-app/v1/ad/payout-report-data?${q}&start_time=${lm.start}&end_time=${lm.end}`, cookie),
      getJson(`/api/mini-app/v1/ad/payout-report-data?${q}&start_time=2020-01-01&end_time=${yesterday}`, cookie),
      getJson(`/api/mini-app/v1/ad/payout-report-data?${q}&start_time=${start}&end_time=${end}`, cookie),
      getJson(`/api/mini-app/v1/stats-by-day/device?${q}&start_date=${start}&end_date=${liveEnd}`, cookie),
      getJson(`/api/dashboard/v2/stats-by-day/position/cn?${q}&start_date=${start}&end_date=${liveEnd}&platform=android`, cookie),
      getJson(`/api/mini-app/v1/stats-by-day/duration?${q}&start_date=${start}&end_date=${liveEnd}`, cookie),
      getJson(`/api/mini-app/v1/stats-by-day/ret?${q}&start_date=${extraStart}&end_date=${yesterday}`, cookie),
      getJson(`/api/mini-app/v1/stats-by-day/conversion?${q}&start_date=${extraStart}&end_date=${yesterday}`, cookie),
      getJson(`/api/mini-app/v1/stats-by-day/duration?${q}&start_date=${extraStart}&end_date=${yesterday}`, cookie),
    ]);

    const r2 = parseRevenue(rev2dJson);
    const findDate = (list: any[], date: string) => (list || []).find((r: any) => r.date === date);
    const yRev = r2.list.find((i) => i.date === yesterday);
    const dRev = r2.list.find((i) => i.date === dayBefore);
    const yDau = findDate(dau2dJson?.data?.list, yesterday);
    const dDau = findDate(dau2dJson?.data?.list, dayBefore);
    const yPos = findDate(pos2dJson?.data?.list, yesterday);
    const dPos = findDate(pos2dJson?.data?.list, dayBefore);
    const monthParsed = parseRevenue(monthRevJson);
    const lastMonth = parseRevenue(lastMonthJson);
    const total = parseRevenue(totalRevJson);
    const calRev = parseRevenue(calRevJson);

    const overview: GameOverview = {
      yesterdayRevenue: r2.ok ? (yRev ? yRev.revenue : 0) : null,
      yesterdayDAU: yDau ? yDau.active_device_num || 0 : 0,
      yesterdayImp: yPos ? yPos.impression_cnt || 0 : 0,
      yesterdayClick: yPos ? yPos.click_cnt || 0 : 0,
      yesterdayClickRate: yPos?.click_rate ?? null,
      monthRevenue: monthParsed.total,
      monthRevenueList: monthParsed.list,
      prevDayRevenue: dRev ? dRev.revenue : null,
      prevDayDAU: dDau ? dDau.active_device_num || 0 : null,
      prevDayImp: dPos ? dPos.impression_cnt || 0 : null,
      lastMonthRevenue: lastMonth.total,
    };

    const dailyMap: Record<string, DailyRecord> = {};
    const ensure = (date: string) => {
      if (!dailyMap[date]) dailyMap[date] = { date, revenue: null, dau: 0, newUsers: 0 };
      return dailyMap[date];
    };

    calRev.list.forEach((i) => {
      ensure(i.date).revenue = i.revenue;
    });
    (calDauJson?.data?.list || []).forEach((i: any) => {
      const e = ensure(i.date);
      e.dau = i.active_device_num || 0;
      e.newUsers = i.new_active_device_num || 0;
    });
    (calPosJson?.data?.list || []).forEach((i: any) => {
      Object.assign(ensure(i.date), {
        impression: i.impression_cnt || 0,
        click: i.click_cnt || 0,
        clickRate: i.click_rate,
        convDetail: i.convert_detail_cnt || 0,
        convDetailRate: i.convert_detail_rate,
        convTotal: i.convert_cnt || 0,
      });
    });
    (calDurJson?.data?.list || []).forEach((i: any) => {
      ensure(i.date).durationAvg = i.spend_duration_min_avg;
    });

    const dailyList = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
    const monthTotal = calRev.ok
      ? calRev.total
      : dailyList.reduce((s, d) => s + (d.revenue || 0), 0);
    const monthDauSum = dailyList.reduce((s, d) => s + (d.dau || 0), 0);

    const rt = overallRetJson?.data?.total || {};
    const cv = overallConvJson?.data?.total || {};
    const dr = overallDurJson?.data?.total || {};
    const overall: OverallMetrics = {
      retA1d: rt.ret_new_active_device_rate_a1d,
      retA3d: rt.ret_new_active_device_rate_a3d,
      retA7d: rt.ret_new_active_device_rate_a7d,
      startRate: cv.mini_app_start_rate,
      durationAvg: dr.spend_duration_min_avg,
    };

    let earliestMonth = currentMonthStr();
    if (total.list.length > 0) {
      const sorted = [...total.list].sort((a, b) => a.date.localeCompare(b.date));
      earliestMonth = sorted[0].date.substring(0, 7);
    }

    return NextResponse.json({
      overview,
      overall,
      grandTotal: total.total,
      earliestMonth,
      month: {
        yearMonth: month,
        dailyList,
        monthTotal: calRev.ok ? monthTotal : null,
        monthDau: monthDauSum,
        revenueOk: calRev.ok,
      },
    });
  } catch (err) {
    const message = (err as Error).message;
    const status = message === 'UNAUTHENTICATED' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

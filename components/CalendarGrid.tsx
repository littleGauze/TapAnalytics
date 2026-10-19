'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { currentMonthStr, monthLabel, todayStr } from '@/lib/dates';
import { computeMeanArpu, dayRevenueView } from '@/lib/estimate';
import { fmt, fmtInt } from '@/lib/format';
import type { DailyRecord } from '@/lib/types';

const WEEK = ['一', '二', '三', '四', '五', '六', '日'];

export function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function CalendarGrid({
  month,
  earliestMonth,
  dailyList,
  onMonthChange,
  onSelectDay,
  hideHeader = false,
  bare = false,
}: {
  month: string;
  earliestMonth: string;
  dailyList: DailyRecord[];
  onMonthChange: (ym: string) => void;
  onSelectDay: (date: string, rec: DailyRecord | null) => void;
  hideHeader?: boolean;
  /** 去掉外层 Card，便于嵌入父级容器 */
  bare?: boolean;
}) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const [year, mon] = month.split('-').map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();
  let first = new Date(year, mon - 1, 1).getDay();
  first = (first + 6) % 7;
  const today = todayStr();
  const meanArpu = computeMeanArpu(dailyList);
  const map: Record<string, DailyRecord> = {};
  dailyList.forEach((d) => {
    map[d.date] = d;
  });

  const cells: Array<{ date?: string; day?: number; rec?: DailyRecord; future?: boolean; today?: boolean }> = [];
  for (let i = 0; i < first; i++) cells.push({});
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({
      date,
      day,
      rec: map[date],
      future: date > today,
      today: date === today,
    });
  }

  const canPrev = month > earliestMonth;
  const canNext = month < currentMonthStr();

  const body = (
    <>
      {hideHeader ? null : (
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 0.5, mb: 1 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              03 · 每日日历
            </Typography>
            <Typography fontWeight={700}>{monthLabel(month)}</Typography>
          </Box>
          <Stack direction="row">
            <IconButton size="small" disabled={!canPrev} onClick={() => onMonthChange(shiftMonth(month, -1))}>
              <ChevronLeft />
            </IconButton>
            <IconButton size="small" disabled={!canNext} onClick={() => onMonthChange(shiftMonth(month, 1))}>
              <ChevronRight />
            </IconButton>
          </Stack>
        </Stack>
      )}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.4, mb: 0.6 }}>
        {WEEK.map((w) => (
          <Typography key={w} variant="caption" color="text.secondary" textAlign="center" fontWeight={700}>
            {w}
          </Typography>
        ))}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: { xs: 0.4, sm: 0.6 } }}>
        {cells.map((c, i) => {
          if (!c.date) return <Box key={`b${i}`} />;
          const rec = c.rec;
          const view = dayRevenueView(rec, meanArpu);
          const conv = view.arpuPct == null ? '—' : `${view.arpuPct.toFixed(0)}%`;
          return (
            <Box
              key={c.date}
              onClick={() => !c.future && onSelectDay(c.date!, rec || null)}
              sx={{
                minHeight: { xs: 68, sm: 84 },
                p: { xs: 0.5, sm: 0.75 },
                borderRadius: 1.5,
                cursor: c.future ? 'default' : 'pointer',
                opacity: c.future ? 0.35 : 1,
                bgcolor: c.today ? 'primary.main' : 'action.hover',
                color: c.today ? 'primary.contrastText' : 'text.primary',
                '&:active': { transform: c.future ? 'none' : 'scale(0.97)' },
              }}
            >
              <Typography variant="caption" fontWeight={700}>
                {c.day}
              </Typography>
              {c.future ? (
                <Typography variant="caption" display="block">
                  ·
                </Typography>
              ) : view.value == null ? (
                <Typography variant="caption" display="block" sx={{ opacity: 0.85 }}>
                  {c.today ? '待更新' : '未同步'}
                </Typography>
              ) : (
                <>
                  <Typography
                    className="tabular"
                    sx={{
                      fontSize: mobile ? 10 : 12,
                      fontWeight: 700,
                      lineHeight: 1.2,
                      opacity: view.isEst ? 0.82 : 1,
                    }}
                  >
                    ¥{fmt(view.value)}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: 10, opacity: 0.8 }}>
                    {view.isEst ? (
                      <>预估 · {fmtInt(rec?.dau)}</>
                    ) : (
                      <>
                        {fmtInt(rec?.dau)} · {conv}
                      </>
                    )}
                  </Typography>
                </>
              )}
            </Box>
          );
        })}
      </Box>
    </>
  );

  if (bare) return body;
  return <Card sx={{ p: { xs: 1, sm: 1.5 } }}>{body}</Card>;
}

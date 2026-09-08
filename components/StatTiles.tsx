'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { fmt } from '@/lib/format';
import { computeMonthProjection } from '@/lib/projection';
import { usePrefs } from './AppProviders';
import type { Game, GameMetrics } from '@/lib/types';

interface Props {
  games: Game[];
  metrics: Record<string, GameMetrics>;
  loading: boolean;
}

export function StatTiles({ games, metrics, loading }: Props) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const { monthGoal } = usePrefs();
  const published = games.filter((g) => g.published);
  const values = (key: keyof GameMetrics) =>
    published
      .map((g) => metrics[g.appId]?.[key])
      .filter((v): v is number => typeof v === 'number');

  const today = values('todayRevenue').reduce((s, v) => s + v, 0);
  const month = values('monthRevenue').reduce((s, v) => s + v, 0);
  const total = values('totalRevenue').reduce((s, v) => s + v, 0);
  const todayGot = values('todayRevenue').length;
  const monthGot = values('monthRevenue').length;
  const totalGot = values('totalRevenue').length;

  const dailyByDate: Record<string, number> = {};
  published.forEach((g) => {
    (metrics[g.appId]?.monthRevenueList || []).forEach((d) => {
      if (!d?.date) return;
      dailyByDate[d.date] = (dailyByDate[d.date] || 0) + (Number(d.revenue) || 0);
    });
  });
  const merged = Object.entries(dailyByDate).map(([date, revenue]) => ({ date, revenue }));
  const proj = merged.length ? computeMonthProjection(merged, month) : null;

  const tiles = [
    {
      key: 'total',
      tag: '累计收益',
      value: totalGot ? `¥${fmt(total)}` : loading ? null : '暂无',
      meta: published.length
        ? `${totalGot}/${published.length} 个项目已同步真实收益`
        : '等待数据同步',
      accent: true,
      span: true,
    },
    {
      key: 'today',
      tag: '昨日广告收益',
      value: todayGot ? `¥${fmt(today)}` : loading ? null : '暂无',
      meta: '昨日',
    },
    {
      key: 'month',
      tag: '本月广告收益',
      value: monthGot ? `¥${fmt(month)}` : loading ? null : '暂无',
      meta: proj ? `日均 ¥${fmt(proj.avg)}  ·  月末预估 ¥${fmt(proj.projection)}` : '本月',
    },
  ];

  const goalPct = monthGoal && monthGoal > 0 ? Math.min((month / monthGoal) * 100, 100) : 0;

  return (
    <Stack spacing={1.5}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: mobile ? '1fr 1fr' : '1.2fr 1fr 1fr',
          gap: 1.25,
        }}
      >
        {tiles.map((t) => (
          <Card
            key={t.key}
            sx={{
              p: { xs: 1.5, sm: 2 },
              gridColumn: mobile && t.span ? '1 / -1' : 'auto',
              background: t.accent
                ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 58%, ${theme.palette.primary.light} 140%)`
                : theme.palette.background.paper,
              color: t.accent ? theme.palette.primary.contrastText : 'text.primary',
              minHeight: { xs: 96, sm: 118 },
            }}
          >
            <Typography variant="caption" sx={{ opacity: 0.78, fontWeight: 700, letterSpacing: 1 }}>
              {t.tag}
            </Typography>
            <Typography
              className="tabular"
              sx={{
                mt: 0.6,
                fontSize: { xs: t.span ? 28 : 20, sm: t.span ? 34 : 26 },
                fontWeight: 700,
                lineHeight: 1.15,
              }}
            >
              {t.value ?? <Skeleton width={120} sx={{ bgcolor: t.accent ? 'rgba(255,255,255,0.24)' : undefined }} />}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.8, opacity: 0.72 }}>
              {t.meta}
            </Typography>
          </Card>
        ))}
      </Box>
      {monthGoal && monthGoal > 0 ? (
        <Card sx={{ p: 1.75 }}>
          <Stack direction="row" justifyContent="space-between" mb={0.8}>
            <Typography variant="body2" fontWeight={700}>
              月度任务进度
            </Typography>
            <Typography className="tabular" variant="body2" fontWeight={700}>
              ¥{fmt(monthGoal)}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={goalPct}
            sx={{ height: 8, borderRadius: 99 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.8, display: 'block' }}>
            {goalPct.toFixed(1)}% · {month >= monthGoal ? `已达成，超出 ¥${fmt(month - monthGoal)}` : `距目标还差 ¥${fmt(monthGoal - month)}`}
          </Typography>
        </Card>
      ) : null}
    </Stack>
  );
}

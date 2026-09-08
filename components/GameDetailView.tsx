'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ArrowBack from '@mui/icons-material/ArrowBack';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { CalendarGrid } from './CalendarGrid';
import { DayDetailDialog } from './DayDetailDialog';
import { MomChip } from './MomChip';
import { RemoteAvatar } from './RemoteAvatar';
import { currentMonthStr } from '@/lib/dates';
import { fmt, fmtInt, rateText } from '@/lib/format';
import { computeMonthProjection } from '@/lib/projection';
import type { DailyRecord, GameOverview, OverallMetrics } from '@/lib/types';

export function GameDetailView({ appId }: { appId: string }) {
  const router = useRouter();
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const [meta, setMeta] = useState<{ name?: string; icon?: string | null }>({});
  const [month, setMonth] = useState(currentMonthStr());
  const [lookup, setLookup] = useState(appId);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<GameOverview | null>(null);
  const [overall, setOverall] = useState<OverallMetrics | null>(null);
  const [grandTotal, setGrandTotal] = useState<number | null>(null);
  const [earliestMonth, setEarliestMonth] = useState(currentMonthStr());
  const [dailyList, setDailyList] = useState<DailyRecord[]>([]);
  const [monthTotal, setMonthTotal] = useState<number | null>(null);
  const [monthDau, setMonthDau] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`tap_game_${appId}`);
      if (raw) setMeta(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [appId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/apps/${appId}/detail?month=${month}`, { cache: 'no-store' }).then(async (res) => {
      if (res.status === 401) {
        router.replace('/login');
        return;
      }
      const json = await res.json();
      if (cancelled) return;
      setOverview(json.overview);
      setOverall(json.overall);
      setGrandTotal(json.grandTotal);
      setEarliestMonth(json.earliestMonth || currentMonthStr());
      setDailyList(json.month?.dailyList || []);
      setMonthTotal(json.month?.monthTotal ?? null);
      setMonthDau(json.month?.monthDau || 0);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [appId, month, router]);

  const proj =
    overview?.monthRevenue != null
      ? computeMonthProjection(overview.monthRevenueList, overview.monthRevenue)
      : null;
  const pickedRec = picked ? dailyList.find((d) => d.date === picked) || null : null;
  const conv =
    overview && overview.yesterdayRevenue != null && overview.yesterdayDAU > 0
      ? (overview.yesterdayRevenue / overview.yesterdayDAU) * 100
      : null;
  const monthConv = monthTotal != null && monthDau > 0 ? (monthTotal / monthDau) * 100 : null;

  const tiles = [
    {
      tag: '昨日 · 广告收益',
      value: overview?.yesterdayRevenue == null ? '暂无' : `¥${fmt(overview.yesterdayRevenue)}`,
      mom: <MomChip cur={overview?.yesterdayRevenue} prev={overview?.prevDayRevenue} />,
    },
    {
      tag: '昨日 · 日活',
      value: overview ? fmtInt(overview.yesterdayDAU) : '—',
      meta: conv == null ? '转化率 —' : `转化率 ${conv.toFixed(1)}%`,
      mom: <MomChip cur={overview?.yesterdayDAU} prev={overview?.prevDayDAU} />,
    },
    {
      tag: '昨日 · 曝光',
      value: overview ? fmtInt(overview.yesterdayImp) : '—',
      meta: overview ? `点击率 ${rateText(overview.yesterdayClickRate)}` : '',
      mom: <MomChip cur={overview?.yesterdayImp} prev={overview?.prevDayImp} />,
    },
    {
      tag: '本月 · 广告收益',
      value: overview?.monthRevenue == null ? '暂无' : `¥${fmt(overview.monthRevenue)}`,
      meta: proj ? `日均 ¥${fmt(proj.avg)}  ·  月末预估 ¥${fmt(proj.projection)}` : '',
      mom: <MomChip cur={overview?.monthRevenue} prev={overview?.lastMonthRevenue} />,
      span: true,
    },
  ];

  return (
    <Box sx={{ minHeight: '100dvh', position: 'relative' }}>
      <div className="grain" />
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(16px)',
          bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(11,16,22,0.86)' : 'rgba(243,245,247,0.86)'),
          borderBottom: 1,
          borderColor: 'divider',
          px: { xs: 1, sm: 2 },
          py: 1,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ maxWidth: 900, mx: 'auto' }}>
          <IconButton onClick={() => router.push('/')} aria-label="返回">
            <ArrowBack />
          </IconButton>
          <RemoteAvatar src={meta.icon} alt={meta.name} fallback={meta.name || appId} size={36} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography fontWeight={700} noWrap>
              {meta.name || `APP ${appId}`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ID {appId}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">
              累计收益
            </Typography>
            <Typography className="tabular" fontWeight={700}>
              {grandTotal == null ? '¥—' : `¥${fmt(grandTotal)}`}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box className="safe-bottom" sx={{ maxWidth: 900, mx: 'auto', px: { xs: 1.5, sm: 3 }, py: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
          <TextField
            size="small"
            fullWidth
            value={lookup}
            onChange={(e) => setLookup(e.target.value.replace(/\D/g, ''))}
            placeholder="输入任意 APP ID"
          />
          <Button
            variant="contained"
            disabled={!lookup || lookup === appId}
            onClick={() => router.push(`/game/${lookup}`)}
          >
            切换查看
          </Button>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
            gap: 1.2,
            mb: 1.5,
          }}
        >
          {tiles.map((t) => (
            <Card
              key={t.tag}
              sx={{
                p: 1.5,
                gridColumn: mobile && t.span ? '1 / -1' : 'auto',
                minHeight: 96,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  {t.tag}
                </Typography>
                {t.mom}
              </Stack>
              <Typography className="tabular" sx={{ mt: 0.6, fontSize: { xs: 18, sm: 22 }, fontWeight: 700 }}>
                {loading ? <Skeleton width={90} /> : t.value}
              </Typography>
              {t.meta ? (
                <Typography variant="caption" color="text.secondary">
                  {t.meta}
                </Typography>
              ) : null}
            </Card>
          ))}
        </Box>

        <Card sx={{ p: 1.4, mb: 1.5, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="caption" fontWeight={700} sx={{ width: { xs: '100%', sm: 'auto' }, pt: 0.4 }}>
            游戏整体
          </Typography>
          {[
            ['次留', overall?.retA1d],
            ['3留', overall?.retA3d],
            ['7留', overall?.retA7d],
            ['启动率', overall?.startRate],
            ['时长', overall?.durationAvg],
          ].map(([k, v]) => (
            <Box key={String(k)} sx={{ minWidth: 64 }}>
              <Typography variant="caption" color="text.secondary">
                {k}
              </Typography>
              <Typography fontWeight={700}>{v == null || v === '' ? '—' : String(v)}</Typography>
            </Box>
          ))}
        </Card>

        <Card sx={{ p: 1.4, mb: 1.5 }}>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Box>
              <Typography className="tabular" fontWeight={700}>
                {monthTotal == null ? '暂无' : `¥${fmt(monthTotal)}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                月总收入
              </Typography>
            </Box>
            <Box>
              <Typography className="tabular" fontWeight={700}>
                {fmtInt(monthDau)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                月总日活
              </Typography>
            </Box>
            <Box>
              <Typography className="tabular" fontWeight={700}>
                {monthConv == null ? '—' : `${monthConv.toFixed(1)}%`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                均转化
              </Typography>
            </Box>
          </Stack>
        </Card>

        <CalendarGrid
          month={month}
          earliestMonth={earliestMonth}
          dailyList={dailyList}
          onMonthChange={setMonth}
          onSelectDay={(date) => setPicked(date)}
        />
      </Box>

      <DayDetailDialog date={picked} rec={pickedRec} onClose={() => setPicked(null)} />
    </Box>
  );
}

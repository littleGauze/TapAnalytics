'use client';

import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { fmt, fmtInt } from '@/lib/format';
import { MomChip } from './MomChip';
import { RemoteAvatar } from './RemoteAvatar';
import type { Game, GameMetrics } from '@/lib/types';

function Metric({
  value,
  label,
  sub,
  loading,
}: {
  value: ReactNode;
  label: ReactNode;
  sub?: ReactNode;
  loading?: boolean;
}) {
  return (
    <Box sx={{ py: 1.1, px: 1.2, borderTop: 1, borderColor: 'divider' }}>
      <Typography className="tabular" fontWeight={700} sx={{ fontSize: { xs: 15, sm: 16 } }}>
        {loading ? <Skeleton width={72} /> : value}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', gap: 0.6, alignItems: 'center', flexWrap: 'wrap' }}>
        {label}
      </Typography>
      {sub ? (
        <Typography variant="caption" color="text.secondary">
          {sub}
        </Typography>
      ) : null}
    </Box>
  );
}

export function GameCard({
  game,
  metrics,
  onOpen,
}: {
  game: Game;
  metrics?: GameMetrics;
  onOpen: (id: string) => void;
}) {
  const loading = game.published && !metrics;
  const arpu =
    metrics && metrics.todayRevenue != null && metrics.todayDAU
      ? metrics.todayRevenue / metrics.todayDAU
      : null;

  return (
    <Card>
      <CardActionArea onClick={() => onOpen(game.appId)} sx={{ p: 0, alignItems: 'stretch' }}>
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ px: 1.5, py: 1.4 }}>
          <RemoteAvatar src={game.icon} alt={game.name} fallback={game.name} size={44} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography fontWeight={700} noWrap>
              {game.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {metrics?.totalRevenue != null
                ? `累计广告收益 ¥${fmt(metrics.totalRevenue)}`
                : loading
                  ? '累计收益同步中…'
                  : '累计收益未同步'}
            </Typography>
          </Box>
          <ChevronRight color="action" />
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
          }}
        >
          <Metric
            loading={loading}
            value={metrics?.todayEstimatedRevenue != null ? `¥${fmt(metrics.todayEstimatedRevenue)}` : '—'}
            label="今日预估收益"
            sub="按本月均值转化率估算"
          />
          <Metric
            loading={loading}
            value={metrics?.todayActiveDevices != null ? fmtInt(metrics.todayActiveDevices) : '—'}
            label="今日活跃"
          />
          <Metric
            loading={loading}
            value={metrics?.todayRevenue != null ? `¥${fmt(metrics.todayRevenue)}` : '—'}
            label={
              <>
                昨日广告收益
                <MomChip cur={metrics?.todayRevenue} prev={metrics?.prevDayRevenue} />
              </>
            }
          />
          <Metric
            loading={loading}
            value={metrics?.todayDAU != null ? fmtInt(metrics.todayDAU) : '—'}
            label={
              <>
                昨日日活
                <MomChip cur={metrics?.todayDAU} prev={metrics?.prevDayDAU} />
              </>
            }
            sub={arpu == null ? '转化率 —' : `转化率 ${(arpu * 100).toFixed(1)}%`}
          />
          <Metric
            loading={loading}
            value={metrics?.monthRevenue != null ? `¥${fmt(metrics.monthRevenue)}` : '—'}
            label={
              <>
                本月
                <MomChip cur={metrics?.monthRevenue} prev={metrics?.lastMonthRevenue} />
              </>
            }
          />
          <Metric
            loading={loading}
            value={metrics?.todayImpression != null ? fmtInt(metrics.todayImpression) : '—'}
            label="昨日曝光"
          />
        </Box>
      </CardActionArea>
    </Card>
  );
}

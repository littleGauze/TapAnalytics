'use client';

import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Close from '@mui/icons-material/Close';
import { dayRevenueView } from '@/lib/estimate';
import { fmt, fmtInt, rateText } from '@/lib/format';
import { todayStr } from '@/lib/dates';
import type { DailyRecord } from '@/lib/types';

function Cell({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box sx={{ p: 1.1, borderRadius: 2, bgcolor: 'action.hover' }}>
      <Typography className="tabular" fontWeight={700}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

export function DayDetailDialog({
  date,
  rec,
  meanArpu,
  onClose,
}: {
  date: string | null;
  rec: DailyRecord | null;
  meanArpu: number | null;
  onClose: () => void;
}) {
  if (!date) return null;
  const [y, m, d] = date.split('-').map(Number);
  const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const wd = new Date(y, m - 1, d).getDay();
  const isToday = date === todayStr();
  const view = dayRevenueView(rec, meanArpu);
  const durVal = rec?.durationAvg;
  const durDisplay =
    durVal != null && durVal !== '' && parseFloat(String(durVal)) > 0 ? `${durVal}分` : '—';
  const hasFunnel = (rec?.impression || 0) > 0;

  return (
    <Dialog open={!!date} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pr: 6 }}>
        {m}月{d}日{' '}
        <Typography component="span" color="text.secondary">
          {weekNames[wd]}
        </Typography>
        {isToday ? ' · 今日' : ''}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            p: 1.6,
            mb: 1.5,
            borderRadius: 3,
            background: (t) =>
              view.isEst
                ? `linear-gradient(135deg, ${t.palette.grey[700]}, ${t.palette.grey[500]})`
                : `linear-gradient(135deg, ${t.palette.primary.dark}, ${t.palette.primary.main})`,
            color: 'primary.contrastText',
          }}
        >
          <Typography variant="caption">
            {view.value == null ? '真实收益未同步' : view.isEst ? '单日预估收益' : '广告收益'}
          </Typography>
          <Typography className="tabular" sx={{ fontSize: 28, fontWeight: 700, opacity: view.isEst ? 0.92 : 1 }}>
            {view.value == null ? '暂无' : `¥${fmt(view.value)}`}
          </Typography>
          {view.isEst ? (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.6, opacity: 0.85 }}>
              真实收益 T+1 未同步 · 按本月均值转化率 × 当日活跃估算
            </Typography>
          ) : null}
        </Box>
        {view.value == null && isToday ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.2 }}>
            今日真实收益尚未同步，当前只展示已返回的活跃数据。
          </Typography>
        ) : null}
        {view.value == null && !isToday ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.2 }}>
            该日真实收益尚未同步，且暂无足够本月数据做预估。
          </Typography>
        ) : null}
        <Grid container spacing={1}>
          <Grid size={6}>
            <Cell label="活跃" value={fmtInt(rec?.dau)} />
          </Grid>
          <Grid size={6}>
            <Cell label="新增" value={fmtInt(rec?.newUsers)} />
          </Grid>
          <Grid size={6}>
            <Cell
              label={view.isEst ? '均值转化率' : '转化率'}
              value={view.arpuPct == null ? '—' : `${view.arpuPct.toFixed(1)}%`}
            />
          </Grid>
          <Grid size={6}>
            <Cell label="日均时长" value={durDisplay} />
          </Grid>
        </Grid>
        <Typography fontWeight={700} sx={{ mt: 2, mb: 1 }}>
          转化效果
        </Typography>
        {hasFunnel ? (
          <Grid container spacing={1}>
            <Grid size={4}>
              <Cell label="曝光" value={fmtInt(rec?.impression)} />
            </Grid>
            <Grid size={4}>
              <Cell label="点击" value={fmtInt(rec?.click)} />
            </Grid>
            <Grid size={4}>
              <Cell label="点击率" value={rateText(rec?.clickRate)} />
            </Grid>
            <Grid size={4}>
              <Cell label="详情页转化" value={fmtInt(rec?.convDetail)} />
            </Grid>
            <Grid size={4}>
              <Cell label="详情页转化率" value={rateText(rec?.convDetailRate)} />
            </Grid>
            <Grid size={4}>
              <Cell label="转化总量" value={fmtInt(rec?.convTotal)} />
            </Grid>
          </Grid>
        ) : (
          <Typography variant="body2" color="text.secondary">
            该日暂无投放 / 转化数据
          </Typography>
        )}
        <Stack sx={{ height: 8 }} />
      </DialogContent>
    </Dialog>
  );
}

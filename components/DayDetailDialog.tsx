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
  onClose,
}: {
  date: string | null;
  rec: DailyRecord | null;
  onClose: () => void;
}) {
  if (!date) return null;
  const [y, m, d] = date.split('-').map(Number);
  const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const wd = new Date(y, m - 1, d).getDay();
  const isToday = date === todayStr();
  const arpuPct = rec?.revenue != null && rec.dau > 0 ? (rec.revenue / rec.dau) * 100 : null;
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
            background: (t) => `linear-gradient(135deg, ${t.palette.primary.dark}, ${t.palette.primary.main})`,
            color: 'primary.contrastText',
          }}
        >
          <Typography variant="caption">{rec?.revenue == null ? '真实收益未同步' : '广告收益'}</Typography>
          <Typography className="tabular" sx={{ fontSize: 28, fontWeight: 700 }}>
            {rec?.revenue == null ? '暂无' : `¥${fmt(rec.revenue)}`}
          </Typography>
        </Box>
        <Grid container spacing={1}>
          <Grid size={6}><Cell label="活跃" value={fmtInt(rec?.dau)} /></Grid>
          <Grid size={6}><Cell label="新增" value={fmtInt(rec?.newUsers)} /></Grid>
          <Grid size={6}><Cell label="转化率" value={arpuPct == null ? '—' : `${arpuPct.toFixed(1)}%`} /></Grid>
          <Grid size={6}><Cell label="日均时长" value={durDisplay} /></Grid>
        </Grid>
        <Typography fontWeight={700} sx={{ mt: 2, mb: 1 }}>
          转化效果
        </Typography>
        {hasFunnel ? (
          <Grid container spacing={1}>
            <Grid size={4}><Cell label="曝光" value={fmtInt(rec?.impression)} /></Grid>
            <Grid size={4}><Cell label="点击" value={fmtInt(rec?.click)} /></Grid>
            <Grid size={4}><Cell label="点击率" value={rateText(rec?.clickRate)} /></Grid>
            <Grid size={4}><Cell label="详情页转化" value={fmtInt(rec?.convDetail)} /></Grid>
            <Grid size={4}><Cell label="详情页转化率" value={rateText(rec?.convDetailRate)} /></Grid>
            <Grid size={4}><Cell label="转化总量" value={fmtInt(rec?.convTotal)} /></Grid>
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

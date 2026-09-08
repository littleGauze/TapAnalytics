'use client';

import Chip from '@mui/material/Chip';
import { momPct } from '@/lib/format';

export function MomChip({
  cur,
  prev,
  onColor,
}: {
  cur: number | null | undefined;
  prev: number | null | undefined;
  onColor?: boolean;
}) {
  const pct = momPct(cur, prev);
  if (pct == null) return null;
  const abs = Math.abs(pct);
  const flat = abs < 0.05;
  const up = pct > 0;
  return (
    <Chip
      size="small"
      label={flat ? '持平' : `${up ? '↑' : '↓'} ${abs.toFixed(1)}%`}
      sx={{
        height: 20,
        fontSize: 11,
        fontWeight: 700,
        bgcolor: onColor
          ? 'rgba(255,255,255,0.18)'
          : flat
            ? 'action.hover'
            : up
              ? 'rgba(34,160,107,0.12)'
              : 'rgba(229,72,77,0.12)',
        color: onColor ? 'inherit' : flat ? 'text.secondary' : up ? 'success.main' : 'error.main',
        '& .MuiChip-label': { px: 0.8 },
      }}
    />
  );
}

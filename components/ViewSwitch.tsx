'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import ShowChart from '@mui/icons-material/ShowChart';

export type DetailViewMode = 'calendar' | 'trend';

export function ViewSwitch({
  value,
  onChange,
}: {
  value: DetailViewMode;
  onChange: (v: DetailViewMode) => void;
}) {
  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        width: 'fit-content',
        mx: 'auto',
        mb: 1.5,
        p: 0.4,
        borderRadius: 999,
        bgcolor: 'action.hover',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 3,
          left: 3,
          width: 'calc(50% - 3px)',
          height: 'calc(100% - 6px)',
          borderRadius: 999,
          bgcolor: 'background.paper',
          boxShadow: 1,
          transition: 'transform .28s cubic-bezier(.4,0,.2,1)',
          transform: value === 'trend' ? 'translateX(100%)' : 'none',
        }}
      />
      {(
        [
          { key: 'calendar' as const, label: '日历', icon: <CalendarMonth sx={{ fontSize: 16 }} /> },
          { key: 'trend' as const, label: '趋势', icon: <ShowChart sx={{ fontSize: 16 }} /> },
        ]
      ).map((item) => (
        <Box
          key={item.key}
          component="button"
          type="button"
          onClick={() => onChange(item.key)}
          sx={{
            position: 'relative',
            zIndex: 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.75,
            minWidth: 88,
            border: 0,
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            color: value === item.key ? 'text.primary' : 'text.secondary',
            px: 2.2,
            py: 0.85,
            borderRadius: 999,
            fontFamily: 'inherit',
          }}
        >
          <Stack direction="row" spacing={0.75} alignItems="center">
            {item.icon}
            <span>{item.label}</span>
          </Stack>
        </Box>
      ))}
    </Box>
  );
}

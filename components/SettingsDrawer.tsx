'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import Close from '@mui/icons-material/Close';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { ACCENTS } from '@/theme/theme';
import { usePrefs } from './AppProviders';
import { RemoteAvatar } from './RemoteAvatar';
import type { Accent, SessionPayload, ThemeMode } from '@/lib/types';

export function SettingsDrawer({
  open,
  onClose,
  session,
  onAddAccount,
  onSwitchAccount,
  onRemoveAccount,
}: {
  open: boolean;
  onClose: () => void;
  session: SessionPayload | null;
  onAddAccount: () => void;
  onSwitchAccount: (id: string) => void;
  onRemoveAccount: (id: string) => void;
}) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const prefs = usePrefs();
  const [goal, setGoal] = useState(prefs.monthGoal ? String(prefs.monthGoal) : '');

  return (
    <Drawer
      anchor={mobile ? 'bottom' : 'right'}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: mobile ? '100%' : 420,
          maxHeight: mobile ? '88vh' : '100%',
          borderRadius: mobile ? '20px 20px 0 0' : 0,
          p: 2.2,
        },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            控制面板
          </Typography>
          <Typography variant="h6">控制台设置</Typography>
        </Box>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </Stack>

      <Typography fontWeight={700} sx={{ mt: 1 }}>
        外观主题
      </Typography>
      <Typography variant="caption" color="text.secondary">
        切换浅色 / 深色，并选择强调色
      </Typography>
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        value={prefs.mode}
        onChange={(_, v: ThemeMode | null) => v && prefs.setMode(v)}
        sx={{ mt: 1.2 }}
      >
        <ToggleButton value="light">浅色</ToggleButton>
        <ToggleButton value="dark">深色</ToggleButton>
      </ToggleButtonGroup>
      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
        {(Object.keys(ACCENTS) as Accent[]).map((key) => (
          <Box
            key={key}
            component="button"
            onClick={() => prefs.setAccent(key)}
            aria-label={ACCENTS[key].label}
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: prefs.accent === key ? '2px solid' : '2px solid transparent',
              borderColor: 'text.primary',
              background: ACCENTS[key].main,
              cursor: 'pointer',
            }}
          />
        ))}
      </Stack>

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2 }}>
        <Typography>音效</Typography>
        <Switch checked={prefs.sound} onChange={(e) => prefs.setSound(e.target.checked)} />
      </Stack>

      <Divider sx={{ my: 2 }} />
      <Typography fontWeight={700}>月度目标</Typography>
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <TextField
          size="small"
          fullWidth
          type="number"
          placeholder="例如 10000"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />
        <Button
          variant="contained"
          onClick={() => {
            const n = parseFloat(goal);
            prefs.setMonthGoal(n > 0 ? n : null);
          }}
        >
          保存
        </Button>
      </Stack>

      <Divider sx={{ my: 2 }} />
      <Typography fontWeight={700}>开发者账号仓库</Typography>
      <Typography variant="caption" color="text.secondary">
        每个账号保存独立登录会话，切换后自动刷新收益数据
      </Typography>
      <List dense>
        {(session?.accounts || []).map((acc) => (
          <ListItem
            key={acc.id}
            disablePadding
            secondaryAction={
              <IconButton edge="end" onClick={() => onRemoveAccount(acc.id)}>
                <DeleteOutline />
              </IconButton>
            }
          >
            <ListItemButton selected={session?.account?.id === acc.id} onClick={() => onSwitchAccount(acc.id)}>
              <ListItemAvatar>
                <RemoteAvatar
                  src={acc.developerAvatar || acc.avatar}
                  alt={acc.developerName || acc.nickname || acc.name}
                  fallback={acc.developerName || acc.nickname || acc.name}
                  size={40}
                  rounded={false}
                />
              </ListItemAvatar>
              <ListItemText
                primary={acc.developerName || acc.nickname || acc.name}
                secondary={`ID ${acc.developerId}`}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Button variant="outlined" fullWidth onClick={onAddAccount} sx={{ mt: 0.5 }}>
        + 接入其他账号
      </Button>

      <Divider sx={{ my: 2 }} />
      <Typography variant="caption" color="text.secondary">
        系统信息
      </Typography>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="body2">版本</Typography>
        <Typography variant="body2">TapAnalytics / 1.0.0</Typography>
      </Stack>
    </Drawer>
  );
}

'use client';

import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Refresh from '@mui/icons-material/Refresh';
import Settings from '@mui/icons-material/Settings';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import { RemoteAvatar } from './RemoteAvatar';
import type { AccountPublic, SessionPayload, Studio } from '@/lib/types';

export function AppShell({
  session,
  onRefresh,
  onOpenSettings,
  onSwitchStudio,
  children,
}: {
  session: SessionPayload | null;
  onRefresh?: () => void;
  onOpenSettings?: () => void;
  onSwitchStudio?: (id: string) => void;
  children: React.ReactNode;
}) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const acc = session?.account;
  const name = acc?.developerName || acc?.nickname || acc?.name || '未连接';
  const studios: Studio[] = session?.studios || acc?.studios || [];

  return (
    <Box sx={{ minHeight: '100dvh', position: 'relative' }}>
      <div className="grain" />
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          backdropFilter: 'blur(16px)',
          bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(11,16,22,0.82)' : 'rgba(243,245,247,0.82)'),
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 1.5, sm: 2 } }}>
          <Avatar src="/app-icon.png" variant="rounded" sx={{ width: 32, height: 32, mr: 1.2 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, lineHeight: 1.1, fontSize: { xs: 16, sm: 18 } }}>
              TapAnalytics
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1.4, display: { xs: 'none', sm: 'block' } }}>
              数据指挥中心
            </Typography>
          </Box>
          {onRefresh ? (
            <IconButton onClick={onRefresh} aria-label="同步数据">
              <Refresh />
            </IconButton>
          ) : null}
          {onOpenSettings ? (
            <IconButton onClick={onOpenSettings} aria-label="设置">
              <Settings />
            </IconButton>
          ) : null}
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" className="safe-bottom" sx={{ position: 'relative', zIndex: 1, pt: { xs: 1.5, sm: 2.5 }, px: { xs: 1.5, sm: 3 } }}>
        {session ? (
          <Stack
            direction="row"
            spacing={1.25}
            alignItems="center"
            sx={{
              mb: 2,
              p: { xs: 1.1, sm: 1.4 },
              borderRadius: 3,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
            }}
          >
            <RemoteAvatar
              src={acc?.developerAvatar || acc?.avatar}
              alt={name}
              fallback={name}
              size={40}
              rounded={false}
            />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                运营主体
              </Typography>
              <Typography fontWeight={700} noWrap>
                {name}
              </Typography>
              <Typography variant="caption" color="text.secondary" className="tabular">
                ID {session.developerId || '—'}
              </Typography>
            </Box>
            {studios.length > 1 ? (
              <>
                <Button
                  size="small"
                  endIcon={<KeyboardArrowDown />}
                  onClick={(e) => setAnchor(e.currentTarget)}
                  sx={{ flexShrink: 0, fontSize: { xs: 12, sm: 13 } }}
                >
                  切换工作室
                </Button>
                <Menu open={!!anchor} anchorEl={anchor} onClose={() => setAnchor(null)}>
                  {studios.map((s) => (
                    <MenuItem
                      key={s.id}
                      selected={s.id === session.developerId}
                      onClick={() => {
                        setAnchor(null);
                        onSwitchStudio?.(s.id);
                      }}
                    >
                      <Box sx={{ mr: 1 }}>
                        <RemoteAvatar src={s.logo} alt={s.name} fallback={s.name} size={24} rounded={false} />
                      </Box>
                      {s.name}
                    </MenuItem>
                  ))}
                </Menu>
              </>
            ) : null}
          </Stack>
        ) : null}
        {children}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 3, mb: 1 }}>
          TapAnalytics / v1.0.0 · Next.js
        </Typography>
      </Container>
    </Box>
  );
}

export type { AccountPublic };

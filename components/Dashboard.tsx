'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { AppShell } from './AppShell';
import { GameCard } from './GameCard';
import { SettingsDrawer } from './SettingsDrawer';
import { StatTiles } from './StatTiles';
import type { Game, GameMetrics, SessionPayload } from '@/lib/types';

async function mapPool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) || 0 }, async () => {
      while (queue.length) {
        const item = queue.shift();
        if (item) await fn(item);
      }
    }),
  );
}

export function Dashboard() {
  const router = useRouter();
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [metrics, setMetrics] = useState<Record<string, GameMetrics>>({});
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(false);
  const [appId, setAppId] = useState('');

  const loadSession = useCallback(async () => {
    const res = await fetch('/api/auth/session', { cache: 'no-store' });
    const json = (await res.json()) as SessionPayload;
    setSession(json);
    return json;
  }, []);

  const loadGames = useCallback(async () => {
    const res = await fetch('/api/apps', { cache: 'no-store' });
    if (res.status === 401) {
      router.replace('/login');
      return [];
    }
    const json = await res.json();
    const list: Game[] = json.games || [];
    setGames(list);
    return list;
  }, [router]);

  const loadMetrics = useCallback(async (list: Game[]) => {
    const published = list.filter((g) => g.published);
    await mapPool(published, 4, async (g) => {
      const res = await fetch(`/api/apps/${g.appId}/metrics`, { cache: 'no-store' });
      if (!res.ok) return;
      const m = (await res.json()) as GameMetrics;
      setMetrics((prev) => ({ ...prev, [g.appId]: m }));
    });
  }, []);

  const boot = useCallback(async () => {
    setLoading(true);
    setMetrics({});
    const s = await loadSession();
    if (s.status === 'unauthenticated') {
      router.replace('/login');
      return;
    }
    const list = await loadGames();
    setLoading(false);
    await loadMetrics(list);
  }, [loadGames, loadMetrics, loadSession, router]);

  useEffect(() => {
    boot();
  }, [boot]);

  const sorted = useMemo(() => {
    return [...games].sort((a, b) => (b.createdAt || Number(b.appId)) - (a.createdAt || Number(a.appId)));
  }, [games]);

  if (!session || session.status === 'unauthenticated') {
    return (
      <Box
        sx={{
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          px: 3,
        }}
      >
        <Box>
          <Box
            component="img"
            src="/app-icon.png"
            alt="TapAnalytics"
            sx={{ width: 88, height: 88, borderRadius: 3, mb: 2 }}
          />
          <Typography variant="h5">TapAnalytics</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            正在校验会话…
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <AppShell
      session={session}
      onRefresh={boot}
      onOpenSettings={() => setSettings(true)}
      onSwitchStudio={async (id) => {
        await fetch('/api/studio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ developerId: id }),
        });
        boot();
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{ mb: 2 }}
      >
        <TextField
          size="small"
          fullWidth
          placeholder="输入 APP ID，直接查看收益 / 日活"
          value={appId}
          onChange={(e) => setAppId(e.target.value.replace(/\D/g, ''))}
          inputProps={{ inputMode: 'numeric' }}
        />
        <Button
          variant="contained"
          disabled={!appId}
          onClick={() => router.push(`/game/${appId}`)}
          sx={{ minWidth: { sm: 88 } }}
        >
          查看
        </Button>
      </Stack>

      <StatTiles games={games} metrics={metrics} loading={loading} />

      <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mt: 2.5, mb: 1.2 }}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            02 · 项目收益
          </Typography>
          <Typography fontWeight={700}>项目列表</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {games.length} 个
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 1.25,
        }}
      >
        {sorted.map((g) => (
          <GameCard
            key={g.appId}
            game={g}
            metrics={metrics[g.appId]}
            onOpen={(id) => {
              const game = games.find((x) => x.appId === id);
              try {
                sessionStorage.setItem(
                  `tap_game_${id}`,
                  JSON.stringify({ name: game?.name, icon: game?.icon }),
                );
              } catch {
                /* ignore */
              }
              router.push(`/game/${id}`);
            }}
          />
        ))}
      </Box>
      {!loading && games.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" sx={{ py: 6 }}>
          暂无游戏数据
        </Typography>
      ) : null}

      <SettingsDrawer
        open={settings}
        onClose={() => setSettings(false)}
        session={session}
        onAddAccount={() => {
          setSettings(false);
          router.push('/login?mode=add');
        }}
        onSwitchAccount={async (id) => {
          await fetch('/api/accounts/switch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          });
          setSettings(false);
          boot();
        }}
        onRemoveAccount={async (id) => {
          await fetch(`/api/accounts?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
          boot();
        }}
      />
    </AppShell>
  );
}

'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { buildTheme } from '@/theme/theme';
import type { Accent, ThemeMode } from '@/lib/types';

const MODE_KEY = 'taptap_theme_mode';
const ACCENT_KEY = 'taptap_theme_accent';
const SOUND_KEY = 'taptap_sound_enabled';
const GOAL_KEY = 'taptap_month_goal';

interface Prefs {
  mode: ThemeMode;
  accent: Accent;
  sound: boolean;
  monthGoal: number | null;
  setMode: (m: ThemeMode) => void;
  setAccent: (a: Accent) => void;
  setSound: (v: boolean) => void;
  setMonthGoal: (n: number | null) => void;
}

const PrefsContext = createContext<Prefs | null>(null);

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs outside provider');
  return ctx;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [accent, setAccentState] = useState<Accent>('cyan');
  const [sound, setSoundState] = useState(true);
  const [monthGoal, setGoalState] = useState<number | null>(null);

  useEffect(() => {
    const m = localStorage.getItem(MODE_KEY) as ThemeMode | null;
    const a = localStorage.getItem(ACCENT_KEY) as Accent | null;
    if (m === 'light' || m === 'dark') setModeState(m);
    if (a && ['cyan', 'pink', 'purple', 'mint'].includes(a)) setAccentState(a);
    setSoundState(localStorage.getItem(SOUND_KEY) !== '0');
    const g = parseFloat(localStorage.getItem(GOAL_KEY) || '');
    setGoalState(g > 0 ? g : null);
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    localStorage.setItem(MODE_KEY, m);
  }, []);
  const setAccent = useCallback((a: Accent) => {
    setAccentState(a);
    localStorage.setItem(ACCENT_KEY, a);
  }, []);
  const setSound = useCallback((v: boolean) => {
    setSoundState(v);
    localStorage.setItem(SOUND_KEY, v ? '1' : '0');
  }, []);
  const setMonthGoal = useCallback((n: number | null) => {
    setGoalState(n);
    if (n && n > 0) localStorage.setItem(GOAL_KEY, String(n));
    else localStorage.removeItem(GOAL_KEY);
  }, []);

  const theme = useMemo(() => buildTheme(mode, accent), [mode, accent]);
  const prefs = useMemo(
    () => ({ mode, accent, sound, monthGoal, setMode, setAccent, setSound, setMonthGoal }),
    [mode, accent, sound, monthGoal, setMode, setAccent, setSound, setMonthGoal],
  );

  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <PrefsContext.Provider value={prefs}>{children}</PrefsContext.Provider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}

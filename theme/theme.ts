import { createTheme } from '@mui/material/styles';
import type { Accent, ThemeMode } from '@/lib/types';

export const ACCENTS: Record<Accent, { main: string; dark: string; light: string; label: string }> = {
  cyan: { main: '#00C4CD', dark: '#009AA1', light: '#5EE1E8', label: '晴空青' },
  pink: { main: '#FF7FB3', dark: '#E85A96', light: '#FFB1D0', label: '樱花粉' },
  purple: { main: '#8B7CF6', dark: '#6E5EE0', light: '#B4A8FB', label: '雾紫' },
  mint: { main: '#36C9A0', dark: '#1FA883', light: '#7DE3C2', label: '薄荷绿' },
};

export function buildTheme(mode: ThemeMode, accent: Accent) {
  const a = ACCENTS[accent];
  const dark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: { main: a.main, dark: a.dark, light: a.light, contrastText: dark ? '#041016' : '#042428' },
      secondary: { main: dark ? '#94A3B8' : '#475569' },
      background: {
        default: dark ? '#0B1016' : '#F3F5F7',
        paper: dark ? '#151C24' : '#FFFFFF',
      },
      text: {
        primary: dark ? '#E8EEF4' : '#12202A',
        secondary: dark ? '#9AA8B5' : '#5B6B76',
      },
      divider: dark ? 'rgba(255,255,255,0.08)' : 'rgba(18,32,42,0.08)',
      success: { main: '#22A06B' },
      error: { main: '#E5484D' },
    },
    shape: { borderRadius: 16 },
    typography: {
      fontFamily: [
        '"Noto Sans SC"',
        '"PingFang SC"',
        '"Microsoft YaHei"',
        '-apple-system',
        'BlinkMacSystemFont',
        'sans-serif',
      ].join(','),
      h1: { fontWeight: 700, letterSpacing: '-0.02em' },
      h2: { fontWeight: 700, letterSpacing: '-0.02em' },
      h3: { fontWeight: 700, letterSpacing: '-0.02em' },
      h4: { fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      button: { textTransform: 'none', fontWeight: 700 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundImage: dark
              ? 'radial-gradient(1200px 600px at 10% -10%, rgba(0,196,205,0.12), transparent 55%)'
              : 'radial-gradient(1200px 600px at 10% -10%, rgba(0,196,205,0.10), transparent 55%)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 12 },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 18,
            border: dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(18,32,42,0.06)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
    },
  });
}

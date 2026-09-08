import type { Metadata, Viewport } from 'next';
import { AppProviders } from '@/components/AppProviders';
import './globals.css';

export const metadata: Metadata = {
  title: 'TapAnalytics · 数据指挥中心',
  description: 'TapTap 开发者数据助手（Next.js + Material UI）',
  applicationName: 'TapAnalytics',
  appleWebApp: { capable: true, title: 'TapAnalytics', statusBarStyle: 'default' },
  referrer: 'no-referrer',
  icons: { icon: '/app-icon.png', apple: '/app-icon.png' },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#00C4CD',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

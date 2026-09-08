import type { Metadata, Viewport } from 'next';
import { Noto_Sans_SC } from 'next/font/google';
import { AppProviders } from '@/components/AppProviders';
import './globals.css';

const body = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

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
    <html lang="zh-CN" className={body.className}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

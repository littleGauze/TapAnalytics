import { NextRequest, NextResponse } from 'next/server';
import { SITE_AUTH_COOKIE, siteAuthConfigured, verifySiteSession } from '@/lib/site-auth';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const api = path === '/api' || path.startsWith('/api/');
  const origin = request.headers.get('origin');
  if (api && !['GET', 'HEAD', 'OPTIONS'].includes(request.method) && origin) {
    let sameOrigin = false;
    try {
      sameOrigin = new URL(origin).host === request.headers.get('host');
    } catch {}
    if (!sameOrigin) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
  }

  if (
    path === '/access' ||
    path === '/api/access' ||
    path.startsWith('/_next/static/') ||
    ['/app-icon.png', '/favicon.ico', '/manifest.json'].includes(path)
  ) {
    return NextResponse.next();
  }

  if (!siteAuthConfigured()) {
    return NextResponse.json({ error: '站点登录尚未配置' }, { status: 503 });
  }

  if (!verifySiteSession(request.cookies.get(SITE_AUTH_COOKIE)?.value)) {
    const response = api
      ? NextResponse.json({ error: 'site_auth_required' }, { status: 401 })
      : NextResponse.redirect(new URL('/access', request.url));
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  }

  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  runtime: 'nodejs',
  matcher: '/:path*',
};

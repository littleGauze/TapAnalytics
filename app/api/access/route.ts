import { NextRequest, NextResponse } from 'next/server';
import {
  SITE_AUTH_COOKIE,
  createSiteSession,
  siteAuthConfigured,
  siteCookieOptions,
  verifySiteCredentials,
} from '@/lib/site-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const failures = new Map<string, { count: number; expires: number }>();
const RETRY_WINDOW = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  if (!siteAuthConfigured()) {
    return NextResponse.json({ error: '站点登录尚未配置' }, { status: 503 });
  }
  const now = Date.now();
  for (const [address, entry] of failures) {
    if (entry.expires <= now) failures.delete(address);
  }
  const address = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const entry = failures.get(address);
  if (entry && entry.count >= 10) {
    return NextResponse.json(
      { error: '尝试次数过多，请稍后再试' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((entry.expires - now) / 1000)) } },
    );
  }
  const body = await request.json().catch(() => null);
  if (
    typeof body?.username !== 'string' ||
    typeof body?.password !== 'string' ||
    body.username.length > 256 ||
    body.password.length > 1024 ||
    !verifySiteCredentials(body.username, body.password)
  ) {
    failures.set(address, { count: (entry?.count || 0) + 1, expires: entry?.expires || now + RETRY_WINDOW });
    return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
  }
  failures.delete(address);
  const response = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  response.cookies.set(SITE_AUTH_COOKIE, createSiteSession(), siteCookieOptions);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  response.cookies.set(SITE_AUTH_COOKIE, '', { ...siteCookieOptions, maxAge: 0 });
  return response;
}

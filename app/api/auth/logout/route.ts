import { NextResponse } from 'next/server';
import { clearAidCookie } from '@/lib/session';
import { SITE_AUTH_COOKIE, siteCookieOptions } from '@/lib/site-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  await clearAidCookie();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SITE_AUTH_COOKIE, '', { ...siteCookieOptions, maxAge: 0 });
  return response;
}

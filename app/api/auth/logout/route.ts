import { NextResponse } from 'next/server';
import { clearAidCookie } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  await clearAidCookie();
  return NextResponse.json({ ok: true });
}

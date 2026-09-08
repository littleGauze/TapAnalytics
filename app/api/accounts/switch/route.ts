import { NextResponse } from 'next/server';
import { switchAccount } from '@/lib/store';
import { setAidCookie } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const acc = switchAccount(String(body.id || ''));
  if (!acc) return NextResponse.json({ ok: false, error: '账号不存在' }, { status: 404 });
  await setAidCookie(acc.id);
  return NextResponse.json({ ok: true, developerId: acc.developerId });
}

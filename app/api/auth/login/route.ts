import { NextResponse } from 'next/server';
import { loadStore, upsertAccount } from '@/lib/store';
import { normalizeCookieHeader, probeDeveloper } from '@/lib/taptap';
import { setAidCookie } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const cookie = normalizeCookieHeader(String(body.cookie || ''));
  const mode = body.mode === 'add' ? 'add' : 'login';
  if (!cookie) {
    return NextResponse.json({ ok: false, error: '请粘贴 TapTap 登录 Cookie' }, { status: 400 });
  }

  const result = await probeDeveloper(cookie);
  if (!result) {
    return NextResponse.json(
      { ok: false, error: 'Cookie 无效或账号没有开发者权限，请重新从开发者中心复制' },
      { status: 401 },
    );
  }

  const store = loadStore();
  const acc = upsertAccount(store, { ...result, cookies: cookie }, mode);
  if (mode === 'login') await setAidCookie(acc.id);

  return NextResponse.json({
    ok: true,
    developerId: result.developerId,
    accountId: acc.id,
  });
}

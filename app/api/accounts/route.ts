import { NextResponse } from 'next/server';
import { loadStore, publicAccounts, removeAccount } from '@/lib/store';
import { clearAidCookie, setAidCookie } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const store = loadStore();
  return NextResponse.json({ current: store.current, accounts: publicAccounts(store) });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  const store = loadStore();
  const wasCurrent = store.current === id;
  const ok = removeAccount(id);
  if (wasCurrent) {
    const next = loadStore();
    if (next.current) await setAidCookie(next.current);
    else await clearAidCookie();
  }
  return NextResponse.json({ ok });
}

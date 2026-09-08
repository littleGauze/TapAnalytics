import { NextResponse } from 'next/server';
import { switchStudio } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const ok = switchStudio(String(body.developerId || ''));
  return NextResponse.json({ ok });
}

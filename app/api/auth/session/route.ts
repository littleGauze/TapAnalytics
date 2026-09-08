import { NextResponse } from 'next/server';
import { buildSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await buildSession();
  return NextResponse.json(session);
}

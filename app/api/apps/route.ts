import { NextResponse } from 'next/server';
import { developerIdOf } from '@/lib/api';
import { normalizeAssetUrl, taptapFetch, TAPTAP_ORIGIN } from '@/lib/taptap';
import { currentAccount } from '@/lib/store';
import type { Game } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isPublished(app: any): boolean {
  const status = app?.review_status;
  if (status && Number(status.value) === 4) return true;
  if (status && (status.label === '已上线' || status.name === '已上线')) return true;
  if (Number(app?.status) === 4) return true;
  return false;
}

function appTime(app: any): number {
  const v =
    app.created_time ??
    app.create_time ??
    app.created_at ??
    app.published_time ??
    app.publish_time ??
    app.online_time ??
    app.release_time ??
    app.updated_time ??
    app.update_time ??
    app.ctime ??
    app.created;
  if (typeof v === 'number' && Number.isFinite(v)) return v > 1e12 ? v : v * 1000;
  if (typeof v === 'string' && v) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 10000) return n > 1e12 ? n : n * 1000;
    const t = Date.parse(v);
    if (Number.isFinite(t)) return t;
  }
  return Number(app.id) || 0;
}

function getAppIcon(app: any): string | null {
  return (
    normalizeAssetUrl(app.icon?.medium_url || app.icon?.url || app.icon) ||
    normalizeAssetUrl(
      app.icon_url ||
        app.iconUrl ||
        app.logo ||
        app.logo_url ||
        app.cover ||
        app.cover_url ||
        app.image ||
        app.avatar ||
        app.thumb ||
        app.thumbnail,
    )
  );
}

export async function GET() {
  try {
    const acc = currentAccount();
    if (!acc?.cookies) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    const developerId = developerIdOf();
    const json = await taptapFetch(
      `${TAPTAP_ORIGIN}/api/app/v2/list?developer_id=${encodeURIComponent(developerId)}&page=1&pagesize=100`,
      acc.cookies,
    );
    if (!json.ok || !json.json?.success || !json.json?.data?.list) {
      return NextResponse.json({ error: 'App 列表获取失败', status: json.status }, { status: 502 });
    }
    const games: Game[] = json.json.data.list
      .filter(isPublished)
      .map((app: any) => ({
        appId: String(app.id),
        name: app.title,
        icon: getAppIcon(app),
        published: true,
        createdAt: appTime(app),
      }))
      .sort((a: Game, b: Game) => b.createdAt - a.createdAt || Number(b.appId) - Number(a.appId));
    return NextResponse.json({ developerId, games });
  } catch (err) {
    const message = (err as Error).message;
    const status = message === 'UNAUTHENTICATED' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

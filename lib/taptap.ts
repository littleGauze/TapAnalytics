import type { Studio } from './types';

export const TAPTAP_ORIGIN = 'https://developer.taptap.cn';
export const TAPTAP_REFERER = 'https://developer.taptap.cn/';
export const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function toSafeString(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.url === 'string') return o.url.trim();
    if (typeof o.src === 'string') return o.src.trim();
  }
  return '';
}

function firstNonBlank(obj: Record<string, unknown> | null | undefined, ...keys: string[]): string {
  if (!obj) return '';
  for (const k of keys) {
    const v = toSafeString(obj[k]);
    if (v) return v;
  }
  return '';
}

export function normalizeUrl(u: unknown): string {
  const s = toSafeString(u);
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:')) return s;
  if (s.startsWith('//')) return `https:${s}`;
  return s;
}

export function normalizeStudio(s: unknown): Studio | null {
  if (!s || typeof s !== 'object') return null;
  const obj = s as Record<string, unknown>;
  const id = String(obj.developer_id || obj.developerId || obj.id || '').trim();
  if (!id) return null;
  const name = toSafeString(obj.name || obj.nickname) || `开发者 ${id.slice(-4)}`;
  const logo = firstNonBlank(
    obj,
    'logo',
    'developer_logo',
    'developerLogo',
    'avatar',
    'icon',
    'avatar_url',
    'logo_url',
  );
  return { id, name, logo: normalizeUrl(logo) };
}

export function normDeveloperId(v: unknown): string | null {
  if (v == null) return null;
  let s = String(v).trim();
  if (/^\d+$/.test(s)) return s;
  if (s.endsWith('.0')) s = s.slice(0, -2);
  return /^\d+$/.test(s) ? s : null;
}

export function normalizeCookieHeader(raw: string): string {
  return raw
    .split(/[\r\n]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      if (line.toLowerCase().startsWith('cookie:')) return [line.slice(7).trim()];
      return line.split(';').map((p) => p.trim());
    })
    .filter(Boolean)
    .join('; ');
}

export async function taptapFetch(url: string, cookie: string): Promise<{
  ok: boolean;
  status: number;
  json: any;
  error?: string;
}> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': DESKTOP_UA,
        Referer: TAPTAP_REFERER,
        Origin: TAPTAP_ORIGIN,
        Accept: 'application/json, text/plain, */*',
        Cookie: cookie,
      },
      cache: 'no-store',
    });
    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text };
    }
    return { ok: res.ok, status: res.status, json };
  } catch (err) {
    return { ok: false, status: 0, json: null, error: (err as Error).message };
  }
}

export async function probeDeveloper(cookie: string) {
  const me = await taptapFetch(`${TAPTAP_ORIGIN}/api/user/v1/me`, cookie);
  if (me.status === 401 || me.status === 403) return null;

  const meData = me.json?.data || {};
  const user = meData.user && typeof meData.user === 'object' ? meData.user : null;
  const profile = meData.profile && typeof meData.profile === 'object' ? meData.profile : null;

  let developerId =
    normDeveloperId(meData.developer_id) ||
    normDeveloperId(meData.developerId) ||
    normDeveloperId(meData.developer?.id);

  let nickname =
    firstNonBlank(meData, 'nickname', 'name', 'username') ||
    firstNonBlank(user, 'nickname', 'name', 'username') ||
    firstNonBlank(profile, 'nickname', 'name', 'username');

  let avatar = normalizeUrl(
    firstNonBlank(meData, 'avatar', 'avatar_url', 'avatarUrl', 'photo', 'icon', 'headimg', 'head_img') ||
      firstNonBlank(user, 'avatar', 'avatar_url', 'avatarUrl', 'photo', 'icon') ||
      firstNonBlank(profile, 'avatar', 'avatar_url', 'avatarUrl', 'photo', 'icon'),
  );

  let studios: Studio[] = [];
  let developerName = nickname;
  let developerAvatar = avatar;

  const list = await taptapFetch(`${TAPTAP_ORIGIN}/api/developer/v1/list`, cookie);
  if (list.ok && Array.isArray(list.json?.data?.list)) {
    studios = list.json.data.list.map(normalizeStudio).filter(Boolean) as Studio[];
    if (!developerId && studios[0]) developerId = studios[0].id;
    if (developerId) {
      const active = studios.find((s) => s.id === developerId) || studios[0];
      if (active) {
        developerName = active.name || developerName;
        developerAvatar = active.logo || developerAvatar;
      }
    }
  }

  if (!developerId) return null;
  return { developerId, nickname, avatar, developerName, developerAvatar, studios };
}

export function normalizeAssetUrl(value: unknown): string | null {
  const candidates: string[] = [];
  const collect = (v: unknown) => {
    if (!v) return;
    if (typeof v === 'string') {
      candidates.push(v);
      return;
    }
    if (Array.isArray(v)) {
      v.forEach(collect);
      return;
    }
    if (typeof v === 'object') {
      const obj = v as Record<string, unknown>;
      [
        'medium_url',
        'mediumUrl',
        'original_url',
        'originalUrl',
        'large_url',
        'largeUrl',
        'url',
        'small_url',
        'smallUrl',
        'thumb_url',
        'thumbUrl',
        'src',
        'path',
        'download_url',
      ].forEach((k) => {
        if (obj[k] != null) collect(obj[k]);
      });
    }
  };
  collect(value);
  for (const candidate of candidates) {
    try {
      const url = new URL(candidate, 'https://developer.taptap.cn/');
      if (url.protocol === 'https:' || url.protocol === 'http:') return url.href;
    } catch {
      /* skip */
    }
  }
  return null;
}

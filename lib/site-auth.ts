import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export const SITE_AUTH_COOKIE = 'tapanalytics_access';
export const SITE_AUTH_MAX_AGE = 60 * 60 * 24 * 7;

export function siteAuthConfigured(): boolean {
  return Boolean(
    process.env.SITE_AUTH_USERNAME &&
    /^[a-f0-9]{32}:[a-f0-9]{128}$/.test(process.env.SITE_AUTH_PASSWORD_HASH || '') &&
    (process.env.SITE_AUTH_SECRET || '').length >= 32,
  );
}

export function verifySiteCredentials(username: string, password: string): boolean {
  if (!siteAuthConfigured()) return false;
  const [salt, hash] = process.env.SITE_AUTH_PASSWORD_HASH!.split(':');
  const passwordMatches = timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, 'hex'));
  const usernameMatches = timingSafeEqual(
    createHash('sha256').update(username).digest(),
    createHash('sha256').update(process.env.SITE_AUTH_USERNAME!).digest(),
  );
  return passwordMatches && usernameMatches;
}

function signature(payload: string): string {
  return createHmac('sha256', process.env.SITE_AUTH_SECRET!)
    .update(`${process.env.SITE_AUTH_USERNAME}:${process.env.SITE_AUTH_PASSWORD_HASH}:${payload}`)
    .digest('base64url');
}

export function createSiteSession(): string {
  if (!siteAuthConfigured()) throw new Error('Site authentication is not configured');
  const expires = Math.floor(Date.now() / 1000) + SITE_AUTH_MAX_AGE;
  const payload = `${expires}.${randomBytes(24).toString('base64url')}`;
  return `${payload}.${signature(payload)}`;
}

export function verifySiteSession(token: string | undefined): boolean {
  if (!siteAuthConfigured() || !token || token.length > 256) return false;
  const parts = token.split('.');
  if (parts.length !== 3 || !/^\d+$/.test(parts[0])) return false;
  const [expires, nonce, suppliedSignature] = parts;
  if (Number(expires) <= Math.floor(Date.now() / 1000)) return false;
  const expected = Buffer.from(signature(`${expires}.${nonce}`));
  const supplied = Buffer.from(suppliedSignature);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

export const siteCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SITE_AUTH_MAX_AGE,
};

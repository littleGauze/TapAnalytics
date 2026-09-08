import { currentAccount } from './store';
import { TAPTAP_ORIGIN, taptapFetch } from './taptap';

export function requireAccount() {
  const acc = currentAccount();
  if (!acc?.cookies) {
    const err = new Error('UNAUTHENTICATED');
    throw err;
  }
  return acc;
}

export function developerIdOf() {
  const acc = requireAccount();
  return acc.activeDeveloperId || acc.developerId;
}

export async function tapGet(path: string) {
  const acc = requireAccount();
  const url = path.startsWith('http') ? path : `${TAPTAP_ORIGIN}${path}`;
  const res = await taptapFetch(url, acc.cookies || '');
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return res.json;
}

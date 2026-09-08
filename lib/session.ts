import { cookies } from 'next/headers';
import { activeDeveloperId, currentAccount, loadStore, publicAccounts } from './store';
import { probeDeveloper } from './taptap';
import type { Account, AccountPublic, SessionPayload } from './types';

export const AID_COOKIE = 'tapanalytics_aid';

function toPublic(acc: Account): AccountPublic {
  const { cookies: _cookies, ...rest } = acc;
  return rest;
}

export async function setAidCookie(id: string) {
  const jar = await cookies();
  jar.set(AID_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAidCookie() {
  const jar = await cookies();
  jar.delete(AID_COOKIE);
}

export async function buildSession(): Promise<SessionPayload> {
  const store = loadStore();
  const acc = currentAccount(store);
  if (!acc?.cookies) {
    return {
      status: 'unauthenticated',
      developerId: null,
      profile: null,
      studios: [],
      account: null,
      accounts: publicAccounts(store),
    };
  }

  const result = await probeDeveloper(acc.cookies);
  const effDevId = acc.activeDeveloperId || result?.developerId || acc.developerId;

  if (result) {
    let effDevName = result.developerName;
    let effDevAvatar = result.developerAvatar;
    if (acc.activeDeveloperId) {
      const picked = result.studios.find((s) => s.id === acc.activeDeveloperId);
      if (picked) {
        effDevName = picked.name || effDevName;
        effDevAvatar = picked.logo || effDevAvatar;
      }
    }
    return {
      status: 'ready',
      developerId: effDevId,
      profile: {
        nickname: result.nickname,
        avatar: result.avatar,
        developerName: effDevName,
        developerAvatar: effDevAvatar,
      },
      studios: result.studios,
      account: toPublic({
        ...acc,
        developerName: effDevName,
        developerAvatar: effDevAvatar,
      }),
      accounts: publicAccounts(store),
    };
  }

  return {
    status: 'identity-unresolved',
    developerId: activeDeveloperId(store),
    error: 'Cannot resolve developer ID from API',
    profile: {
      nickname: acc.nickname || acc.name,
      avatar: acc.avatar,
      developerName: acc.developerName || acc.name,
      developerAvatar: acc.developerAvatar || acc.avatar,
    },
    studios: acc.studios || [],
    account: toPublic(acc),
    accounts: publicAccounts(store),
  };
}

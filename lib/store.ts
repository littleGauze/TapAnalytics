import fs from 'fs';
import path from 'path';
import { decrypt, encrypt } from './crypto';
import type { Account, AccountPublic, AccountStore, Studio } from './types';

const DATA_DIR = path.join(process.cwd(), '.data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function genAccId() {
  return `acc-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function stripCookies(acc: Account): AccountPublic {
  const { cookies: _c, ...rest } = acc;
  return rest;
}

export function loadStore(): AccountStore {
  try {
    const raw = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8')) as AccountStore;
    if (!raw || !Array.isArray(raw.accounts)) return { current: null, accounts: [] };
    raw.accounts = raw.accounts.map((a) => ({
      ...a,
      cookies: a.cookies ? decrypt(a.cookies) : '',
      studios: Array.isArray(a.studios) ? a.studios : [],
    }));
    return raw;
  } catch {
    return { current: null, accounts: [] };
  }
}

export function saveStore(store: AccountStore) {
  ensureDir();
  const serialized: AccountStore = {
    current: store.current,
    accounts: store.accounts.map((a) => ({
      ...a,
      cookies: a.cookies ? encrypt(a.cookies) : '',
    })),
  };
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(serialized, null, 2), 'utf8');
}

export function currentAccount(store = loadStore()): Account | null {
  if (!store.current) return null;
  return store.accounts.find((a) => a.id === store.current) || null;
}

export function activeDeveloperId(store = loadStore()): string | null {
  const acc = currentAccount(store);
  return acc ? acc.activeDeveloperId || acc.developerId : null;
}

export function publicAccounts(store = loadStore()): AccountPublic[] {
  return store.accounts.map(stripCookies);
}

export function upsertAccount(
  store: AccountStore,
  data: {
    developerId: string;
    nickname?: string;
    avatar?: string;
    developerName?: string;
    developerAvatar?: string;
    studios?: Studio[];
    cookies: string;
  },
  mode: 'login' | 'add' = 'login',
): Account {
  let acc = store.accounts.find((a) => a.developerId === data.developerId);
  if (!acc) {
    acc = {
      id: genAccId(),
      name: data.nickname || data.developerName || `开发者 ${data.developerId.slice(-4)}`,
      developerId: data.developerId,
      developerName: data.developerName || '',
      developerAvatar: data.developerAvatar || '',
      nickname: data.nickname || '',
      avatar: data.avatar || '',
      studios: data.studios || [],
      cookies: data.cookies,
    };
    store.accounts.push(acc);
  } else {
    if (data.nickname) acc.nickname = data.nickname;
    if (data.avatar) acc.avatar = data.avatar;
    if (data.studios) acc.studios = data.studios;
    acc.cookies = data.cookies;
  }

  if (mode === 'login' || !store.current) {
    store.current = acc.id;
    if (!acc.activeDeveloperId) acc.activeDeveloperId = null;
  }

  const pickedId = acc.activeDeveloperId;
  if (pickedId && acc.studios) {
    const picked = acc.studios.find((s) => s.id === pickedId);
    if (picked) {
      acc.developerName = picked.name || acc.developerName;
      acc.developerAvatar = picked.logo || acc.developerAvatar;
    } else if (data.developerName) {
      acc.developerName = data.developerName;
    }
  } else {
    if (data.developerName) acc.developerName = data.developerName;
    if (data.developerAvatar) acc.developerAvatar = data.developerAvatar;
  }

  saveStore(store);
  return acc;
}

export function switchAccount(id: string): Account | null {
  const store = loadStore();
  const acc = store.accounts.find((a) => a.id === id);
  if (!acc) return null;
  store.current = acc.id;
  saveStore(store);
  return acc;
}

export function switchStudio(developerId: string): boolean {
  const store = loadStore();
  const acc = currentAccount(store);
  if (!acc) return false;
  const sid = String(developerId);
  acc.activeDeveloperId = sid;
  const picked = acc.studios.find((s) => s.id === sid);
  if (picked) {
    acc.developerName = picked.name;
    acc.developerAvatar = picked.logo;
  }
  saveStore(store);
  return true;
}

export function removeAccount(id: string): boolean {
  const store = loadStore();
  const idx = store.accounts.findIndex((a) => a.id === id);
  if (idx < 0) return false;
  store.accounts.splice(idx, 1);
  if (store.current === id) {
    store.current = store.accounts[0]?.id ?? null;
  }
  saveStore(store);
  return true;
}

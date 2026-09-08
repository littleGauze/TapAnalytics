export type LoginStatus =
  | 'unauthenticated'
  | 'ready'
  | 'identity-unresolved'
  | 'no-developer'
  | 'error';

export interface Studio {
  id: string;
  name: string;
  logo: string;
}

export interface Profile {
  nickname: string;
  avatar: string;
  developerName: string;
  developerAvatar: string;
}

export interface Account {
  id: string;
  name: string;
  developerId: string;
  developerName: string;
  developerAvatar: string;
  nickname: string;
  avatar: string;
  activeDeveloperId?: string | null;
  studios: Studio[];
  cookies?: string;
}

export interface AccountStore {
  current: string | null;
  accounts: Account[];
}

export interface SessionPayload {
  status: LoginStatus;
  developerId: string | null;
  error?: string | null;
  profile: Profile | null;
  studios: Studio[];
  account: AccountPublic | null;
  accounts: AccountPublic[];
}

export type AccountPublic = Omit<Account, 'cookies'>;

export interface Game {
  appId: string;
  name: string;
  icon: string | null;
  published: boolean;
  createdAt: number;
}

export interface GameMetrics {
  appId: string;
  todayRevenue: number | null;
  prevDayRevenue: number | null;
  monthRevenue: number | null;
  lastMonthRevenue: number | null;
  totalRevenue: number | null;
  todayDAU: number | null;
  todayNewUsers: number | null;
  prevDayDAU: number | null;
  todayImpression: number | null;
  monthRevenueList: RevenuePoint[];
}

export interface RevenuePoint {
  date: string;
  revenue: number;
}

export interface DailyRecord {
  date: string;
  revenue: number | null;
  dau: number;
  newUsers: number;
  impression?: number;
  click?: number;
  clickRate?: number | string | null;
  convDetail?: number;
  convDetailRate?: number | string | null;
  convTotal?: number;
  durationAvg?: number | string | null;
  retA1d?: number | string | null;
  retA3d?: number | string | null;
  retA7d?: number | string | null;
  startRate?: number | string | null;
}

export interface OverallMetrics {
  retA1d?: number | string | null;
  retA3d?: number | string | null;
  retA7d?: number | string | null;
  startRate?: number | string | null;
  durationAvg?: number | string | null;
}

export interface GameOverview {
  yesterdayRevenue: number | null;
  yesterdayDAU: number;
  yesterdayImp: number;
  yesterdayClick: number;
  yesterdayClickRate: number | string | null;
  monthRevenue: number | null;
  monthRevenueList: RevenuePoint[];
  prevDayRevenue: number | null;
  prevDayDAU: number | null;
  prevDayImp: number | null;
  lastMonthRevenue: number | null;
}

export type Accent = 'cyan' | 'pink' | 'purple' | 'mint';
export type ThemeMode = 'light' | 'dark';

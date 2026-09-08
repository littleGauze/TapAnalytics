export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayStr(): string {
  return formatDate(new Date());
}

export function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDate(d);
}

export function dayBeforeStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 2);
  return formatDate(d);
}

export function monthStartStr(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

export function currentMonthStr(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function lastMonthSameDayRange(): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const day = now.getDate();
  const lastMonthEnd = new Date(y, m, 0);
  const lastMonthDay = Math.min(day, lastMonthEnd.getDate());
  return {
    start: formatDate(new Date(y, m - 1, 1)),
    end: formatDate(new Date(y, m - 1, lastMonthDay)),
  };
}

export function getMonthRange(yearMonth: string): { start: string; end: string } {
  const [y, m] = yearMonth.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  let end = new Date(y, m, 0);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  if (end > yesterday) end = yesterday;
  return { start: formatDate(start), end: formatDate(end) };
}

export function monthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number);
  return `${y}年${m}月`;
}

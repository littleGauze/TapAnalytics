export function fmt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '0.00';
  return Number(n).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fmtMoney(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '¥—';
  return `¥${fmt(n)}`;
}

export function fmtInt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '0';
  return Number(n).toLocaleString('zh-CN');
}

export function momPct(cur: number | null | undefined, prev: number | null | undefined): number | null {
  if (prev == null || prev === 0 || Number.isNaN(prev)) return null;
  if (cur == null || Number.isNaN(cur)) return null;
  return ((cur - prev) / prev) * 100;
}

export function rateText(v: number | string | null | undefined, digits = 2): string {
  if (v == null || v === '' || v === '-') return '—';
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  if (!Number.isFinite(n)) return String(v);
  if (n > 0 && n <= 1) return `${(n * 100).toFixed(digits)}%`;
  if (String(v).includes('%')) return String(v);
  return `${n.toFixed(digits)}%`;
}

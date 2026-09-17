import { MONTH_ORDER } from '../constants/logo';

export function cleanText(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v).trim().replace(/\s+/g, ' ').toUpperCase();
}

export function cleanJob(v: unknown): string {
  if (v === null || v === undefined) return '';
  let s = String(v).trim().replace(/\s+/g, ' ').toUpperCase();
  // Strip trailing .0 from numeric excel cells (e.g. 83263.0 -> 83263)
  s = s.replace(/\.0+$/, '');
  // Strip leading '#' if present (e.g. #83263 -> 83263)
  s = s.replace(/^#+\s*/, '');
  return s;
}

export function stripAlphanumeric(v: unknown): string {
  return cleanJob(v).replace(/[^A-Z0-9]/g, '');
}

export function extractDigits(v: unknown): string {
  return String(v ?? '').replace(/[^\d]/g, '');
}

/**
 * Intelligent Job Card matcher:
 * Handles exact matches, alphanumeric equivalence (e.g. JC-83263 == 83263),
 * numeric suffix equivalence (e.g. 83263 vs 083263), and query containment.
 */
export function matchesJobCard(rowJob: unknown, query: unknown): boolean {
  const rClean = cleanJob(rowJob);
  const qClean = cleanJob(query);
  if (!rClean || !qClean) return false;

  // 1. Direct clean match (e.g. "83263" === "83263")
  if (rClean === qClean) return true;

  // 2. Alphanumeric match (ignoring dashes, slashes, spaces)
  const rAlpha = stripAlphanumeric(rClean);
  const qAlpha = stripAlphanumeric(qClean);
  if (rAlpha === qAlpha) return true;

  // 3. Numeric digits match if search has at least 3 digits
  const rDigits = extractDigits(rClean);
  const qDigits = extractDigits(qClean);
  if (qDigits.length >= 3) {
    if (rDigits === qDigits) return true;
    if (rDigits.endsWith(qDigits) || qDigits.endsWith(rDigits)) return true;
    if (rDigits.includes(qDigits)) return true;
  }

  // 4. Substring containment on normalized alphanumeric strings
  if (rAlpha.length >= 3 && qAlpha.length >= 3) {
    if (rAlpha.includes(qAlpha) || qAlpha.includes(rAlpha)) return true;
  }

  return false;
}

export function normalizeMonth(v: unknown): string {
  const s = cleanText(v);
  const k = s.slice(0, 3);
  return MONTH_ORDER[k] ? k : s;
}

export function num(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const s = String(v ?? '').replace(/,/g, '').replace(/[^\d.-]/g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function formatCurrency(v: unknown): string {
  return 'QAR ' + new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num(v));
}

export function shortNum(v: unknown): string {
  const val = num(v);
  if (Math.abs(val) >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(val) >= 1_000) return (val / 1_000).toFixed(0) + 'K';
  return Math.round(val).toString();
}

export function truncate(s: unknown, n: number): string {
  const str = String(s ?? '');
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

export function dateDisplay(v: unknown): string {
  if (v === null || v === undefined || String(v).trim() === '') return '';
  if (v instanceof Date && !isNaN(v.getTime())) {
    return `${String(v.getDate()).padStart(2, '0')}-${String(v.getMonth() + 1).padStart(2, '0')}-${v.getFullYear()}`;
  }
  const d = new Date(v as string | number);
  if (!isNaN(d.getTime()) && d.getFullYear() > 1970) {
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  }
  return String(v).trim();
}

export function monthOnly(v: unknown): string {
  if (v === null || v === undefined || String(v).trim() === '') return '';
  const d = new Date(v as string | number);
  if (!isNaN(d.getTime()) && d.getFullYear() > 1970) {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return months[d.getMonth()];
  }
  return normalizeMonth(v);
}

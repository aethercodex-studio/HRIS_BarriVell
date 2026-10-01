/** Display formatters (Spanish locale). */
import { parseYmd } from './dates';

const eurFormatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

/** 12.5 → '12,50 €' */
export const formatEuro = (n) => eurFormatter.format(n || 0);

/** 7.5 → '7,5' (max 2 decimals, comma) */
export const formatHours = (h) => String(Math.round((h || 0) * 100) / 100).replace('.', ',');

/** 'YYYY-MM-DD' → '01/10/2026', or '—' */
export const formatDate = (ymd) =>
  ymd ? parseYmd(ymd).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

/** Parses user-typed decimals ('12,50'). Empty → null, invalid → NaN. */
export const parseDecimal = (v) => {
  if (v === '' || v == null) return null;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isNaN(n) ? NaN : n;
};

/** Accent-insensitive lowercase, for search. */
export const normalizeText = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const fullName = (e) => `${e.nombre} ${e.apellidos}`.trim();

export const initials = (e) => (((e.nombre || '')[0] || '') + ((e.apellidos || '')[0] || '')).toUpperCase() || '?';

/**
 * Date helpers. All dates in the app are local calendar dates stored as
 * 'YYYY-MM-DD' strings — no time zones involved.
 */

export const DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const DAYS_LONG = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
export const DAYS_LETTER = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
export const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const pad2 = (n) => String(n).padStart(2, '0');

/** Date → 'YYYY-MM-DD' */
export const toYmd = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/** 'YYYY-MM-DD' → Date (local midnight) */
export const parseYmd = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const todayYmd = () => toYmd(new Date());

export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Monday = 0 … Sunday = 6 */
export const weekdayIndex = (d) => (d.getDay() + 6) % 7;

export const mondayOf = (d) => addDays(d, -weekdayIndex(d));

export const firstOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
export const lastOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

/** The 7 'YYYY-MM-DD' strings of the week starting at `weekStart` (Date). */
export const weekDates = (weekStart) => Array.from({ length: 7 }, (_, i) => toYmd(addDays(weekStart, i)));

/** ISO-8601 week number. */
export const isoWeek = (d) => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t - yearStart) / 864e5 + 1) / 7);
};

export const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** 'lunes 29 de septiembre' */
export const longDayLabel = (ymd) => {
  const d = parseYmd(ymd);
  return `${DAYS_LONG[weekdayIndex(d)]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
};

/** 'Semana 40 · 28 sep – 4 oct 2026' */
export const weekRangeLabel = (weekStart) => {
  const end = addDays(weekStart, 6);
  return `Semana ${isoWeek(weekStart)} · ${weekStart.getDate()} ${MONTHS_SHORT[weekStart.getMonth()]} – ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]} ${end.getFullYear()}`;
};

export const monthLabel = (d) => capitalize(`${MONTHS[d.getMonth()]} ${d.getFullYear()}`);

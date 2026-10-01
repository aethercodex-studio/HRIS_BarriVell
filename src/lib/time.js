/**
 * Time-of-day helpers for shifts. Times are 'HH:MM' strings in 24 h format.
 * A shift whose end is <= start ends the next day and counts for the start day.
 */
import { NIGHT_START_MIN, NIGHT_END_MIN } from '@/config/constants';
import { pad2 } from './dates';

export const MINUTES_PER_DAY = 1440;

/** 'HH:MM' → minutes since 00:00 */
export const toMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/** minutes → 'HH:MM' (wraps around midnight) */
export const toHHMM = (min) => {
  const m = ((min % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
};

/** Every quarter hour of the day, used by time pickers. */
export const QUARTER_HOURS = Array.from({ length: 96 }, (_, i) => toHHMM(i * 15));

/**
 * Splits a shift into total / day / night hours.
 * Night window: NIGHT_START_MIN → NIGHT_END_MIN next day (22:00–06:00).
 * @returns {{ total:number, day:number, night:number }} hours
 */
export function shiftHours(start, end) {
  const a = toMinutes(start);
  let b = toMinutes(end);
  if (b <= a) b += MINUTES_PER_DAY;
  const overlap = (x, y) => Math.max(0, Math.min(b, y) - Math.max(a, x));
  const nightMin =
    overlap(0, NIGHT_END_MIN) + // early morning of the start day
    overlap(NIGHT_START_MIN, MINUTES_PER_DAY + NIGHT_END_MIN); // tonight → tomorrow 06:00
  const totalMin = b - a;
  return { total: totalMin / 60, night: nightMin / 60, day: (totalMin - nightMin) / 60 };
}

/** True when the shift ends after midnight. */
export const crossesMidnight = (start, end) => toMinutes(end) <= toMinutes(start);

/**
 * Hours & money calculations. Pure functions over the app data — no React here,
 * so they are easy to unit-test and reuse (e.g. in a Supabase Edge Function).
 */
import { shiftHours } from '@/lib/time';

/**
 * Gross cost of a set of hours. If the night rate is not set, night hours are
 * paid at the normal rate (business rule agreed with the client).
 */
export function grossCost(employee, dayHours, nightHours) {
  const rate = employee.rate || 0;
  const nightRate = employee.nightRate != null ? employee.nightRate : rate;
  return dayHours * rate + nightHours * nightRate;
}

/** True when the worker has night hours but no night rate configured. */
export const missingNightRate = (employee, nightHours) => nightHours > 0 && employee.nightRate == null;

/**
 * Aggregates day/night hours per employee for shifts in [from, to] (inclusive).
 * @param {object[]} shifts
 * @param {string} from 'YYYY-MM-DD'
 * @param {string} to   'YYYY-MM-DD'
 * @param {(s)=>boolean} [filter] optional extra filter (e.g. by local)
 * @returns {Record<string,{day:number,night:number,total:number,days:Set<string>}>}
 */
export function hoursByEmployee(shifts, from, to, filter) {
  const out = {};
  for (const s of shifts) {
    if (s.date < from || s.date > to) continue;
    if (filter && !filter(s)) continue;
    const h = shiftHours(s.start, s.end);
    const o = (out[s.empId] ||= { day: 0, night: 0, total: 0, days: new Set() });
    o.day += h.day;
    o.night += h.night;
    o.total += h.total;
    o.days.add(s.date);
  }
  return out;
}

/**
 * Splits worked hours/cost into "nómina" (up to contract) and "fuera de nómina".
 * @param {number|null} contractHours contract hours for the period (null = no contract → all outside)
 */
export function splitByContract(totalHours, cost, contractHours) {
  const inside = contractHours != null ? Math.min(totalHours, contractHours) : 0;
  const outside = totalHours - inside;
  const costInside = totalHours ? (cost * inside) / totalHours : 0;
  return { inside, outside, costInside, costOutside: cost - costInside };
}

/** Weekly contract hours scaled to a period of `days` days (rounded to 0.5 h). */
export const contractForPeriod = (weeklyHours, days) =>
  weeklyHours == null ? null : days === 7 ? weeklyHours : Math.round(((weeklyHours * days) / 7) * 2) / 2;

/**
 * Payroll report: one row per worker, grouped by company.
 * Used by the "Horas y nóminas" page and its CSV export.
 */
import { grossCost, hoursByEmployee, splitByContract, contractForPeriod, missingNightRate } from './hours';

/**
 * @param {object} data       full app data
 * @param {{from:string,to:string,days:number,companyId:string|'all'}} period
 */
export function buildPayroll(data, { from, to, days, companyId }) {
  const agg = hoursByEmployee(data.shifts, from, to);
  const groupOrder = Object.fromEntries(data.groups.map((g, i) => [g.id, i]));
  const byGroupThenName = (a, b) =>
    (groupOrder[a.groupId] ?? 99) - (groupOrder[b.groupId] ?? 99) || a.nombre.localeCompare(b.nombre, 'es');

  const employees = data.employees
    .filter((e) => (e.active || agg[e.id]) && (companyId === 'all' || e.companyId === companyId))
    .sort(byGroupThenName);

  const companies = [...data.companies, { id: null, name: 'Sin empresa' }].filter(
    (c) => companyId === 'all' || c.id === companyId,
  );

  const totals = emptyTotals();
  const groups = companies
    .map((company) => {
      const members = employees.filter((e) => (e.companyId || null) === company.id);
      if (!members.length) return null;
      const subtotal = emptyTotals();
      const rows = members.map((e) => {
        const a = agg[e.id] || { day: 0, night: 0, total: 0, days: new Set() };
        const cost = grossCost(e, a.day, a.night);
        const contract = contractForPeriod(e.contractHours, days);
        const split = splitByContract(a.total, cost, contract);
        const row = {
          employee: e,
          dayHours: a.day,
          nightHours: a.night,
          totalHours: a.total,
          daysWorked: a.days.size,
          contract,
          cost,
          ...split,
          missingNightRate: missingNightRate(e, a.night),
        };
        accumulate(subtotal, row);
        return row;
      });
      accumulate(totals, subtotal);
      return { company, rows, subtotal };
    })
    .filter(Boolean);

  return { groups, totals };
}

function emptyTotals() {
  return { totalHours: 0, nightHours: 0, cost: 0, costInside: 0, costOutside: 0, inside: 0, outside: 0 };
}

function accumulate(target, src) {
  for (const k of Object.keys(target)) target[k] += src[k] || 0;
}

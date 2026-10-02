/**
 * Payroll report: one row per worker, grouped by company.
 * Used by the "Horas y nóminas" page and its CSV export.
 *
 * - Importe total     = day hours × €/h + night hours × €/h nocturna
 * - Importe nómina    = typed by the user for each worker and period (data.nominas)
 * - Fuera de nómina   = Importe total − Importe nómina  (only when the nómina is filled in)
 */
import { grossCost, hoursByEmployee, contractForPeriod, missingNightRate } from './hours';

export const nominaId = (empId, from, to) => `${empId}|${from}|${to}`;

/** Sortable columns of the payroll table → value getter. */
export const PAYROLL_SORTS = {
  name: (r) => `${r.employee.nombre} ${r.employee.apellidos}`,
  day: (r) => r.dayHours,
  night: (r) => r.nightHours,
  total: (r) => r.totalHours,
  rate: (r) => r.employee.rate ?? -1,
  nomina: (r) => r.nomina ?? -1,
  fuera: (r) => r.fuera ?? -1e9,
  cost: (r) => r.cost,
};

/**
 * @param {object} data full app data
 * @param {{from:string,to:string,days:number,companyId:string|'all',localId:string|'all',sort:{key:string,dir:1|-1}}} opts
 */
export function buildPayroll(data, { from, to, days, companyId = 'all', localId = 'all', sort = { key: 'name', dir: 1 } }) {
  const agg = hoursByEmployee(data.shifts, from, to);
  const nominas = Object.fromEntries((data.nominas || []).map((n) => [n.id, n.amount]));
  const getter = PAYROLL_SORTS[sort.key] || PAYROLL_SORTS.name;
  const compare = (a, b) => {
    const x = getter(a);
    const y = getter(b);
    const r = typeof x === 'string' ? x.localeCompare(y, 'es', { sensitivity: 'base' }) : x - y;
    return (r || PAYROLL_SORTS.name(a).localeCompare(PAYROLL_SORTS.name(b), 'es')) * sort.dir;
  };

  const employees = data.employees.filter(
    (e) =>
      (e.active || agg[e.id]) &&
      (companyId === 'all' || e.companyId === companyId) &&
      (localId === 'all' || e.locals.includes(localId)),
  );

  const companies = [...data.companies, { id: null, name: 'Sin empresa' }].filter((c) => companyId === 'all' || c.id === companyId);

  const totals = emptyTotals();
  const groups = companies
    .map((company) => {
      const members = employees.filter((e) => (e.companyId || null) === company.id);
      if (!members.length) return null;
      const subtotal = emptyTotals();
      const rows = members
        .map((e) => {
          const a = agg[e.id] || { day: 0, night: 0, total: 0, days: new Set() };
          const cost = grossCost(e, a.day, a.night);
          const contract = contractForPeriod(e.contractHours, days);
          const nomina = nominas[nominaId(e.id, from, to)] ?? null;
          const row = {
            employee: e,
            dayHours: a.day,
            nightHours: a.night,
            totalHours: a.total,
            daysWorked: a.days.size,
            contract,
            overContract: contract != null ? Math.max(0, a.total - contract) : 0,
            cost,
            nomina,
            fuera: nomina != null ? cost - nomina : null,
            missingNightRate: missingNightRate(e, a.night),
          };
          accumulate(subtotal, row);
          return row;
        })
        .sort(compare);
      accumulate(totals, subtotal);
      return { company, rows, subtotal };
    })
    .filter(Boolean);

  return { groups, totals };
}

function emptyTotals() {
  return { totalHours: 0, nightHours: 0, cost: 0, nomina: 0, fuera: 0, filled: 0, count: 0 };
}

function accumulate(t, src) {
  if (src.employee) {
    t.totalHours += src.totalHours;
    t.nightHours += src.nightHours;
    t.cost += src.cost;
    t.count += 1;
    if (src.nomina != null) {
      t.nomina += src.nomina;
      t.fuera += src.fuera;
      t.filled += 1;
    }
  } else {
    for (const k of Object.keys(t)) t[k] += src[k] || 0;
  }
}

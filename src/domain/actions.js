/**
 * Domain actions: every change to the data goes through one of these.
 *
 * Each action receives a *draft* (a deep copy of the data, see AppProvider.update)
 * and mutates it. Keeping them pure and in one place makes the business rules
 * easy to find, test and later move to the server.
 */
import { uid } from '@/lib/utils';
import { addDays, parseYmd, toYmd, todayYmd } from '@/lib/dates';

/* ───────────── Employees ───────────── */

/** Creates a worker. Hire date (fecha de alta) is set automatically to today. */
export function createEmployee(draft, fields) {
  const employee = {
    ...fields,
    id: uid('e'),
    active: true,
    fechaAlta: todayYmd(),
    fechaBaja: null,
    altaSolicitada: null,
  };
  draft.employees.push(employee);
  return employee.id;
}

export function updateEmployee(draft, id, fields) {
  const e = draft.employees.find((x) => x.id === id);
  if (e) Object.assign(e, fields);
}

/** Deactivates a worker: sets fecha de baja = today and removes future shifts. */
export function deactivateEmployee(draft, id) {
  const today = todayYmd();
  const e = draft.employees.find((x) => x.id === id);
  if (!e) return;
  e.active = false;
  e.fechaBaja = today;
  draft.shifts = draft.shifts.filter((s) => !(s.empId === id && s.date > today));
  draft.daysOff = draft.daysOff.filter((o) => !(o.empId === id && o.date > today));
}

/** Reactivates a worker: new hire date = today, leave date cleared. */
export function reactivateEmployee(draft, id) {
  const e = draft.employees.find((x) => x.id === id);
  if (!e) return;
  e.active = true;
  e.fechaBaja = null;
  e.fechaAlta = todayYmd();
  e.altaSolicitada = null;
}

export function deleteEmployee(draft, id) {
  draft.employees = draft.employees.filter((e) => e.id !== id);
  draft.shifts = draft.shifts.filter((s) => s.empId !== id);
  draft.daysOff = draft.daysOff.filter((o) => o.empId !== id);
}

export function markAltaRequested(draft, id) {
  updateEmployee(draft, id, { altaSolicitada: todayYmd() });
}

/* ───────────── Shifts & days off ───────────── */

const removeDayOff = (draft, empId, date) => {
  draft.daysOff = draft.daysOff.filter((o) => !(o.empId === empId && o.date === date));
};

/** Creates or updates a shift. Working on a day off removes the day off. */
export function saveShift(draft, { id, empId, localId, date, start, end }) {
  if (id) {
    const s = draft.shifts.find((x) => x.id === id);
    if (s) Object.assign(s, { empId, date, start, end });
  } else {
    draft.shifts.push({ id: uid('s'), empId, localId, date, start, end });
  }
  removeDayOff(draft, empId, date);
}

export function deleteShift(draft, id) {
  draft.shifts = draft.shifts.filter((s) => s.id !== id);
}

/** Marks a day off. Any shifts that day (all locals) are removed. */
export function setDayOff(draft, empId, date) {
  draft.shifts = draft.shifts.filter((s) => !(s.empId === empId && s.date === date));
  if (!draft.daysOff.some((o) => o.empId === empId && o.date === date)) {
    draft.daysOff.push({ id: uid('o'), empId, date });
  }
}

export function clearDayOff(draft, empId, date) {
  removeDayOff(draft, empId, date);
}

/**
 * Moves a day off to another date. Shifts on the target date are swapped to the
 * old day off, so the worker keeps the same number of working days.
 * @returns {number} how many shifts were swapped
 */
export function moveDayOff(draft, empId, from, to) {
  let moved = 0;
  for (const s of draft.shifts) {
    if (s.empId === empId && s.date === to) {
      s.date = from;
      moved++;
    }
  }
  draft.daysOff = draft.daysOff.filter((o) => !(o.empId === empId && (o.date === from || o.date === to)));
  draft.daysOff.push({ id: uid('o'), empId, date: to });
  return moved;
}

/** Copies last week's shifts (this local) and days off into the given week. */
export function copyPreviousWeek(draft, localId, weekStartYmd) {
  const ws = parseYmd(weekStartYmd);
  const current = Array.from({ length: 7 }, (_, i) => toYmd(addDays(ws, i)));
  const previous = Array.from({ length: 7 }, (_, i) => toYmd(addDays(ws, i - 7)));
  const workers = new Set(draft.employees.filter((e) => e.active && e.locals.includes(localId)).map((e) => e.id));
  const shiftDate = (d) => current[previous.indexOf(d)];

  draft.shifts = draft.shifts.filter((s) => !(s.localId === localId && workers.has(s.empId) && current.includes(s.date)));
  draft.daysOff = draft.daysOff.filter((o) => !(workers.has(o.empId) && current.includes(o.date)));

  draft.shifts
    .filter((s) => s.localId === localId && workers.has(s.empId) && previous.includes(s.date))
    .forEach((s) => draft.shifts.push({ ...s, id: uid('s'), date: shiftDate(s.date) }));
  draft.daysOff
    .filter((o) => workers.has(o.empId) && previous.includes(o.date))
    .forEach((o) => draft.daysOff.push({ ...o, id: uid('o'), date: shiftDate(o.date) }));
}

/* ───────────── Companies & locals ───────────── */

export function addCompany(draft, name) {
  draft.companies.push({ id: uid('c'), name });
}

export function renameCompany(draft, id, name) {
  const c = draft.companies.find((x) => x.id === id);
  if (c) c.name = name;
}

/** Deletes a company with its locals and shifts. Workers keep existing without company. */
export function deleteCompany(draft, id) {
  const localIds = draft.locals.filter((l) => l.companyId === id).map((l) => l.id);
  draft.companies = draft.companies.filter((c) => c.id !== id);
  localIds.forEach((lid) => deleteLocal(draft, lid));
  draft.employees.forEach((e) => {
    if (e.companyId === id) e.companyId = null;
  });
}

/** Adding a local is all it takes: its calendar is derived from the data. */
export function addLocal(draft, companyId, name) {
  const id = uid('l');
  draft.locals.push({ id, companyId, name });
  return id;
}

export function renameLocal(draft, id, name) {
  const l = draft.locals.find((x) => x.id === id);
  if (l) l.name = name;
}

export function deleteLocal(draft, id) {
  draft.locals = draft.locals.filter((l) => l.id !== id);
  draft.shifts = draft.shifts.filter((s) => s.localId !== id);
  draft.employees.forEach((e) => {
    e.locals = e.locals.filter((x) => x !== id);
  });
}

/* ───────────── Groups ───────────── */

export function addGroup(draft, name, color) {
  draft.groups.push({ id: uid('g'), name, color });
}

export function updateGroup(draft, id, fields) {
  const g = draft.groups.find((x) => x.id === id);
  if (g) Object.assign(g, fields);
}

export function deleteGroup(draft, id) {
  draft.groups = draft.groups.filter((g) => g.id !== id);
  draft.employees.forEach((e) => {
    if (e.groupId === id) e.groupId = null;
  });
}

/* ───────────── Settings ───────────── */

export function updateSettings(draft, fields) {
  Object.assign(draft.settings, fields);
}

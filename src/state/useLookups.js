/**
 * Derived lookups shared by many screens (maps by id, group order, sorters).
 * Memoised so they are rebuilt only when the data changes.
 */
import { useMemo } from 'react';
import { useApp } from './AppProvider';
import { groupPalette } from '@/lib/colors';

export function useLookups() {
  const { data } = useApp();
  return useMemo(() => {
    const companies = Object.fromEntries(data.companies.map((c) => [c.id, c]));
    const locals = Object.fromEntries(data.locals.map((l) => [l.id, l]));
    const groups = Object.fromEntries(data.groups.map((g) => [g.id, g]));
    const employees = Object.fromEntries(data.employees.map((e) => [e.id, e]));
    const groupOrder = Object.fromEntries(data.groups.map((g, i) => [g.id, i]));

    const paletteOf = (e) => groupPalette(groups[e?.groupId]?.color);
    const groupName = (e) => groups[e?.groupId]?.name || 'Sin grupo';
    const localNames = (e) => e.locals.map((id) => locals[id]?.name).filter(Boolean).join(', ');
    const byGroupThenName = (a, b) =>
      (groupOrder[a.groupId] ?? 99) - (groupOrder[b.groupId] ?? 99) || a.nombre.localeCompare(b.nombre, 'es');

    return { companies, locals, groups, employees, paletteOf, groupName, localNames, byGroupThenName };
  }, [data]);
}

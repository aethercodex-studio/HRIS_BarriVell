/**
 * Navigation + global panels (employee card) shared across pages.
 * Any page can call `openEmployee(id)` to show the worker card on top.
 */
import { createContext, useContext, useMemo, useState } from 'react';
import { useUiPreference } from '@/hooks';

const NavContext = createContext(null);

export const PAGES = [
  { id: 'inicio', label: 'Inicio', icon: 'home' },
  { id: 'empleados', label: 'Empleados', icon: 'users' },
  { id: 'calendario', label: 'Calendario', icon: 'calendar' },
  { id: 'horas', label: 'Horas y nóminas', short: 'Horas', icon: 'euro' },
  { id: 'config', label: 'Configuración', icon: 'settings' },
];

export function NavProvider({ children }) {
  const [page, setPage] = useUiPreference('page', 'inicio');
  const [localId, setLocalId] = useUiPreference('localId', null);
  /** Employee panel: null | { id, mode: 'view'|'edit' } | { id: null, mode: 'new' } */
  const [employeePanel, setEmployeePanel] = useState(null);

  const value = useMemo(
    () => ({
      page,
      go: (p) => {
        setPage(p);
        window.scrollTo(0, 0);
      },
      localId,
      setLocalId,
      employeePanel,
      openEmployee: (id) => setEmployeePanel({ id, mode: 'view' }),
      newEmployee: () => setEmployeePanel({ id: null, mode: 'new' }),
      editEmployee: (id) => setEmployeePanel({ id, mode: 'edit' }),
      closeEmployee: () => setEmployeePanel(null),
    }),
    [page, setPage, localId, setLocalId, employeePanel],
  );

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used inside <NavProvider>');
  return ctx;
}

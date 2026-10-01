/**
 * Root component: shows the login until there is a session, then the app shell
 * with the active page. Pages are plain components — add a new one by creating
 * a folder in /features and registering it in PAGES (state/NavContext.jsx).
 */
import { useApp } from '@/state/AppProvider';
import { NavProvider, useNav } from '@/state/NavContext';
import { AppShell } from '@/components/layout/AppShell';
import { ConfirmDialog, Toast } from '@/components/ui/Overlays';
import { LoginPage } from '@/features/auth/LoginPage';
import { HomePage } from '@/features/home/HomePage';
import { EmployeesPage } from '@/features/employees/EmployeesPage';
import { EmployeeDrawer } from '@/features/employees/EmployeeDrawer';
import { CalendarPage } from '@/features/calendar/CalendarPage';
import { PayrollPage } from '@/features/payroll/PayrollPage';
import { SettingsPage } from '@/features/settings/SettingsPage';

const PAGE_COMPONENTS = {
  inicio: HomePage,
  empleados: EmployeesPage,
  calendario: CalendarPage,
  horas: PayrollPage,
  config: SettingsPage,
};

function AuthenticatedApp() {
  const { page, employeePanel } = useNav();
  const Page = PAGE_COMPONENTS[page] || HomePage;
  return (
    <AppShell>
      <Page />
      {employeePanel && <EmployeeDrawer />}
    </AppShell>
  );
}

export default function App() {
  const { status, authed, data } = useApp();
  if (status === 'loading') return null;
  return (
    <>
      {authed && data ? (
        <NavProvider>
          <AuthenticatedApp />
        </NavProvider>
      ) : (
        <LoginPage />
      )}
      <ConfirmDialog />
      <Toast />
    </>
  );
}

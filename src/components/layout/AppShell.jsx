/**
 * App frame: left sidebar on desktop, top bar + bottom tab bar on mobile.
 * The switch is pure CSS (see layout.module.css), no JS needed.
 */
import { LOGO_URL } from '@/lib/assets';
import { useApp } from '@/state/AppProvider';
import { PAGES, useNav } from '@/state/NavContext';
import { Icon } from '@/components/ui/Icon';
import s from './layout.module.css';

export function AppShell({ children }) {
  const { signOut, isRemote } = useApp();
  const { page, go } = useNav();

  return (
    <div className={s.shell}>
      {/* Desktop sidebar */}
      <aside className={s.sidebar}>
        <Brand />
        <nav className={s.nav}>
          {PAGES.map((p) => (
            <button key={p.id} className={`${s.navItem} ${page === p.id ? s.navOn : ''}`} onClick={() => go(p.id)}>
              <Icon name={p.icon} size={19} />
              {p.label}
            </button>
          ))}
        </nav>
        <div className={s.sideFoot}>
          <span className={s.mode}>{isRemote ? 'Conectado a Supabase' : 'Modo demo · datos en este navegador'}</span>
          <button className={s.logout} onClick={signOut}>
            <Icon name="logout" size={17} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className={s.content}>
        {/* Mobile top bar */}
        <header className={s.topbar}>
          <img src={LOGO_URL} alt="" width={34} height={34} />
          <span className={s.topTitle}>HRIS Barri Vell</span>
          <button className={s.topLogout} onClick={signOut} aria-label="Cerrar sesión">
            <Icon name="logout" size={20} />
          </button>
        </header>
        <main className={s.main}>{children}</main>
      </div>

      {/* Mobile bottom tabs */}
      <nav className={s.tabbar}>
        {PAGES.map((p) => (
          <button key={p.id} className={`${s.tab} ${page === p.id ? s.tabOn : ''}`} onClick={() => go(p.id)}>
            <span className={s.tabIcon}>
              <Icon name={p.icon} size={20} />
            </span>
            {p.short || p.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function Brand() {
  return (
    <div className={s.brand}>
      <img src={LOGO_URL} alt="Barri Vell" width={42} height={42} />
      <div className={s.brandText}>
        <span className={s.brandEyebrow}>HRIS</span>
        <span className={s.brandName}>Barri Vell</span>
      </div>
    </div>
  );
}

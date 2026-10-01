/**
 * Weekly hours per worker (all locals) compared with the contract.
 * Exceeding the contract is allowed — it is only shown, never blocked.
 */
import { useMemo } from 'react';
import { useApp } from '@/state/AppProvider';
import { useNav } from '@/state/NavContext';
import { useLookups } from '@/state/useLookups';
import { Avatar } from '@/components/ui';
import { formatHours, fullName, initials } from '@/lib/format';
import { hoursByEmployee } from '@/domain/hours';
import s from './calendar.module.css';

export function WeekHoursPanel({ local, dates, workers }) {
  const { data } = useApp();
  const { openEmployee } = useNav();
  const lk = useLookups();

  const rows = useMemo(() => {
    const all = hoursByEmployee(data.shifts, dates[0], dates[6]);
    const here = hoursByEmployee(data.shifts, dates[0], dates[6], (x) => x.localId === local.id);
    return workers.map((e) => {
      const t = all[e.id] || { total: 0, night: 0, day: 0 };
      const offs = dates.filter((d) => data.daysOff.some((o) => o.empId === e.id && o.date === d)).length;
      const over = e.contractHours != null && t.total > e.contractHours ? t.total - e.contractHours : 0;
      return { e, t, here: here[e.id]?.total || 0, offs, over };
    });
  }, [data.shifts, data.daysOff, dates, local.id, workers]);

  return (
    <section className={`card ${s.hoursPanel}`}>
      <div>
        <h2 style={{ fontSize: 18 }}>Horas de la semana</h2>
        <span className="muted" style={{ fontSize: 13 }}>Total en todos los locales frente al contrato</span>
      </div>
      <div className={s.hoursGrid}>
        {rows.map(({ e, t, here, offs, over }) => {
          const pct = e.contractHours ? Math.min(100, (t.total / e.contractHours) * 100) : 0;
          return (
            <button key={e.id} className={s.hoursCard} onClick={() => openEmployee(e.id)}>
              <span className={s.hoursTop}>
                <Avatar text={initials(e)} palette={lk.paletteOf(e)} size={28} />
                <strong className={s.hoursName}>{fullName(e)}</strong>
                <span className="tabular" style={{ fontWeight: 800 }}>
                  {formatHours(t.total)}
                  <span style={{ color: 'var(--ink-4)' }}> / {e.contractHours != null ? `${formatHours(e.contractHours)} h` : '—'}</span>
                </span>
              </span>
              <span className={s.bar}>
                <span style={{ width: `${pct}%`, background: over ? 'var(--orange)' : 'var(--teal)' }} />
              </span>
              <span className="muted" style={{ fontSize: 12.5 }}>
                {formatHours(t.day)} h día · {formatHours(t.night)} h noche · {offs === 1 ? '1 libre' : `${offs} libres`}
                {e.locals.length > 1 && ` · ${formatHours(here)} h aquí`}
              </span>
              {over > 0 && <span className={s.over}>+{formatHours(over)} h sobre contrato</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

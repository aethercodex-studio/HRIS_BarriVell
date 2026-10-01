/**
 * Inicio: who works today in each local + pending tasks
 * (missing night rate, alta not requested, PRL pending).
 */
import { useMemo } from 'react';
import { useApp } from '@/state/AppProvider';
import { useNav } from '@/state/NavContext';
import { useLookups } from '@/state/useLookups';
import { Avatar, EmptyState, Pill } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { capitalize, DAYS_LONG, MONTHS, mondayOf, toYmd, addDays, todayYmd, weekdayIndex } from '@/lib/dates';
import { fullName, initials } from '@/lib/format';
import { shiftHours, toMinutes } from '@/lib/time';
import { hoursByEmployee } from '@/domain/hours';
import s from './home.module.css';

export function HomePage() {
  const { data } = useApp();
  const { go, setLocalId, openEmployee } = useNav();
  const lk = useLookups();
  const now = new Date();
  const today = todayYmd();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const locals = useMemo(
    () =>
      data.locals.map((local) => {
        const shifts = data.shifts.filter((x) => x.localId === local.id && x.date === today);
        const byWorker = {};
        shifts.forEach((x) => (byWorker[x.empId] ||= []).push(x));
        const rows = Object.entries(byWorker).map(([empId, list]) => {
          list.sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
          const isNow = list.some((x) => {
            const a = toMinutes(x.start);
            let b = toMinutes(x.end);
            if (b <= a) b += 1440;
            return nowMin >= a && nowMin < b;
          });
          return { employee: lk.employees[empId], list, isNow, night: list.some((x) => shiftHours(x.start, x.end).night > 0) };
        });
        const offs = data.employees.filter(
          (e) => e.active && e.locals.includes(local.id) && data.daysOff.some((o) => o.empId === e.id && o.date === today),
        );
        return { local, rows: rows.filter((r) => r.employee), offs };
      }),
    [data, today, nowMin, lk],
  );

  const alerts = useMemo(() => {
    const ws = toYmd(mondayOf(now));
    const we = toYmd(addDays(mondayOf(now), 6));
    const week = hoursByEmployee(data.shifts, ws, we);
    const list = [];
    data.employees.forEach((e) => {
      if (!e.active) return;
      if (e.nightRate == null && week[e.id]?.night > 0)
        list.push({ e, tone: 'var(--orange)', bg: 'var(--warning-bg)', text: 'Este trabajador no tiene el precio por hora nocturna informada. Sus horas nocturnas se pagan a €/h normal.' });
      if (!e.altaSolicitada) list.push({ e, tone: 'var(--blue)', bg: 'var(--blue-tint)', text: 'Alta pendiente de solicitar a la gestoría.' });
      if (!e.prl) list.push({ e, tone: 'var(--red)', bg: 'var(--danger-bg)', text: 'Formación PRL pendiente.' });
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <div className="page" style={{ maxWidth: 1300 }}>
      <div>
        <span className={s.eyebrow}>{capitalize(`${DAYS_LONG[weekdayIndex(now)]}, ${now.getDate()} de ${MONTHS[now.getMonth()]}`)}</span>
        <h1 className="page-title">Hoy en los locales</h1>
      </div>

      {!data.locals.length && <EmptyState>Todavía no hay locales. Créalos en Configuración.</EmptyState>}

      <div className={s.grid}>
        {locals.map(({ local, rows, offs }) => (
          <section key={local.id} className={`card ${s.localCard}`}>
            <div className={s.localHead}>
              <div>
                <h2 className={s.localName}>{local.name}</h2>
                <span className="muted" style={{ fontSize: 13 }}>
                  {lk.companies[local.companyId]?.name} · {rows.length === 1 ? '1 persona' : `${rows.length} personas`}
                </span>
              </div>
              <button className={s.linkBtn} onClick={() => { setLocalId(local.id); go('calendario'); }}>
                Ver calendario
              </button>
            </div>
            {rows.length ? (
              rows.map(({ employee, list, isNow, night }) => (
                <button key={employee.id} className={s.row} onClick={() => openEmployee(employee.id)}>
                  <Avatar text={initials(employee)} palette={lk.paletteOf(employee)} size={34} />
                  <span className={s.rowText}>
                    <strong>{fullName(employee)}</strong>
                    <span className="muted">{lk.groupName(employee)}</span>
                  </span>
                  {isNow && <Pill tone="success" dot="var(--teal)">Ahora</Pill>}
                  <span className={`${s.time} tabular`}>
                    {night && <Icon name="moon" size={14} />}
                    {list.map((x) => `${x.start}–${x.end}`).join(' · ')}
                  </span>
                </button>
              ))
            ) : (
              <div className={s.none}>Nadie tiene turno hoy.</div>
            )}
            {offs.length > 0 && (
              <div className={s.offs}>
                <strong>Libres hoy:</strong> {offs.map((e) => e.nombre).join(', ')}
              </div>
            )}
          </section>
        ))}
      </div>

      <section className={`card ${s.alerts}`}>
        <h2 style={{ fontSize: 19 }}>Pendientes</h2>
        {!alerts.length && <p className="muted" style={{ margin: 0 }}>Todo al día.</p>}
        {alerts.map((a, i) => (
          <button key={i} className={s.alert} style={{ background: a.bg }} onClick={() => openEmployee(a.e.id)}>
            <span className={s.alertDot} style={{ background: a.tone }} />
            <span style={{ flex: 1 }}>
              <strong>{fullName(a.e)}</strong> · {a.text}
            </span>
            <Icon name="right" />
          </button>
        ))}
      </section>
    </div>
  );
}

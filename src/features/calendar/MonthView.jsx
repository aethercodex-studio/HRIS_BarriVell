/**
 * Month view: who works each day at this local, plus a monthly summary
 * (days, hours, night hours, days off). Clicking a day opens that week.
 */
import { useMemo } from 'react';
import { useApp } from '@/state/AppProvider';
import { useNav } from '@/state/NavContext';
import { useLookups } from '@/state/useLookups';
import { useIsMobile } from '@/hooks';
import { addDays, DAYS_LETTER, DAYS_SHORT, firstOfMonth, lastOfMonth, MONTHS, mondayOf, parseYmd, toYmd, todayYmd } from '@/lib/dates';
import { formatHours, fullName } from '@/lib/format';
import { hoursByEmployee } from '@/domain/hours';
import s from './calendar.module.css';

const MAX_NAMES = 4;

export function MonthView({ local, month, groupId = 'all', onPickDay }) {
  const { data } = useApp();
  const { openEmployee } = useNav();
  const lk = useLookups();
  const isMobile = useIsMobile();
  const today = todayYmd();
  const inGroup = (e) => groupId === 'all' || e?.groupId === groupId;
  const m = parseYmd(month);
  const from = toYmd(firstOfMonth(m));
  const to = toYmd(lastOfMonth(m));

  const cells = useMemo(() => {
    const out = [];
    for (let d = mondayOf(firstOfMonth(m)); d <= lastOfMonth(m) || out.length % 7; d = addDays(d, 1)) {
      const date = toYmd(d);
      const people = [...new Set(data.shifts.filter((x) => x.localId === local.id && x.date === date).map((x) => x.empId))]
        .map((id) => lk.employees[id])
        .filter((e) => e && inGroup(e))
        .sort(lk.byGroupThenName);
      out.push({ date, inMonth: d.getMonth() === m.getMonth(), people });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.shifts, local.id, month, lk, groupId]);

  const summary = useMemo(() => {
    const agg = hoursByEmployee(data.shifts, from, to, (x) => x.localId === local.id);
    return data.employees
      .filter((e) => inGroup(e) && ((e.active && e.locals.includes(local.id)) || agg[e.id]))
      .sort(lk.byGroupThenName)
      .map((e) => ({
        e,
        days: agg[e.id]?.days.size || 0,
        hours: agg[e.id]?.total || 0,
        night: agg[e.id]?.night || 0,
        offs: data.daysOff.filter((o) => o.empId === e.id && o.date >= from && o.date <= to).length,
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, from, to, local.id, lk, groupId]);

  const totals = summary.reduce((t, r) => ({ days: t.days + r.days, hours: t.hours + r.hours, night: t.night + r.night }), { days: 0, hours: 0, night: 0 });

  return (
    <>
      <div className={`card ${s.month}`}>
        <div className={s.monthHead}>
          {(isMobile ? DAYS_LETTER : DAYS_SHORT).map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className={s.monthGrid}>
          {cells.map((c) => (
            <button key={c.date} className={s.monthCell} style={{ opacity: c.inMonth ? 1 : 0.35, background: c.date === today ? '#f0f8fc' : undefined }} onClick={() => onPickDay(c.date)} title="Abrir esta semana">
              <span className={s.monthTop}>
                <span className={`${s.dayNum} ${c.date === today ? s.dayNumToday : ''}`}>{parseYmd(c.date).getDate()}</span>
                {c.people.length > 0 && <span className="muted" style={{ fontSize: 11.5, fontWeight: 800 }}>{c.people.length}</span>}
              </span>
              {isMobile ? (
                <span className={s.dots}>
                  {c.people.map((e) => <span key={e.id} className={s.dot} style={{ background: lk.paletteOf(e).dot, width: 7, height: 7 }} />)}
                </span>
              ) : (
                <>
                  {c.people.slice(0, MAX_NAMES).map((e) => (
                    <span key={e.id} className={s.monthName}>
                      <span className={s.dot} style={{ background: lk.paletteOf(e).dot, width: 7, height: 7 }} />
                      {e.nombre}
                    </span>
                  ))}
                  {c.people.length > MAX_NAMES && <span className="muted" style={{ fontSize: 12, fontWeight: 700 }}>+{c.people.length - MAX_NAMES} más</span>}
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      <section className={`card ${s.summary}`}>
        <h2 style={{ fontSize: 18 }}>Resumen de {MONTHS[m.getMonth()]} en {local.name}</h2>
        <div className={`${s.sumRow} ${s.sumHead}`}>
          <span>Trabajador</span><span>Días</span><span>Horas</span><span>Noche</span><span>Libres</span>
        </div>
        {summary.map((r) => (
          <button key={r.e.id} className={s.sumRow} onClick={() => openEmployee(r.e.id)}>
            <span className={s.sumName}><span className={s.dot} style={{ background: lk.paletteOf(r.e).dot }} />{isMobile ? r.e.nombre : fullName(r.e)}</span>
            <span>{r.days}</span>
            <strong>{formatHours(r.hours)} h</strong>
            <span>{formatHours(r.night)} h</span>
            <span className="muted">{r.offs}</span>
          </button>
        ))}
        <div className={`${s.sumRow} ${s.sumFoot}`}>
          <span>Total</span><span>{totals.days}</span><span>{formatHours(totals.hours)} h</span><span>{formatHours(totals.night)} h</span><span />
        </div>
      </section>
    </>
  );
}

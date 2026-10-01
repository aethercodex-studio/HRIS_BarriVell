/**
 * Calendario: one calendar per local. Week view (time grid, 24 h, drag & resize)
 * and month view (who works each day + monthly summary).
 */
import { useMemo, useState } from 'react';
import { useApp } from '@/state/AppProvider';
import { useNav } from '@/state/NavContext';
import { useLookups } from '@/state/useLookups';
import { Alert, Button, EmptyState, IconButton, Segmented } from '@/components/ui';
import { addDays, firstOfMonth, mondayOf, monthLabel, parseYmd, toYmd, weekDates, weekRangeLabel, weekdayIndex } from '@/lib/dates';
import { fullName } from '@/lib/format';
import { printWeek } from '@/lib/printWeek';
import { hoursByEmployee } from '@/domain/hours';
import * as actions from '@/domain/actions';
import { WeekGrid } from './WeekGrid';
import { WeekHoursPanel } from './WeekHoursPanel';
import { MonthView } from './MonthView';
import { ShiftEditor } from './ShiftEditor';
import { DayOffModal } from './DayOffModal';
import s from './calendar.module.css';

export function CalendarPage() {
  const { data, update, confirm, showToast } = useApp();
  const { localId: savedLocal, setLocalId, go, openEmployee } = useNav();
  const lk = useLookups();

  const local = lk.locals[savedLocal] || data.locals[0] || null;
  const [view, setView] = useState('semana');
  const [weekStart, setWeekStart] = useState(() => toYmd(mondayOf(new Date())));
  const [month, setMonth] = useState(() => toYmd(firstOfMonth(new Date())));
  const [mobileDay, setMobileDay] = useState(() => weekdayIndex(new Date()));
  const [highlight, setHighlight] = useState(null); // empId shown on top, others dimmed
  const [editor, setEditor] = useState(null); // { id?, empId, date, start, end }
  const [dayOff, setDayOff] = useState(null); // { mode: 'add'|'edit', empId, date }

  const dates = useMemo(() => weekDates(parseYmd(weekStart)), [weekStart]);
  const workers = useMemo(
    () => (local ? data.employees.filter((e) => e.active && e.locals.includes(local.id)).sort(lk.byGroupThenName) : []),
    [data.employees, local, lk],
  );

  // Workers with night hours this week but no night rate → warning banner.
  const nightMissing = useMemo(() => {
    const agg = hoursByEmployee(data.shifts, dates[0], dates[6]);
    return workers.filter((e) => e.nightRate == null && agg[e.id]?.night > 0);
  }, [data.shifts, dates, workers]);

  if (!local) {
    return (
      <div className="page">
        <h1 className="page-title">Calendario</h1>
        <EmptyState>
          No hay locales todavía. Al crear un local, su calendario se crea solo.{' '}
          <Button variant="ghost" onClick={() => go('config')}>Ir a Configuración</Button>
        </EmptyState>
      </div>
    );
  }

  const shiftPeriod = (n) => {
    if (view === 'semana') setWeekStart(toYmd(addDays(parseYmd(weekStart), 7 * n)));
    else {
      const m = parseYmd(month);
      setMonth(toYmd(new Date(m.getFullYear(), m.getMonth() + n, 1)));
    }
  };
  const goToday = () => {
    setWeekStart(toYmd(mondayOf(new Date())));
    setMonth(toYmd(firstOfMonth(new Date())));
    setMobileDay(weekdayIndex(new Date()));
  };

  async function copyPreviousWeek() {
    const hasShifts = data.shifts.some((x) => x.localId === local.id && dates.includes(x.date));
    if (hasShifts) {
      const ok = await confirm([{ title: '¿Copiar la semana anterior?', text: `Se sustituirán los turnos y días libres de esta semana en ${local.name} por los de la semana pasada.`, label: 'Copiar semana' }]);
      if (!ok) return;
    }
    update(actions.copyPreviousWeek, local.id, weekStart);
    showToast(`Semana anterior copiada en ${local.name}`);
  }

  return (
    <div className="page" style={{ maxWidth: 1600, gap: 16 }}>
      <div>
        <h1 className="page-title">Calendario</h1>
        <p className="page-subtitle">Turnos por local · horario de 24 h · noche de 22:00 a 06:00 · arrastra un turno para moverlo o sus bordes para alargarlo</p>
      </div>

      {/* Local switcher grouped by company */}
      <div className={s.locals}>
        {data.companies.map((c) => {
          const locals = data.locals.filter((l) => l.companyId === c.id);
          if (!locals.length) return null;
          return (
            <div key={c.id} className={s.localGroup}>
              <span className={s.eyebrow}>{c.name}</span>
              <div className={s.localPills}>
                {locals.map((l) => (
                  <button key={l.id} className={`${s.localPill} ${l.id === local.id ? s.localPillOn : ''}`} onClick={() => { setLocalId(l.id); setHighlight(null); }}>
                    {l.name}
                    <span className={s.count}>{data.employees.filter((e) => e.active && e.locals.includes(l.id)).length}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="toolbar">
        <Segmented value={view} onChange={setView} options={[{ value: 'semana', label: 'Semana' }, { value: 'mes', label: 'Mes' }]} />
        <div className={s.nav}>
          <IconButton icon="left" label="Anterior" onClick={() => shiftPeriod(-1)} className={s.navBtn} />
          <Button size="sm" onClick={goToday}>Hoy</Button>
          <IconButton icon="right" label="Siguiente" onClick={() => shiftPeriod(1)} className={s.navBtn} />
        </div>
        <strong>{view === 'semana' ? weekRangeLabel(parseYmd(weekStart)) : monthLabel(parseYmd(month))}</strong>
        {view === 'semana' && (
          <div className={s.actions}>
            <Button variant="primary" icon="printer" onClick={() => printWeek(data, local.id, weekStart)}>Imprimir semana</Button>
            <Button icon="copy" onClick={copyPreviousWeek}>Copiar semana anterior</Button>
          </div>
        )}
      </div>

      {!workers.length && <EmptyState>No hay trabajadores asignados a {local.name}. Asigna locales desde la ficha de cada empleado.</EmptyState>}

      {view === 'semana' && workers.length > 0 && (
        <>
          {nightMissing.length > 0 && (
            <Alert>
              Este trabajador no tiene el precio por hora nocturna informada. Sus horas nocturnas se calculan a €/h normal.
              <div className={s.alertLinks}>
                {nightMissing.map((e) => (
                  <Button key={e.id} size="sm" onClick={() => openEmployee(e.id)}>{fullName(e)} · abrir ficha</Button>
                ))}
              </div>
            </Alert>
          )}

          <div className={s.highlight}>
            <span className="muted" style={{ fontSize: 13, fontWeight: 700 }}>Resaltar:</span>
            {workers.map((e) => {
              const pal = lk.paletteOf(e);
              const on = highlight === e.id;
              return (
                <button key={e.id} className={s.hiChip} style={{ background: on ? pal.bg : undefined, borderColor: on ? pal.dot : undefined }} onClick={() => setHighlight(on ? null : e.id)}>
                  <span className={s.dot} style={{ background: pal.dot }} />
                  {e.nombre}
                </button>
              );
            })}
            {highlight && <Button variant="ghost" size="sm" onClick={() => setHighlight(null)}>Ver todos</Button>}
          </div>

          <WeekGrid
            local={local}
            dates={dates}
            workers={workers}
            highlight={highlight}
            mobileDay={mobileDay}
            setMobileDay={setMobileDay}
            onNewShift={(date, start, end) => setEditor({ empId: workers.find((w) => w.id === highlight)?.id || workers[0].id, date, start, end })}
            onEditShift={(shift) => setEditor({ ...shift })}
            onDayOff={setDayOff}
          />

          <WeekHoursPanel local={local} dates={dates} workers={highlight ? workers.filter((w) => w.id === highlight) : workers} />
        </>
      )}

      {view === 'mes' && workers.length > 0 && (
        <MonthView
          local={local}
          month={month}
          onPickDay={(date) => {
            setView('semana');
            setWeekStart(toYmd(mondayOf(parseYmd(date))));
            setMobileDay(weekdayIndex(parseYmd(date)));
          }}
        />
      )}

      {editor && <ShiftEditor local={local} workers={workers} value={editor} onClose={() => setEditor(null)} />}
      {dayOff && <DayOffModal local={local} dates={dates} workers={workers} value={dayOff} onClose={() => setDayOff(null)} />}
    </div>
  );
}

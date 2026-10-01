/**
 * Week time grid. Rows = hours (06:00 → 06:00), columns = days.
 * On mobile only the selected day is shown (day strip on top).
 *
 * Interactions:
 *  - click empty space  → new shift at that time
 *  - click a shift      → edit
 *  - drag a shift       → move (time and/or day)
 *  - drag top/bottom    → change start/end (15-min steps)
 */
import { useEffect, useMemo, useRef } from 'react';
import { useApp } from '@/state/AppProvider';
import { useLookups } from '@/state/useLookups';
import { useIsMobile } from '@/hooks';
import { Icon } from '@/components/ui/Icon';
import { GRID_START_MIN } from '@/config/constants';
import { DAYS_LETTER, DAYS_SHORT, parseYmd, todayYmd } from '@/lib/dates';
import { formatHours, fullName } from '@/lib/format';
import { toHHMM } from '@/lib/time';
import { layoutDay } from '@/domain/calendarLayout';
import { useShiftDrag } from './useShiftDrag';
import s from './calendar.module.css';

export function WeekGrid({ local, dates, workers, highlight, mobileDay, setMobileDay, onNewShift, onEditShift, onDayOff }) {
  const { data } = useApp();
  const lk = useLookups();
  const isMobile = useIsMobile();
  const hourPx = isMobile ? 48 : 44;
  const today = todayYmd();
  const { preview, startDrag, wasJustDragged } = useShiftDrag({ hourPx, onClick: onEditShift });

  const workerOrder = useMemo(() => Object.fromEntries(workers.map((w, i) => [w.id, i])), [workers]);
  const workerIds = useMemo(() => new Set(workers.map((w) => w.id)), [workers]);
  const visibleDays = isMobile ? [mobileDay] : [0, 1, 2, 3, 4, 5, 6];

  // Shifts of this local per day, with the live drag preview applied.
  const days = useMemo(() => {
    let maxLanes = 1;
    const list = visibleDays.map((i) => {
      const date = dates[i];
      let shifts = data.shifts.filter((x) => x.localId === local.id && x.date === date);
      if (preview) {
        shifts = shifts.filter((x) => x.id !== preview.shift.id);
        if (preview.date === date) shifts.push({ ...preview.shift, date, start: preview.start, end: preview.end });
      }
      const { items, maxLanes: lanes } = layoutDay(shifts, workerOrder);
      maxLanes = Math.max(maxLanes, lanes);
      const offs = workers.filter((w) => data.daysOff.some((o) => o.empId === w.id && o.date === date));
      const hours = items.reduce((sum, it) => sum + it.hours.total, 0);
      const people = new Set(items.map((it) => it.shift.empId)).size;
      return { i, date, items, offs, hours, people };
    });
    return { list, maxLanes };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.shifts, data.daysOff, dates, local.id, preview, workerOrder, workers, isMobile, mobileDay]);

  // Wider grid when many shifts overlap, so blocks stay readable (scrolls sideways).
  const minWidth = isMobile ? (days.maxLanes > 4 ? 56 + days.maxLanes * 70 : 0) : 56 + 7 * Math.max(118, days.maxLanes * 60);
  const cols = `56px repeat(${visibleDays.length}, minmax(0, 1fr))`;

  // Open the grid scrolled to 10:00.
  const bodyRef = useRef(null);
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = hourPx * 4;
  }, [local.id, dates, hourPx]);

  function clickColumn(ev, date) {
    if (wasJustDragged()) return;
    const y = ev.clientY - ev.currentTarget.getBoundingClientRect().top;
    const minutes = Math.max(0, Math.min(1410, Math.floor((y / hourPx) * 2) * 30));
    const start = toHHMM(minutes + GRID_START_MIN);
    onNewShift(date, start, toHHMM(minutes + GRID_START_MIN + 240));
  }

  return (
    <>
      {isMobile && (
        <div className={s.strip}>
          {dates.map((d, i) => (
            <button key={d} className={`${s.stripDay} ${i === mobileDay ? s.stripOn : ''} ${d === today ? s.stripToday : ''}`} onClick={() => setMobileDay(i)}>
              <span>{DAYS_LETTER[i]}</span>
              <strong>{parseYmd(d).getDate()}</strong>
            </button>
          ))}
        </div>
      )}

      <div className={`card ${s.gridCard}`}>
        <div className={s.hscroll}>
          <div style={{ minWidth }}>
            {/* Day headers */}
            <div className={`${s.gridRow} ${s.gridHead}`} style={{ gridTemplateColumns: cols }}>
              <div />
              {days.list.map((d) => (
                <div key={d.date} className={s.dayHead}>
                  <span className={s.dayName}>
                    {DAYS_SHORT[d.i]}
                    <span className={`${s.dayNum} ${d.date === today ? s.dayNumToday : ''}`}>{parseYmd(d.date).getDate()}</span>
                  </span>
                  <span className="muted" style={{ fontSize: 12 }}>{d.hours ? `${d.people} pers. · ${formatHours(d.hours)} h` : 'Sin turnos'}</span>
                </div>
              ))}
            </div>

            {/* Days off row */}
            <div className={`${s.gridRow} ${s.offRow}`} style={{ gridTemplateColumns: cols }}>
              <div className={s.offLabel}>Libre</div>
              {days.list.map((d) => (
                <div key={d.date} className={s.offCell}>
                  {d.offs.map((w) => {
                    const pal = lk.paletteOf(w);
                    return (
                      <button key={w.id} className={s.offChip} style={{ borderColor: pal.dot }} title="Cambiar día libre" onClick={() => onDayOff({ mode: 'edit', empId: w.id, date: d.date })}>
                        <span className={s.dot} style={{ background: pal.dot }} />
                        {w.nombre}
                      </button>
                    );
                  })}
                  <button className={s.addOff} title="Añadir día libre" aria-label="Añadir día libre" onClick={() => onDayOff({ mode: 'add', empId: workers[0]?.id, date: d.date })}>
                    <Icon name="plus" size={15} strokeWidth={2.4} />
                  </button>
                </div>
              ))}
            </div>

            {/* Time grid */}
            <div ref={bodyRef} className={s.body} style={{ maxHeight: isMobile ? '70vh' : 'max(560px, calc(100vh - 170px))' }}>
              <div className={s.gridRow} style={{ gridTemplateColumns: cols, position: 'relative' }}>
                <div style={{ position: 'relative', height: 24 * hourPx }}>
                  {Array.from({ length: 23 }, (_, i) => (
                    <span key={i} className={s.hourLabel} style={{ top: (i + 1) * hourPx - 7 }}>{toHHMM(GRID_START_MIN + (i + 1) * 60)}</span>
                  ))}
                </div>
                {days.list.map((d) => (
                  <div
                    key={d.date}
                    data-calday={d.date}
                    className={s.dayCol}
                    style={{ height: 24 * hourPx, backgroundSize: `100% ${hourPx}px` }}
                    title="Haz clic para añadir un turno"
                    onClick={(ev) => clickColumn(ev, d.date)}
                  >
                    {/* Night band 22:00 → 06:00 */}
                    <div className={s.night} style={{ top: 16 * hourPx, height: 8 * hourPx }} />
                    {d.items.map((it) => {
                      const e = lk.employees[it.shift.empId];
                      if (!e || !workerIds.has(e.id)) return null;
                      return (
                        <ShiftBlock
                          key={it.shift.id}
                          item={it}
                          employee={e}
                          palette={lk.paletteOf(e)}
                          hourPx={hourPx}
                          dimmed={highlight && highlight !== e.id}
                          dragging={preview?.shift.id === it.shift.id}
                          onPointerDown={(ev, mode) => startDrag(ev, it, mode)}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ShiftBlock({ item, employee, palette, hourPx, dimmed, dragging, onPointerDown }) {
  const { shift, startMin, endMin, lane, lanes, hours } = item;
  const width = 100 / lanes;
  const height = ((endMin - startMin) / 60) * hourPx;
  const warn = hours.night > 0 && employee.nightRate == null;
  const title = `${fullName(employee)} · ${shift.start}–${shift.end}${hours.night > 0 ? ` · ${formatHours(hours.night)} h nocturnas` : ''}${warn ? ' · Este trabajador no tiene el precio por hora nocturna informada' : ''}`;

  return (
    <div
      className={`${s.block} ${dragging ? s.blockDragging : ''}`}
      title={title}
      style={{
        top: (startMin / 60) * hourPx + 1,
        height: Math.max(height - 3, 20),
        left: `calc(${lane * width}% + 3px)`,
        width: `calc(${width}% - 6px)`,
        background: palette.bg,
        borderColor: palette.dot,
        opacity: dimmed ? 0.22 : 1,
      }}
      onClick={(ev) => ev.stopPropagation()}
      onPointerDown={(ev) => onPointerDown(ev, 'move')}
    >
      <div className={`${s.handle} ${s.handleTop}`} onPointerDown={(ev) => onPointerDown(ev, 'top')} title="Arrastra para cambiar la entrada">
        <span style={{ background: palette.dot }} />
      </div>
      <div className={`${s.handle} ${s.handleBottom}`} onPointerDown={(ev) => onPointerDown(ev, 'bottom')} title="Arrastra para cambiar la salida">
        <span style={{ background: palette.dot }} />
      </div>
      <span className={s.blockName}>
        {warn && <Icon name="alert" size={13} strokeWidth={2.4} color="var(--warning-ink)" />}
        {employee.nombre}
      </span>
      <span className={s.blockTime}>{shift.start}–{shift.end}</span>
      {height >= 62 && hours.night > 0 && (
        <span className={s.blockNight}>
          <Icon name="moon" size={12} strokeWidth={2.2} />
          {formatHours(hours.night)} h noche
        </span>
      )}
    </div>
  );
}

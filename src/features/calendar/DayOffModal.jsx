/**
 * Day off dialog.
 *  - add:  pick a worker and mark the day as libre
 *  - edit: move the day off to another day of the week (shifts are swapped) or remove it
 */
import { useState } from 'react';
import { useApp } from '@/state/AppProvider';
import { useNav } from '@/state/NavContext';
import { Button, Field, Modal, Select } from '@/components/ui';
import { DAYS_LONG, DAYS_SHORT, capitalize, longDayLabel, parseYmd, weekdayIndex } from '@/lib/dates';
import { fullName } from '@/lib/format';
import * as actions from '@/domain/actions';
import s from './calendar.module.css';

export function DayOffModal({ dates, workers, value, onClose }) {
  const { data, update, confirm, showToast } = useApp();
  const { openEmployee } = useNav();
  const [empId, setEmpId] = useState(value.empId);
  const employee = data.employees.find((e) => e.id === empId);

  async function markOff() {
    const count = data.shifts.filter((x) => x.empId === empId && x.date === value.date).length;
    if (count) {
      const ok = await confirm([{ title: 'Este trabajador tiene turnos ese día', text: `Al marcarlo como libre se eliminarán sus ${count} turno(s) de ese día.`, label: 'Marcar libre' }]);
      if (!ok) return;
    }
    update(actions.setDayOff, empId, value.date);
    showToast('Día libre guardado');
    onClose();
  }

  function moveTo(target) {
    const moved = update(actions.moveDayOff, empId, value.date, target);
    const day = (d) => DAYS_LONG[weekdayIndex(parseYmd(d))];
    showToast(moved ? `Día libre movido al ${day(target)}. Sus turnos de ese día pasan al ${day(value.date)}.` : `Día libre movido al ${day(target)}.`);
    onClose();
  }

  function remove() {
    update(actions.clearDayOff, empId, value.date);
    showToast('Día libre quitado');
    onClose();
  }

  return (
    <Modal title="Día libre" subtitle={capitalize(longDayLabel(value.date))} onClose={onClose} width={460}
      footer={
        value.mode === 'add' ? (
          <>
            <Button onClick={onClose}>Cancelar</Button>
            <Button variant="primary" onClick={markOff}>Marcar libre</Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => { onClose(); openEmployee(empId); }}>Abrir ficha</Button>
            <span style={{ flex: 1 }} />
            <Button onClick={remove}>Quitar día libre</Button>
          </>
        )
      }
    >
      {value.mode === 'add' ? (
        <Field label="Trabajador">
          <Select value={empId} onChange={setEmpId} options={workers.map((e) => ({ value: e.id, label: fullName(e) }))} />
        </Field>
      ) : (
        <>
          <strong style={{ fontSize: 16 }}>{employee && fullName(employee)}</strong>
          <span style={{ fontSize: 13.5, fontWeight: 700 }}>Mover el día libre a:</span>
          <div className={s.moveDays}>
            {dates.map((d, i) => (
              <button key={d} className={s.moveDay} disabled={d === value.date} onClick={() => moveTo(d)}>
                <span>{DAYS_SHORT[i]}</span>
                <strong>{parseYmd(d).getDate()}</strong>
              </button>
            ))}
          </div>
          <span className="muted" style={{ fontSize: 12.5 }}>Si ese día tiene turnos, se intercambian: los turnos pasan al día libre actual.</span>
        </>
      )}
    </Modal>
  );
}

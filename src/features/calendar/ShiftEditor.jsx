/**
 * New / edit shift dialog. Title carries the day ("NUEVO TURNO PARA MARTES 29 SEPTIEMBRE").
 * Only worker + entrada/salida are editable; the day is changed by dragging.
 */
import { useState } from 'react';
import { useApp } from '@/state/AppProvider';
import { Alert, Button, Field, Modal, Select } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { DAYS_LONG, MONTHS, parseYmd, weekdayIndex } from '@/lib/dates';
import { formatHours, fullName } from '@/lib/format';
import { QUARTER_HOURS, crossesMidnight, shiftHours } from '@/lib/time';
import * as actions from '@/domain/actions';
import s from './calendar.module.css';

export function ShiftEditor({ local, workers, value, onClose }) {
  const { data, update, showToast } = useApp();
  const [shift, setShift] = useState(value);
  const [error, setError] = useState('');
  const set = (k) => (v) => {
    setShift((x) => ({ ...x, [k]: v }));
    setError('');
  };

  const employee = data.employees.find((e) => e.id === shift.empId);
  const h = shiftHours(shift.start, shift.end);
  const d = parseYmd(shift.date);
  const title = `${shift.id ? 'Editar turno del' : 'Nuevo turno para'} ${DAYS_LONG[weekdayIndex(d)]} ${d.getDate()} ${MONTHS[d.getMonth()]}`.toUpperCase();
  const isDayOff = data.daysOff.some((o) => o.empId === shift.empId && o.date === shift.date);
  const otherShifts = data.shifts
    .filter((x) => x.empId === shift.empId && x.date === shift.date && x.id !== shift.id)
    .map((x) => `${data.locals.find((l) => l.id === x.localId)?.name || ''} ${x.start}–${x.end}`);
  const workerOptions = data.employees
    .filter((e) => e.active && (e.locals.includes(local.id) || e.id === shift.empId))
    .map((e) => ({ value: e.id, label: fullName(e) }));

  function save() {
    if (shift.start === shift.end) return setError('La hora de entrada y la de salida no pueden ser iguales.');
    update(actions.saveShift, { ...shift, localId: shift.localId || local.id });
    showToast('Turno guardado');
    onClose();
  }

  function remove() {
    update(actions.deleteShift, shift.id);
    showToast('Turno eliminado');
    onClose();
  }

  const times = QUARTER_HOURS.map((t) => ({ value: t, label: t }));

  return (
    <Modal
      title={title}
      subtitle={local.name}
      onClose={onClose}
      footer={
        <>
          {shift.id && <Button variant="danger" onClick={remove}>Eliminar</Button>}
          {shift.id && <Button onClick={() => setShift({ empId: shift.empId, date: shift.date, start: '19:00', end: '23:00' })}>+ Otro turno ese día</Button>}
          <span style={{ flex: 1 }} />
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={save}>Guardar</Button>
        </>
      }
    >
      <Field label="Trabajador"><Select value={shift.empId} onChange={set('empId')} options={workerOptions} /></Field>
      <div className={s.twoCols}>
        <Field label="Entrada"><Select value={shift.start} onChange={set('start')} options={times} /></Field>
        <Field label="Salida"><Select value={shift.end} onChange={set('end')} options={times} /></Field>
      </div>
      <div className={s.totals}>
        <span><strong style={{ fontSize: 17 }}>{formatHours(h.total)} h</strong> en total</span>
        <span>{formatHours(h.day)} h día</span>
        <span className={s.nowrap}><Icon name="moon" size={14} /> {formatHours(h.night)} h noche</span>
        {crossesMidnight(shift.start, shift.end) && <span className="muted">Termina al día siguiente</span>}
      </div>
      {h.night > 0 && employee?.nightRate == null && <Alert>Este trabajador no tiene el precio por hora nocturna informada. Se pagará a €/h normal.</Alert>}
      {isDayOff && <div className={s.note}>Este día está marcado como libre. Al guardar el turno se quitará el día libre.</div>}
      {otherShifts.length > 0 && <div style={{ fontSize: 13.5 }}><strong>También ese día:</strong> {otherShifts.join(' · ')}</div>}
      {error && <div style={{ color: 'var(--danger)', fontWeight: 700 }}>{error}</div>}
    </Modal>
  );
}

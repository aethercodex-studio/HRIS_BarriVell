/**
 * Worker groups (Encargado, Camarero, Cocinero…). Each group has a colour used
 * in cards and in the calendar. The counter expands to list the members.
 */
import { useState } from 'react';
import { useApp } from '@/state/AppProvider';
import { useNav } from '@/state/NavContext';
import { useLookups } from '@/state/useLookups';
import { Button, TextInput } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { GROUP_COLORS } from '@/config/constants';
import { groupPalette } from '@/lib/colors';
import { fullName } from '@/lib/format';
import * as actions from '@/domain/actions';
import s from './settings.module.css';

export function GroupsSettings() {
  const { data, update, confirm, showToast } = useApp();
  const { openEmployee } = useNav();
  const lk = useLookups();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(5);
  const [pickerFor, setPickerFor] = useState(null);
  const [openGroup, setOpenGroup] = useState(null);

  function addGroup() {
    const name = newName.trim();
    if (!name) return;
    update(actions.addGroup, name, newColor);
    setNewName('');
    showToast(`Grupo ${name} creado`);
  }

  async function removeGroup(g, count) {
    const ok = await confirm([{ title: `¿Eliminar el grupo ${g.name}?`, text: count ? `${count} trabajador(es) se quedarán sin grupo.` : 'Ningún trabajador usa este grupo.', label: 'Eliminar grupo', danger: true }]);
    if (ok) update(actions.deleteGroup, g.id);
  }

  return (
    <section className={`card ${s.card}`}>
      <div>
        <h2 className={s.title}>Grupos de trabajadores</h2>
        <span className="muted" style={{ fontSize: 13.5 }}>Cada grupo tiene su color en las fichas y en el calendario.</span>
      </div>

      {data.groups.map((g) => {
        const members = data.employees.filter((e) => e.groupId === g.id).sort((a, b) => b.active - a.active || a.nombre.localeCompare(b.nombre, 'es'));
        const open = openGroup === g.id && members.length > 0;
        return (
          <div key={g.id} className={s.groupItem}>
            <div className={s.rowWrap}>
              <button className={s.swatchBtn} style={{ background: groupPalette(g.color).dot }} aria-label="Cambiar color" onClick={() => setPickerFor(pickerFor === g.id ? null : g.id)} />
              <input className={s.inlineInput} value={g.name} onChange={(ev) => update(actions.updateGroup, g.id, { name: ev.target.value })} />
              <Button size="sm" onClick={() => setOpenGroup(open ? null : g.id)}>
                {members.length === 1 ? '1 trabajador' : `${members.length} trabajadores`} · {open ? 'ocultar' : 'ver'}
              </Button>
              <button className={s.trash} aria-label="Eliminar grupo" onClick={() => removeGroup(g, members.length)}><Icon name="trash" size={16} /></button>
            </div>
            {open && (
              <div className={s.members}>
                {members.map((e) => (
                  <button key={e.id} className={s.member} style={{ opacity: e.active ? 1 : 0.55 }} onClick={() => openEmployee(e.id)}>
                    <strong>{fullName(e)}</strong>
                    <span className="muted">{e.active ? lk.localNames(e) || 'Sin local' : 'Inactivo'}</span>
                  </button>
                ))}
              </div>
            )}
            {pickerFor === g.id && (
              <Swatches value={g.color} onPick={(i) => { update(actions.updateGroup, g.id, { color: i }); setPickerFor(null); }} />
            )}
          </div>
        );
      })}

      <div className={s.newGroup}>
        <strong>Nuevo grupo</strong>
        <div className={s.rowWrap}>
          <TextInput value={newName} onChange={setNewName} placeholder="Ej.: Barman" className={s.grow} />
          <Button variant="primary" onClick={addGroup}>Añadir grupo</Button>
        </div>
        <Swatches value={newColor} onPick={setNewColor} />
      </div>
    </section>
  );
}

function Swatches({ value, onPick }) {
  return (
    <div className={s.swatches}>
      {GROUP_COLORS.map(([color], i) => (
        <button key={color} className={s.swatch} style={{ background: color, boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${i === value ? 'var(--ink)' : 'transparent'}` }} aria-label={`Color ${i + 1}`} onClick={() => onPick(i)} />
      ))}
    </div>
  );
}

/**
 * Companies & locals. Adding a local creates its calendar automatically
 * (calendars are derived from locals). Deleting asks for confirmation TWICE.
 */
import { useState } from 'react';
import { useApp } from '@/state/AppProvider';
import { useNav } from '@/state/NavContext';
import { Button, TextInput } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import * as actions from '@/domain/actions';
import s from './settings.module.css';

export function CompaniesSettings() {
  const { data, update, confirm, showToast } = useApp();
  const { go, setLocalId } = useNav();
  const [newCompany, setNewCompany] = useState('');
  const [newLocal, setNewLocal] = useState({});
  const [rename, setRename] = useState(null); // { kind: 'company'|'local', id, value }

  const activeIn = (pred) => data.employees.filter((e) => e.active && pred(e)).length;

  function addCompany() {
    const name = newCompany.trim();
    if (!name) return;
    update(actions.addCompany, name);
    setNewCompany('');
    showToast(`Empresa ${name} creada`);
  }

  function addLocal(companyId) {
    const name = (newLocal[companyId] || '').trim();
    if (!name) return;
    update(actions.addLocal, companyId, name);
    setNewLocal((m) => ({ ...m, [companyId]: '' }));
    showToast(`Local ${name} creado con su calendario`);
  }

  function saveRename() {
    const v = rename.value.trim();
    if (v) update(rename.kind === 'company' ? actions.renameCompany : actions.renameLocal, rename.id, v);
    setRename(null);
  }

  async function removeLocal(local) {
    const shifts = data.shifts.filter((x) => x.localId === local.id).length;
    const workers = data.employees.filter((e) => e.locals.includes(local.id)).length;
    const ok = await confirm([
      { title: `¿Eliminar el local ${local.name}?`, text: 'También se eliminará su calendario.', label: 'Sí, continuar', danger: true },
      { title: 'Última confirmación', text: `Se borrarán ${shifts} turnos de ${local.name} y se quitará este local a ${workers} trabajador(es). No se puede deshacer.`, label: 'Eliminar definitivamente', danger: true },
    ]);
    if (ok) {
      update(actions.deleteLocal, local.id);
      showToast(`Local ${local.name} eliminado`);
    }
  }

  async function removeCompany(company) {
    const locals = data.locals.filter((l) => l.companyId === company.id).length;
    const workers = data.employees.filter((e) => e.companyId === company.id).length;
    const ok = await confirm([
      { title: `¿Eliminar la empresa ${company.name}?`, text: `También se eliminarán sus ${locals} local(es) y sus calendarios.`, label: 'Sí, continuar', danger: true },
      { title: 'Última confirmación', text: `Se borrarán los locales y turnos de ${company.name}. Sus ${workers} trabajador(es) se quedarán sin empresa asignada. No se puede deshacer.`, label: 'Eliminar definitivamente', danger: true },
    ]);
    if (ok) {
      update(actions.deleteCompany, company.id);
      showToast(`Empresa ${company.name} eliminada`);
    }
  }

  // Rendered as a plain function (not a component) so the input keeps focus while typing.
  const renameRow = () => (
    <>
      <TextInput value={rename.value} onChange={(value) => setRename((r) => ({ ...r, value }))} className={s.grow} autoFocus />
      <Button variant="primary" size="sm" onClick={saveRename}>Guardar</Button>
      <Button size="sm" onClick={() => setRename(null)}>Cancelar</Button>
    </>
  );

  return (
    <div className={s.stack}>
      {data.companies.map((c) => {
        const locals = data.locals.filter((l) => l.companyId === c.id);
        const renaming = rename?.kind === 'company' && rename.id === c.id;
        return (
          <section key={c.id} className={`card ${s.card}`}>
            <div className={s.rowWrap}>
              <span className={s.badge}><Icon name="briefcase" size={19} /></span>
              {renaming ? (
                renameRow()
              ) : (
                <>
                  <div className={s.grow}>
                    <h2 className={s.title}>{c.name}</h2>
                    <span className="muted" style={{ fontSize: 13 }}>{locals.length} {locals.length === 1 ? 'local' : 'locales'} · {activeIn((e) => e.companyId === c.id)} trabajadores activos</span>
                  </div>
                  <Button size="sm" onClick={() => setRename({ kind: 'company', id: c.id, value: c.name })}>Renombrar</Button>
                  <Button size="sm" variant="danger" onClick={() => removeCompany(c)}>Eliminar empresa</Button>
                </>
              )}
            </div>

            <div className={s.list}>
              {locals.map((l) => {
                const renamingLocal = rename?.kind === 'local' && rename.id === l.id;
                const n = activeIn((e) => e.locals.includes(l.id));
                return (
                  <div key={l.id} className={s.item}>
                    <Icon name="pin" size={18} color="var(--ink-2)" />
                    {renamingLocal ? (
                      renameRow()
                    ) : (
                      <>
                        <div className={s.grow}>
                          <strong>{l.name}</strong>
                          <div className="muted" style={{ fontSize: 12.5 }}>{n} {n === 1 ? 'trabajador' : 'trabajadores'} · calendario activo</div>
                        </div>
                        <Button size="sm" onClick={() => { setLocalId(l.id); go('calendario'); }}>Ver calendario</Button>
                        <Button size="sm" onClick={() => setRename({ kind: 'local', id: l.id, value: l.name })}>Renombrar</Button>
                        <button className={s.trash} aria-label="Eliminar local" onClick={() => removeLocal(l)}><Icon name="trash" size={16} /></button>
                      </>
                    )}
                  </div>
                );
              })}
              {!locals.length && <span className="muted">Esta empresa todavía no tiene locales.</span>}
            </div>

            <div className={s.rowWrap}>
              <TextInput value={newLocal[c.id] || ''} onChange={(v) => setNewLocal((m) => ({ ...m, [c.id]: v }))} placeholder="Nombre del nuevo local" className={s.grow} />
              <Button variant="outline" icon="plus" onClick={() => addLocal(c.id)}>Añadir local</Button>
            </div>
          </section>
        );
      })}

      <section className={`card ${s.card} ${s.dashed}`}>
        <strong>Nueva empresa</strong>
        <div className={s.rowWrap}>
          <TextInput value={newCompany} onChange={setNewCompany} placeholder="Nombre de la empresa" className={s.grow} />
          <Button variant="primary" onClick={addCompany}>Añadir empresa</Button>
        </div>
      </section>
    </div>
  );
}

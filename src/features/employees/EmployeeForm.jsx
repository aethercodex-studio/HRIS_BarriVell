/**
 * Create / edit worker form. Hire date is never typed: it is set automatically
 * when the worker is created (see domain/actions.createEmployee).
 */
import { useApp } from '@/state/AppProvider';
import { useLookups } from '@/state/useLookups';
import { Field, Select, TextInput, Toggle } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { DNI_IMAGE_MAX_PX } from '@/config/constants';
import { formatDate } from '@/lib/format';
import { todayYmd } from '@/lib/dates';
import { downscaleImage } from '@/lib/utils';
import { Section } from './EmployeeDetails';
import s from './employees.module.css';

export const emptyEmployeeDraft = (companyId = '') => ({
  nombre: '', apellidos: '', dni: '', tel: '', email: '', rate: '', nightRate: '', contractHours: '',
  prl: false, companyId, locals: [], groupId: '', nss: '', iban: '', nacimiento: '', direccion: '',
  dniFront: null, dniBack: null,
});

const toText = (v) => (v == null ? '' : String(v).replace('.', ','));
export const employeeToDraft = (e) => ({
  ...e, rate: toText(e.rate), nightRate: toText(e.nightRate), contractHours: toText(e.contractHours), groupId: e.groupId || '', locals: [...e.locals],
});

export function EmployeeForm({ draft, setDraft, errors, isNew, employeeId }) {
  const { data } = useApp();
  const lk = useLookups();
  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }));
  const toggleLocal = (id) => setDraft((d) => ({ ...d, locals: d.locals.includes(id) ? d.locals.filter((x) => x !== id) : [...d.locals, id] }));

  async function pickImage(key, file) {
    if (!file) return;
    set(key)(await downscaleImage(file, DNI_IMAGE_MAX_PX));
  }

  const hireNote = isNew
    ? `La fecha de contratación se guardará automáticamente: hoy, ${formatDate(todayYmd())}.`
    : `Fecha de contratación: ${formatDate(data.employees.find((e) => e.id === employeeId)?.fechaAlta)}`;

  return (
    <div className={s.details}>
      <Section title="Datos personales">
        <Field label="Nombre *" error={errors.nombre}><TextInput value={draft.nombre} onChange={set('nombre')} /></Field>
        <Field label="Apellidos *" error={errors.apellidos}><TextInput value={draft.apellidos} onChange={set('apellidos')} /></Field>
        <Field label="DNI / NIE"><TextInput value={draft.dni} onChange={(v) => set('dni')(v.toUpperCase())} placeholder="12345678A" /></Field>
        <Field label="Fecha de nacimiento"><TextInput type="date" value={draft.nacimiento} onChange={set('nacimiento')} /></Field>
        <Field label="Teléfono"><TextInput type="tel" value={draft.tel} onChange={set('tel')} placeholder="600 000 000" /></Field>
        <Field label="Correo" error={errors.email}><TextInput type="email" value={draft.email} onChange={set('email')} placeholder="nombre@correo.com" /></Field>
        <Field label="Dirección" className={s.full}><TextInput value={draft.direccion} onChange={set('direccion')} /></Field>
      </Section>

      <Section title="Contrato">
        <Field label="Empresa *" error={errors.companyId}>
          <Select value={draft.companyId} onChange={set('companyId')} options={[{ value: '', label: 'Elige empresa…' }, ...data.companies.map((c) => ({ value: c.id, label: c.name }))]} />
        </Field>
        <Field label="Grupo">
          <Select value={draft.groupId} onChange={set('groupId')} options={[{ value: '', label: 'Sin grupo' }, ...data.groups.map((g) => ({ value: g.id, label: g.name }))]} />
        </Field>
        <Field label="€/h" error={errors.rate}><TextInput inputMode="decimal" value={draft.rate} onChange={set('rate')} placeholder="12,50" /></Field>
        <Field label="€/h nocturna (22:00–06:00)" error={errors.nightRate}><TextInput inputMode="decimal" value={draft.nightRate} onChange={set('nightRate')} placeholder="Vacío = igual que €/h" /></Field>
        <Field label="Horas de contrato / semana" error={errors.contractHours}><TextInput inputMode="decimal" value={draft.contractHours} onChange={set('contractHours')} placeholder="40" /></Field>
        <div className={s.info}>
          <span className={s.infoLabel}>PRL hecho</span>
          <Toggle checked={draft.prl} onChange={set('prl')} label={draft.prl ? 'Hecho' : 'Pendiente'} />
        </div>
        <div className={`${s.info} ${s.full}`}>
          <span className={s.infoLabel}>Locales donde trabaja</span>
          <div className={s.localChips}>
            {data.locals.map((l) => {
              const on = draft.locals.includes(l.id);
              return (
                <button key={l.id} type="button" className={`${s.localChip} ${on ? s.localChipOn : ''}`} onClick={() => toggleLocal(l.id)}>
                  <strong>{l.name}</strong>
                  <span>{lk.companies[l.companyId]?.name}</span>
                </button>
              );
            })}
            {!data.locals.length && <span className="muted">Crea locales en Configuración para poder asignarlos.</span>}
          </div>
        </div>
        <span className={`muted ${s.full}`} style={{ fontSize: 13 }}>{hireNote}</span>
      </Section>

      <Section title="Documentación">
        <Field label="Nº Seguridad Social"><TextInput value={draft.nss} onChange={set('nss')} /></Field>
        <Field label="IBAN"><TextInput value={draft.iban} onChange={(v) => set('iban')(v.toUpperCase())} placeholder="ES00 0000 0000 0000 0000 0000" /></Field>
        <div className={`${s.dniPair} ${s.full}`}>
          {[['dniFront', 'DNI anverso'], ['dniBack', 'DNI reverso']].map(([key, label]) => (
            <div key={key} className={s.info}>
              <span className={s.infoLabel}>{label}</span>
              {draft[key] ? (
                <>
                  <span className={s.dniImg} style={{ backgroundImage: `url("${draft[key]}")` }} />
                  <button type="button" className={s.smallBtn} onClick={() => set(key)(null)}>Quitar</button>
                </>
              ) : (
                <label className={s.upload}>
                  <Icon name="image" size={22} />
                  Subir foto
                  <input type="file" accept="image/*" hidden onChange={(ev) => pickImage(key, ev.target.files?.[0])} />
                </label>
              )}
            </div>
          ))}
        </div>
        <span className={`muted ${s.full}`} style={{ fontSize: 12.5 }}>Las imágenes se reducen automáticamente a baja resolución.</span>
      </Section>
    </div>
  );
}

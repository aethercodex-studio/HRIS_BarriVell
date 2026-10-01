/**
 * Read-only worker card: status, actions, hours, contract, contact and documents.
 */
import { useMemo } from 'react';
import { useApp } from '@/state/AppProvider';
import { useNav } from '@/state/NavContext';
import { useLookups } from '@/state/useLookups';
import { Alert, Avatar, Button, Pill } from '@/components/ui';
import { addDays, firstOfMonth, lastOfMonth, mondayOf, toYmd } from '@/lib/dates';
import { formatDate, formatEuro, formatHours, fullName, initials } from '@/lib/format';
import { hoursByEmployee } from '@/domain/hours';
import * as actions from '@/domain/actions';
import s from './employees.module.css';

export function EmployeeDetails({ employee: e, onEdit, onMail }) {
  const { data, update, confirm, showToast } = useApp();
  const { closeEmployee } = useNav();
  const lk = useLookups();
  const pal = lk.paletteOf(e);

  const stats = useMemo(() => {
    const now = new Date();
    const m = hoursByEmployee(data.shifts, toYmd(firstOfMonth(now)), toYmd(lastOfMonth(now)))[e.id];
    const w = hoursByEmployee(data.shifts, toYmd(mondayOf(now)), toYmd(addDays(mondayOf(now), 6)))[e.id];
    return { month: m?.total || 0, monthNight: m?.night || 0, week: w?.total || 0 };
  }, [data.shifts, e.id]);

  async function toggleActive() {
    const name = fullName(e);
    if (e.active) {
      const ok = await confirm([{ title: `¿Dar de baja a ${name}?`, text: 'Se guardará hoy como fecha de baja. Sus turnos a partir de mañana se eliminarán y dejará de aparecer en los calendarios.', label: 'Dar de baja', danger: true }]);
      if (ok) { update(actions.deactivateEmployee, e.id); showToast('Baja registrada'); }
    } else {
      const ok = await confirm([{ title: `¿Reactivar a ${name}?`, text: 'Volverá a aparecer en los calendarios. La fecha de alta pasará a ser hoy.', label: 'Reactivar' }]);
      if (ok) { update(actions.reactivateEmployee, e.id); showToast('Empleado reactivado'); }
    }
  }

  async function remove() {
    const name = fullName(e);
    const ok = await confirm([
      { title: `¿Eliminar a ${name}?`, text: 'Si solo deja de trabajar, usa «Dar de baja» para conservar el historial.', label: 'Sí, continuar', danger: true },
      { title: 'Confirma de nuevo', text: `Se borrarán la ficha, los turnos y los días libres de ${name}. No se puede deshacer.`, label: 'Eliminar definitivamente', danger: true },
    ]);
    if (ok) { closeEmployee(); update(actions.deleteEmployee, e.id); showToast('Empleado eliminado'); }
  }

  const weekPct = e.contractHours ? Math.min(100, (stats.week / e.contractHours) * 100) : 0;

  return (
    <div className={s.details}>
      <div className={s.profile}>
        <Avatar text={initials(e)} palette={pal} size={66} />
        <div className={s.profileText}>
          <h2 className={s.profileName}>{fullName(e)}</h2>
          <div className={s.mPills}>
            <Pill dot={pal.dot} style={{ background: pal.bg, color: 'var(--ink)' }}>{lk.groupName(e)}</Pill>
            <Pill tone={e.active ? 'success' : 'neutral'}>{e.active ? 'Activo' : 'Inactivo'}</Pill>
          </div>
        </div>
      </div>

      <div className="toolbar">
        <Button variant="primary" icon="pencil" onClick={onEdit}>Editar</Button>
        <Button icon="mail" onClick={onMail}>Solicitar alta a gestoría</Button>
        <Button onClick={toggleActive}>{e.active ? 'Dar de baja' : 'Reactivar'}</Button>
      </div>

      {e.active && !e.altaSolicitada && <Alert tone="info">Alta pendiente de solicitar a la gestoría.</Alert>}
      {e.nightRate == null && <Alert>Este trabajador no tiene el precio por hora nocturna informada. Mientras tanto, sus horas nocturnas se pagan a €/h normal.</Alert>}

      <div className={s.stats}>
        <Stat value={`${formatHours(stats.month)} h`} label={`este mes · ${formatHours(stats.monthNight)} h noche`} />
        <Stat value={`${formatHours(stats.week)} h`} label={e.contractHours != null ? `esta semana de ${formatHours(e.contractHours)} h de contrato` : 'esta semana'} bar={weekPct} />
        <Stat value={e.rate != null ? formatEuro(e.rate) : '—'} label={`por hora · nocturna ${e.nightRate != null ? formatEuro(e.nightRate) : 'sin informar'}`} />
      </div>

      <Section title="Contrato">
        <Info label="Empresa" value={lk.companies[e.companyId]?.name || 'Sin empresa'} />
        <Info label="Locales" value={lk.localNames(e) || 'Sin locales'} />
        <Info label="Horas de contrato" value={e.contractHours != null ? `${formatHours(e.contractHours)} h/semana` : 'Sin informar'} />
        <Info label="€/h" value={e.rate != null ? formatEuro(e.rate) : 'Sin informar'} />
        <Info label="€/h nocturna" value={e.nightRate != null ? formatEuro(e.nightRate) : 'Sin informar'} />
        <Info label="PRL" value={<Pill tone={e.prl ? 'success' : 'warning'}>{e.prl ? 'Hecho' : 'Pendiente'}</Pill>} />
        <Info label="Fecha de contratación" value={formatDate(e.fechaAlta)} />
        <Info label="Fecha de baja" value={formatDate(e.fechaBaja)} />
        {e.altaSolicitada && <Info label="Alta solicitada" value={formatDate(e.altaSolicitada)} />}
      </Section>

      <Section title="Contacto y datos personales">
        <Info label="Teléfono" value={e.tel ? <a href={`tel:${e.tel.replace(/\s/g, '')}`}>{e.tel}</a> : '—'} />
        <Info label="Correo" value={e.email ? <a href={`mailto:${e.email}`}>{e.email}</a> : '—'} />
        <Info label="Fecha de nacimiento" value={formatDate(e.nacimiento)} />
        <Info label="Dirección" value={e.direccion || '—'} />
      </Section>

      <Section title="Documentación">
        <Info label="DNI / NIE" value={e.dni || 'Sin informar'} />
        <Info label="Nº Seguridad Social" value={e.nss || '—'} />
        <Info label="IBAN" value={e.iban || '—'} />
        <div className={s.dniPair}>
          <DniImage label="Anverso" src={e.dniFront} />
          <DniImage label="Reverso" src={e.dniBack} />
        </div>
      </Section>

      <Button variant="danger" onClick={remove} style={{ alignSelf: 'flex-start' }}>Eliminar empleado</Button>
    </div>
  );
}

const Stat = ({ value, label, bar }) => (
  <div className={`card ${s.stat}`}>
    <span className={s.statValue}>{value}</span>
    <span className={s.statLabel}>{label}</span>
    {bar != null && <span className={s.bar}><span style={{ width: `${bar}%` }} /></span>}
  </div>
);

export const Section = ({ title, children }) => (
  <section className={`card ${s.section}`}>
    <h3 className={s.sectionTitle}>{title}</h3>
    <div className={s.infoGrid}>{children}</div>
  </section>
);

const Info = ({ label, value }) => (
  <div className={s.info}>
    <span className={s.infoLabel}>{label}</span>
    <span className={s.infoValue}>{value}</span>
  </div>
);

const DniImage = ({ label, src }) => (
  <div className={s.info}>
    <span className={s.infoLabel}>{label}</span>
    {src ? <span role="img" aria-label={`DNI ${label}`} className={s.dniImg} style={{ backgroundImage: `url("${src}")` }} /> : <span className={s.dniEmpty}>Sin imagen</span>}
  </div>
);

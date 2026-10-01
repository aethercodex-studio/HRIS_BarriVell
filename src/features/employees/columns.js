/**
 * Employees table column definitions. To add a column: add an entry here.
 * - sortValue: value used for sorting (numbers sort numerically)
 * - render: 'text' | 'name' | 'bool' | 'group' | 'dni'
 */
import { formatDate, formatEuro, formatHours } from '@/lib/format';

export const EMPLOYEE_COLUMNS = [
  { key: 'nombre', label: 'Nombre', width: 'minmax(170px,1.1fr)', min: 170, locked: true, render: 'name', sortValue: (e) => e.nombre },
  { key: 'apellidos', label: 'Apellidos', width: 'minmax(140px,1.2fr)', min: 140, sortValue: (e) => e.apellidos, text: (e) => e.apellidos },
  { key: 'tel', label: 'Número Tel.', width: '130px', min: 130, sortValue: (e) => e.tel, text: (e) => e.tel },
  { key: 'email', label: 'Correo', width: 'minmax(200px,1.5fr)', min: 200, sortValue: (e) => e.email, text: (e) => e.email },
  { key: 'rate', label: '€/h', width: '90px', min: 90, sortValue: (e) => e.rate ?? -1, text: (e) => (e.rate != null ? formatEuro(e.rate) : '') },
  { key: 'nightRate', label: '€/h nocturna', width: '124px', min: 124, sortValue: (e) => e.nightRate ?? -1, text: (e) => (e.nightRate != null ? formatEuro(e.nightRate) : 'Sin informar'), warn: (e) => e.nightRate == null },
  { key: 'prl', label: 'PRL Hecho', width: '110px', min: 110, render: 'bool', sortValue: (e) => (e.prl ? 1 : 0), bool: (e) => e.prl, falseTone: 'warning' },
  { key: 'active', label: 'Activo', width: '90px', min: 90, render: 'bool', sortValue: (e) => (e.active ? 1 : 0), bool: (e) => e.active, falseTone: 'neutral' },
  { key: 'dni', label: 'DNI', width: '150px', min: 150, render: 'dni', sortValue: (e) => e.dni },
  { key: 'group', label: 'Grupo', width: '170px', min: 170, render: 'group', sortValue: (e, lk) => lk.groupName(e) },
  { key: 'company', label: 'Empresa', width: '200px', min: 200, sortValue: (e, lk) => lk.companies[e.companyId]?.name || '', text: (e, lk) => lk.companies[e.companyId]?.name },
  { key: 'locals', label: 'Locales', width: '170px', min: 170, sortValue: (e, lk) => lk.localNames(e), text: (e, lk) => lk.localNames(e) },
  { key: 'contractHours', label: 'Horas contrato', width: '130px', min: 130, sortValue: (e) => e.contractHours ?? -1, text: (e) => (e.contractHours != null ? `${formatHours(e.contractHours)} h/sem` : '') },
  { key: 'monthHours', label: 'Horas este mes', width: '130px', min: 130, sortValue: (e, lk, ctx) => ctx.monthHours[e.id] || 0, text: (e, lk, ctx) => `${formatHours(ctx.monthHours[e.id] || 0)} h` },
  { key: 'fechaAlta', label: 'Fecha contratación', width: '150px', min: 150, sortValue: (e) => e.fechaAlta || '', text: (e) => (e.fechaAlta ? formatDate(e.fechaAlta) : '') },
  { key: 'fechaBaja', label: 'Fecha de baja', width: '130px', min: 130, sortValue: (e) => e.fechaBaja || '', text: (e) => (e.fechaBaja ? formatDate(e.fechaBaja) : '') },
];

/**
 * Mapping between the app model (camelCase) and the Supabase tables (snake_case).
 * If a column is renamed in the database, only this file needs to change.
 *
 * Order matters: parents first (for upserts), children last.
 * Deletions run in reverse order.
 */
export const TABLES = [
  {
    table: 'companies',
    key: 'companies',
    toRow: (c) => ({ id: c.id, name: c.name }),
    fromRow: (r) => ({ id: r.id, name: r.name }),
  },
  {
    table: 'locals',
    key: 'locals',
    toRow: (l) => ({ id: l.id, company_id: l.companyId, name: l.name }),
    fromRow: (r) => ({ id: r.id, companyId: r.company_id, name: r.name }),
  },
  {
    table: 'groups',
    key: 'groups',
    toRow: (g) => ({ id: g.id, name: g.name, color: g.color }),
    fromRow: (r) => ({ id: r.id, name: r.name, color: r.color }),
  },
  {
    table: 'employees',
    key: 'employees',
    toRow: (e) => ({
      id: e.id,
      nombre: e.nombre,
      apellidos: e.apellidos,
      dni: e.dni,
      telefono: e.tel,
      email: e.email,
      precio_hora: e.rate,
      precio_hora_nocturna: e.nightRate,
      horas_contrato: e.contractHours,
      prl_hecho: e.prl,
      activo: e.active,
      company_id: e.companyId || null,
      group_id: e.groupId || null,
      locales: e.locals,
      fecha_alta: e.fechaAlta,
      fecha_baja: e.fechaBaja,
      nss: e.nss,
      iban: e.iban,
      fecha_nacimiento: e.nacimiento || null,
      direccion: e.direccion,
      dni_anverso: e.dniFront,
      dni_reverso: e.dniBack,
      alta_solicitada: e.altaSolicitada,
    }),
    fromRow: (r) => ({
      id: r.id,
      nombre: r.nombre,
      apellidos: r.apellidos,
      dni: r.dni || '',
      tel: r.telefono || '',
      email: r.email || '',
      rate: r.precio_hora != null ? Number(r.precio_hora) : null,
      nightRate: r.precio_hora_nocturna != null ? Number(r.precio_hora_nocturna) : null,
      contractHours: r.horas_contrato != null ? Number(r.horas_contrato) : null,
      prl: !!r.prl_hecho,
      active: !!r.activo,
      companyId: r.company_id,
      groupId: r.group_id,
      locals: r.locales || [],
      fechaAlta: r.fecha_alta,
      fechaBaja: r.fecha_baja,
      nss: r.nss || '',
      iban: r.iban || '',
      nacimiento: r.fecha_nacimiento || '',
      direccion: r.direccion || '',
      dniFront: r.dni_anverso,
      dniBack: r.dni_reverso,
      altaSolicitada: r.alta_solicitada,
    }),
  },
  {
    table: 'shifts',
    key: 'shifts',
    toRow: (s) => ({ id: s.id, employee_id: s.empId, local_id: s.localId, fecha: s.date, inicio: s.start, fin: s.end }),
    fromRow: (r) => ({ id: r.id, empId: r.employee_id, localId: r.local_id, date: r.fecha, start: r.inicio, end: r.fin }),
  },
  {
    table: 'days_off',
    key: 'daysOff',
    toRow: (o) => ({ id: o.id, employee_id: o.empId, fecha: o.date }),
    fromRow: (r) => ({ id: r.id, empId: r.employee_id, date: r.fecha }),
  },
];

export const settingsToRow = (s) => ({ id: 1, gestoria_email: s.gestoriaEmail, asunto: s.subject, plantilla: s.template });
export const settingsFromRow = (r) => ({ gestoriaEmail: r.gestoria_email, subject: r.asunto, template: r.plantilla });

/**
 * Employees list: search, filters (status, company, local, group),
 * sortable columns and column picker. Desktop = table, mobile = cards.
 */
import { useMemo, useState } from 'react';
import { useApp } from '@/state/AppProvider';
import { useNav } from '@/state/NavContext';
import { useLookups } from '@/state/useLookups';
import { useIsMobile, useUiPreference } from '@/hooks';
import { Avatar, Button, EmptyState, Pill, Segmented, Select } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { DEFAULT_EMPLOYEE_COLUMNS } from '@/config/constants';
import { firstOfMonth, lastOfMonth, toYmd } from '@/lib/dates';
import { formatEuro, fullName, initials, normalizeText } from '@/lib/format';
import { hoursByEmployee } from '@/domain/hours';
import { EMPLOYEE_COLUMNS } from './columns';
import s from './employees.module.css';

export function EmployeesPage() {
  const { data } = useApp();
  const { newEmployee, openEmployee } = useNav();
  const lk = useLookups();
  const isMobile = useIsMobile();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('activos');
  const [companyId, setCompanyId] = useState('all');
  const [localId, setLocalId] = useState('all');
  const [groupId, setGroupId] = useState('all');
  const [sort, setSort] = useState({ key: 'nombre', dir: 1 });
  const [visibleCols, setVisibleCols] = useUiPreference('employeeColumns', DEFAULT_EMPLOYEE_COLUMNS);
  const [colMenu, setColMenu] = useState(false);

  // Hours scheduled this month (for the "Horas este mes" column).
  const ctx = useMemo(() => {
    const now = new Date();
    const agg = hoursByEmployee(data.shifts, toYmd(firstOfMonth(now)), toYmd(lastOfMonth(now)));
    return { monthHours: Object.fromEntries(Object.entries(agg).map(([id, a]) => [id, a.total])) };
  }, [data.shifts]);

  const counts = useMemo(() => {
    const active = data.employees.filter((e) => e.active).length;
    return { active, inactive: data.employees.length - active, all: data.employees.length };
  }, [data.employees]);

  const rows = useMemo(() => {
    const q = normalizeText(search);
    const col = EMPLOYEE_COLUMNS.find((c) => c.key === sort.key) || EMPLOYEE_COLUMNS[0];
    return data.employees
      .filter((e) => status === 'todos' || (status === 'activos' ? e.active : !e.active))
      .filter((e) => companyId === 'all' || e.companyId === companyId)
      .filter((e) => localId === 'all' || e.locals.includes(localId))
      .filter((e) => groupId === 'all' || e.groupId === groupId)
      .filter((e) => !q || normalizeText([e.nombre, e.apellidos, e.dni, e.tel, e.email].join(' ')).includes(q))
      .sort((a, b) => {
        const x = col.sortValue(a, lk, ctx);
        const y = col.sortValue(b, lk, ctx);
        const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'es', { sensitivity: 'base' });
        return (r || a.nombre.localeCompare(b.nombre, 'es')) * sort.dir;
      });
  }, [data.employees, search, status, companyId, localId, groupId, sort, lk, ctx]);

  const columns = EMPLOYEE_COLUMNS.filter((c) => visibleCols.includes(c.key));
  const toggleSort = (key) => setSort((cur) => ({ key, dir: cur.key === key ? -cur.dir : 1 }));
  const toggleColumn = (key) =>
    setVisibleCols((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : EMPLOYEE_COLUMNS.map((c) => c.key).filter((k) => k === key || cur.includes(k))));

  return (
    <div className="page" style={{ maxWidth: 1500 }}>
      <div className={s.header}>
        <div>
          <h1 className="page-title">Empleados</h1>
          <p className="page-subtitle">{counts.active} activos · {counts.inactive} inactivos</p>
        </div>
        <Button variant="primary" icon="plus" onClick={newEmployee}>Nuevo empleado</Button>
      </div>

      <div className="toolbar">
        <div className={s.search}>
          <Icon name="search" size={18} color="var(--ink-3)" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nombre, DNI, teléfono…" />
        </div>
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: 'activos', label: `Activos ${counts.active}` },
            { value: 'inactivos', label: `Inactivos ${counts.inactive}` },
            { value: 'todos', label: `Todos ${counts.all}` },
          ]}
        />
        <Select value={companyId} onChange={setCompanyId} options={[{ value: 'all', label: 'Todas las empresas' }, ...data.companies.map((c) => ({ value: c.id, label: c.name }))]} />
        <Select value={localId} onChange={setLocalId} options={[{ value: 'all', label: 'Todos los locales' }, ...data.locals.map((l) => ({ value: l.id, label: l.name }))]} />
        <Select value={groupId} onChange={setGroupId} options={[{ value: 'all', label: 'Todos los grupos' }, ...data.groups.map((g) => ({ value: g.id, label: g.name }))]} />
        {isMobile ? (
          <div className={s.mobileSort}>
            <Select value={sort.key} onChange={(key) => setSort((c) => ({ ...c, key }))} options={EMPLOYEE_COLUMNS.filter((c) => c.key !== 'dni').map((c) => ({ value: c.key, label: `Ordenar: ${c.label}` }))} />
            <Button onClick={() => setSort((c) => ({ ...c, dir: -c.dir }))}>{sort.dir === 1 ? 'A → Z' : 'Z → A'}</Button>
          </div>
        ) : (
          <div className={s.colPickerWrap}>
            <Button icon="columns" onClick={() => setColMenu((v) => !v)}>Columnas</Button>
            {colMenu && (
              <>
                <div className={s.clickAway} onClick={() => setColMenu(false)} />
                <div className={s.colMenu}>
                  <div className={s.colMenuTitle}>Columnas visibles</div>
                  {EMPLOYEE_COLUMNS.map((c) => (
                    <label key={c.key} className={s.colOption} style={c.locked ? { color: 'var(--ink-4)' } : undefined}>
                      <input type="checkbox" checked={visibleCols.includes(c.key)} disabled={c.locked} onChange={() => toggleColumn(c.key)} />
                      {c.label}
                    </label>
                  ))}
                  <Button size="sm" onClick={() => setVisibleCols(DEFAULT_EMPLOYEE_COLUMNS)} style={{ width: '100%', marginTop: 6 }}>Restablecer columnas</Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {!rows.length && <EmptyState>No hay empleados con estos filtros.</EmptyState>}

      {rows.length > 0 && !isMobile && (
        <EmployeeTable rows={rows} columns={columns} sort={sort} onSort={toggleSort} onOpen={openEmployee} lk={lk} ctx={ctx} />
      )}

      {rows.length > 0 && isMobile && (
        <div className={s.cards}>
          {rows.map((e) => (
            <button key={e.id} className={`card ${s.mCard}`} style={{ opacity: e.active ? 1 : 0.6 }} onClick={() => openEmployee(e.id)}>
              <Avatar text={initials(e)} palette={lk.paletteOf(e)} size={44} />
              <span className={s.mText}>
                <strong>{fullName(e)}</strong>
                <span className={s.mPills}>
                  <Pill dot={lk.paletteOf(e).dot} style={{ background: lk.paletteOf(e).bg, color: 'var(--ink)' }}>{lk.groupName(e)}</Pill>
                  {!e.prl && <Pill tone="warning">PRL pendiente</Pill>}
                  {!e.active && <Pill>Inactivo</Pill>}
                </span>
                <span className="muted">{e.tel || 'Sin teléfono'} · {e.rate != null ? `${formatEuro(e.rate)}/h` : 'Sin €/h'}</span>
              </span>
              <Icon name="right" color="var(--ink-4)" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EmployeeTable({ rows, columns, sort, onSort, onOpen, lk, ctx }) {
  const grid = columns.map((c) => c.width).join(' ');
  const minWidth = columns.reduce((sum, c) => sum + c.min, 0);
  return (
    <div className={`card ${s.tableCard}`}>
      <div className={s.scroll}>
        <div style={{ minWidth }}>
          <div className={s.thead} style={{ gridTemplateColumns: grid }}>
            {columns.map((c) => (
              <button key={c.key} className={s.th} style={{ color: sort.key === c.key ? 'var(--ink)' : undefined }} onClick={() => onSort(c.key)}>
                {c.label}
                <Icon name={sort.key !== c.key ? 'sort' : sort.dir === 1 ? 'up' : 'down'} size={14} color={sort.key === c.key ? 'currentColor' : '#c9c5bc'} />
              </button>
            ))}
          </div>
          {rows.map((e) => (
            <div key={e.id} className={s.tr} style={{ gridTemplateColumns: grid, opacity: e.active ? 1 : 0.6 }} onClick={() => onOpen(e.id)}>
              {columns.map((c) => (
                <div key={c.key} className={s.td}>
                  <Cell column={c} employee={e} lk={lk} ctx={ctx} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Cell({ column: c, employee: e, lk, ctx }) {
  const pal = lk.paletteOf(e);
  switch (c.render) {
    case 'name':
      return (
        <span className={s.nameCell}>
          <Avatar text={initials(e)} palette={pal} size={32} />
          <span className={s.nameLink}>{e.nombre}</span>
        </span>
      );
    case 'bool':
      return c.bool(e) ? <Pill tone="success">Sí</Pill> : <Pill tone={c.falseTone}>No</Pill>;
    case 'group':
      return <Pill dot={pal.dot} style={{ background: pal.bg, color: 'var(--ink)' }}>{lk.groupName(e)}</Pill>;
    case 'dni':
      return (
        <span className={s.dniCell}>
          {e.dniFront && <span className={s.dniThumb} style={{ backgroundImage: `url("${e.dniFront}")` }} />}
          {e.dni || '—'}
        </span>
      );
    default: {
      const text = c.text(e, lk, ctx);
      return <span style={{ color: c.warn?.(e) ? 'var(--warning-ink)' : text ? undefined : 'var(--ink-4)' }}>{text || '—'}</span>;
    }
  }
}

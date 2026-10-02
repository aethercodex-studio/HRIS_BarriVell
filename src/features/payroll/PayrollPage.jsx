/**
 * Horas y nóminas: hours and gross amount per worker for a week or a month.
 *  - Filter by local (pills, like the calendar) and company.
 *  - The user types the "Importe nómina"; "Fuera de nómina" = Importe total − Importe nómina.
 *  - Sortable columns (desktop). CSV export.
 * Days off are not paid: only scheduled hours count.
 */
import { useMemo, useState } from 'react';
import { useApp } from '@/state/AppProvider';
import { useNav } from '@/state/NavContext';
import { useLookups } from '@/state/useLookups';
import { useIsMobile } from '@/hooks';
import { Alert, Avatar, Button, EmptyState, IconButton, Segmented, Select } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { addDays, firstOfMonth, isoWeek, lastOfMonth, MONTHS, mondayOf, monthLabel, parseYmd, toYmd, weekRangeLabel } from '@/lib/dates';
import { formatEuro, formatHours, fullName, initials, parseDecimal } from '@/lib/format';
import { downloadCsv } from '@/lib/utils';
import { buildPayroll } from '@/domain/payroll';
import * as actions from '@/domain/actions';
import s from './payroll.module.css';

const COLUMNS = [
  { key: 'name', label: 'Trabajador', align: 'left' },
  { key: 'day', label: 'Horas día' },
  { key: 'night', label: 'Horas noche' },
  { key: 'total', label: 'Total vs contrato', align: 'left', indent: true },
  { key: 'rate', label: '€/h · nocturna' },
  { key: 'nomina', label: 'Importe nómina' },
  { key: 'fuera', label: 'Fuera de nómina' },
  { key: 'cost', label: 'Importe total' },
];

export function PayrollPage() {
  const { data, update } = useApp();
  const { openEmployee } = useNav();
  const lk = useLookups();
  const isMobile = useIsMobile();
  const [period, setPeriod] = useState('semana');
  const [weekStart, setWeekStart] = useState(() => toYmd(mondayOf(new Date())));
  const [month, setMonth] = useState(() => toYmd(firstOfMonth(new Date())));
  const [companyId, setCompanyId] = useState('all');
  const [localId, setLocalId] = useState('all');
  const [sort, setSort] = useState({ key: 'name', dir: 1 });

  const range = useMemo(() => {
    if (period === 'semana') {
      const ws = parseYmd(weekStart);
      return { from: weekStart, to: toYmd(addDays(ws, 6)), days: 7, label: weekRangeLabel(ws), file: `semana${isoWeek(ws)}_${ws.getFullYear()}` };
    }
    const m = parseYmd(month);
    const last = lastOfMonth(m);
    return { from: toYmd(firstOfMonth(m)), to: toYmd(last), days: last.getDate(), label: monthLabel(m), file: `${MONTHS[m.getMonth()]}_${m.getFullYear()}` };
  }, [period, weekStart, month]);

  const report = useMemo(() => buildPayroll(data, { ...range, companyId, localId, sort }), [data, range, companyId, localId, sort]);
  const missingNight = report.groups.flatMap((g) => g.rows.filter((r) => r.missingNightRate).map((r) => r.employee));

  const move = (n) => {
    if (period === 'semana') setWeekStart(toYmd(addDays(parseYmd(weekStart), 7 * n)));
    else {
      const m = parseYmd(month);
      setMonth(toYmd(new Date(m.getFullYear(), m.getMonth() + n, 1)));
    }
  };

  /** Saves the typed nómina. Empty or invalid → cleared. */
  const setNomina = (empId, text) => {
    const n = parseDecimal(text);
    update(actions.setNomina, empId, range.from, range.to, n == null || Number.isNaN(n) ? null : n);
  };

  const toggleSort = (key) => setSort((cur) => ({ key, dir: cur.key === key ? -cur.dir : key === 'name' ? 1 : -1 }));

  function exportCsv() {
    const r2 = (n) => formatHours(Math.round(n * 100) / 100);
    const header = ['Empresa', 'Trabajador', 'Grupo', 'Horas diurnas', 'Horas nocturnas', 'Horas totales', 'Horas contrato', '€/h', '€/h nocturna', 'Importe nómina', 'Fuera de nómina', 'Importe total'];
    const rows = report.groups.flatMap((g) =>
      g.rows.map((r) => {
        const e = r.employee;
        return [g.company.name, fullName(e), lk.groupName(e), r2(r.dayHours), r2(r.nightHours), r2(r.totalHours), r.contract != null ? r2(r.contract) : '', e.rate != null ? r2(e.rate) : '', e.nightRate != null ? r2(e.nightRate) : '', r.nomina != null ? r2(r.nomina) : '', r.fuera != null ? r2(r.fuera) : '', r2(r.cost)];
      }),
    );
    downloadCsv(header, rows, `horas_${range.file}.csv`);
  }

  const t = report.totals;
  const localPills = [
    { id: 'all', name: 'Todos', count: data.employees.filter((e) => e.active).length },
    ...data.locals.map((l) => ({ id: l.id, name: l.name, count: data.employees.filter((e) => e.active && e.locals.includes(l.id)).length })),
  ];

  return (
    <div className="page" style={{ maxWidth: 1400 }}>
      <div>
        <h1 className="page-title">Horas y nóminas</h1>
        <p className="page-subtitle">Horas asignadas en el calendario e importe bruto por trabajador. Los días libres no se pagan.</p>
      </div>

      <div className={s.localsWrap}>
        <span className={s.eyebrow}>Local</span>
        <div className={s.locals}>
          {localPills.map((l) => (
            <button key={l.id} className={`${s.localPill} ${localId === l.id ? s.localOn : ''}`} onClick={() => setLocalId(l.id)}>
              {l.name}
              <span className={s.count}>{l.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar">
        <Segmented value={period} onChange={setPeriod} options={[{ value: 'semana', label: 'Semana' }, { value: 'mes', label: 'Mes' }]} />
        <div className={s.nav}>
          <IconButton icon="left" label="Anterior" onClick={() => move(-1)} className={s.navBtn} />
          <Button size="sm" onClick={() => { setWeekStart(toYmd(mondayOf(new Date()))); setMonth(toYmd(firstOfMonth(new Date()))); }}>Actual</Button>
          <IconButton icon="right" label="Siguiente" onClick={() => move(1)} className={s.navBtn} />
        </div>
        <strong>{range.label}</strong>
        <div className={s.right}>
          <Select value={companyId} onChange={setCompanyId} options={[{ value: 'all', label: 'Todas las empresas' }, ...data.companies.map((c) => ({ value: c.id, label: c.name }))]} />
          <Button icon="download" onClick={exportCsv}>Exportar Excel (CSV)</Button>
        </div>
      </div>

      <div className={s.stats}>
        <div className={`${s.stat} ${s.statDark}`}><span>Total a pagar (bruto)</span><strong>{formatEuro(t.cost)}</strong></div>
        <div className={`card ${s.stat}`}><span>Importe nómina</span><strong>{formatEuro(t.nomina)}</strong><small>{t.filled} de {t.count} nóminas introducidas</small></div>
        <div className={`card ${s.stat}`}><span>Fuera de nómina</span><strong style={{ color: 'var(--warning-ink)' }}>{formatEuro(t.fuera)}</strong><small>Importe total − importe nómina</small></div>
        <div className={`card ${s.stat}`}><span>Horas totales</span><strong>{formatHours(t.totalHours)} h</strong><small>{formatHours(t.totalHours - t.nightHours)} h día · {formatHours(t.nightHours)} h noche</small></div>
      </div>

      {missingNight.length > 0 && (
        <Alert>
          Este trabajador no tiene el precio por hora nocturna informada. Sus horas nocturnas se calculan a €/h normal.
          <div className={s.links}>
            {missingNight.map((e) => <Button key={e.id} size="sm" onClick={() => openEmployee(e.id)}>{fullName(e)} · abrir ficha</Button>)}
          </div>
        </Alert>
      )}

      {!report.groups.length && <EmptyState>No hay trabajadores en este periodo.</EmptyState>}

      {report.groups.map((g) => (
        <section key={g.company.id ?? 'none'} className={`card ${s.group}`}>
          <header className={s.groupHead}>
            <div>
              <h2 style={{ fontSize: 19 }}>{g.company.name}</h2>
              <span className="muted" style={{ fontSize: 13 }}>{formatHours(g.subtotal.totalHours)} h · {formatHours(g.subtotal.nightHours)} h noche</span>
            </div>
            <div className={s.groupTotal}>
              <strong>{formatEuro(g.subtotal.cost)}</strong>
              <span className="muted">Nómina {formatEuro(g.subtotal.nomina)} · Fuera {formatEuro(g.subtotal.fuera)}</span>
            </div>
          </header>

          {isMobile ? (
            g.rows.map((r) => <MobileRow key={r.employee.id} r={r} lk={lk} onOpen={openEmployee} onNomina={setNomina} />)
          ) : (
            <div className={s.scroll}>
              <div className={s.table}>
                <div className={`${s.row} ${s.head}`}>
                  {COLUMNS.map((c) => {
                    const on = sort.key === c.key;
                    return (
                      <button key={c.key} className={`${s.th} ${c.align === 'left' ? s.thLeft : ''} ${c.indent ? s.left : ''}`} style={{ color: on ? 'var(--ink)' : undefined }} onClick={() => toggleSort(c.key)}>
                        {c.label}
                        <Icon name={!on ? 'sort' : sort.dir === 1 ? 'up' : 'down'} size={13} color={on ? 'currentColor' : '#c9c5bc'} />
                      </button>
                    );
                  })}
                </div>
                {g.rows.map((r) => <DesktopRow key={r.employee.id} r={r} lk={lk} onOpen={openEmployee} onNomina={setNomina} />)}
              </div>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

const contractText = (r) => (r.contract != null ? `de ${formatHours(r.contract)} h` : 'sin contrato');
const overText = (r) => (r.contract == null ? 'Sin horas de contrato' : r.overContract > 0 ? `${formatHours(r.overContract)} h por encima del contrato` : 'Dentro del contrato');
const pct = (r) => (r.contract ? Math.min(100, (r.totalHours / r.contract) * 100) : 0);
const fueraColor = (r) => (r.fuera != null && r.fuera > 0.004 ? 'var(--warning-ink)' : 'var(--ink-4)');

/** Text input for the nómina. Keeps what the user types until blur, then saves. */
function NominaInput({ r, onNomina, width = 106 }) {
  const [text, setText] = useState(null);
  const shown = text ?? (r.nomina != null ? String(r.nomina).replace('.', ',') : '');
  return (
    <input
      className={s.nominaInput}
      style={{ width }}
      inputMode="decimal"
      placeholder="0,00"
      aria-label="Importe nómina"
      value={shown}
      onClick={(ev) => ev.stopPropagation()}
      onChange={(ev) => setText(ev.target.value)}
      onBlur={() => {
        if (text != null) onNomina(r.employee.id, text);
        setText(null);
      }}
      onKeyDown={(ev) => ev.key === 'Enter' && ev.currentTarget.blur()}
    />
  );
}

function DesktopRow({ r, lk, onOpen, onNomina }) {
  const e = r.employee;
  return (
    <div className={s.row} onClick={() => onOpen(e.id)} style={{ cursor: 'pointer', opacity: e.active ? 1 : 0.6 }}>
      <span className={s.who}>
        <Avatar text={initials(e)} palette={lk.paletteOf(e)} size={32} />
        <span className={s.whoText}><strong>{fullName(e)}</strong><small className="muted">{lk.groupName(e)} · {r.daysWorked === 1 ? '1 día' : `${r.daysWorked} días`}</small></span>
      </span>
      <span>{formatHours(r.dayHours)} h</span>
      <span className={s.strong}>{r.missingNightRate && <Icon name="alert" size={14} strokeWidth={2.4} color="var(--warning-ink)" />}{formatHours(r.nightHours)} h</span>
      <span className={s.contract}>
        <span><strong>{formatHours(r.totalHours)} h</strong> <small className="muted">{contractText(r)}</small></span>
        <span className={s.bar}><span style={{ width: `${pct(r)}%`, background: r.overContract > 0 ? 'var(--orange)' : 'var(--teal)' }} /></span>
        <small className="muted">{overText(r)}</small>
      </span>
      <span className={s.rates}>{e.rate != null ? formatEuro(e.rate) : 'Sin €/h'}<small>{e.nightRate != null ? formatEuro(e.nightRate) : '= €/h normal'}</small></span>
      <span className={s.end}><NominaInput r={r} onNomina={onNomina} /></span>
      <span className={s.strong} style={{ color: fueraColor(r) }}>{r.fuera != null ? formatEuro(r.fuera) : '—'}</span>
      <span className={s.total}>{formatEuro(r.cost)}</span>
    </div>
  );
}

function MobileRow({ r, lk, onOpen, onNomina }) {
  const e = r.employee;
  return (
    <div className={s.mRow} onClick={() => onOpen(e.id)}>
      <span className={s.mTop}>
        <Avatar text={initials(e)} palette={lk.paletteOf(e)} size={34} />
        <strong className={s.mName}>{fullName(e)}</strong>
        <strong>{formatEuro(r.cost)}</strong>
      </span>
      <span style={{ fontSize: 13.5 }}>{formatHours(r.dayHours)} h día · {formatHours(r.nightHours)} h noche · {formatHours(r.totalHours)} h {contractText(r)}</span>
      <span className={s.bar}><span style={{ width: `${pct(r)}%`, background: r.overContract > 0 ? 'var(--orange)' : 'var(--teal)' }} /></span>
      <span className={s.mNomina}>
        <label onClick={(ev) => ev.stopPropagation()}>Nómina <NominaInput r={r} onNomina={onNomina} width={110} /></label>
        <span style={{ color: fueraColor(r) }}>Fuera <strong>{r.fuera != null ? formatEuro(r.fuera) : '—'}</strong></span>
      </span>
      <small className="muted">{overText(r)}</small>
    </div>
  );
}

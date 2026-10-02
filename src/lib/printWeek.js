/**
 * Printable week (one row per worker, Monday → Sunday). Compact layout:
 * only the week and dates on top, plain times, no totals column.
 * Rendered into a hidden iframe and sent to the browser print dialog,
 * so no extra library is needed. Page: A4 landscape.
 */
import { addDays, isoWeek, MONTHS_SHORT, parseYmd, weekDates } from '@/lib/dates';
import { formatDate, formatHours } from '@/lib/format';
import { shiftHours, toMinutes } from '@/lib/time';
import { groupPalette } from '@/lib/colors';

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const hhmm = (h) => {
  const m = Math.round(h * 60);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
};

export function printWeek(data, localId, weekStartYmd) {
  const local = data.locals.find((l) => l.id === localId);
  if (!local) return;
  const ws = parseYmd(weekStartYmd);
  const we = addDays(ws, 6);
  const dates = weekDates(ws);
  const groupIndex = Object.fromEntries(data.groups.map((g, i) => [g.id, i]));
  const groupsById = Object.fromEntries(data.groups.map((g) => [g.id, g]));

  const workers = data.employees
    .filter((e) => e.active && e.locals.includes(localId))
    .sort((a, b) => (groupIndex[a.groupId] ?? 99) - (groupIndex[b.groupId] ?? 99) || a.nombre.localeCompare(b.nombre, 'es'));

  const perDay = dates.map(() => ({ hours: 0, people: new Set() }));
  let grandTotal = 0;

  const rows = workers
    .map((e) => {
      const group = groupsById[e.groupId];
      const pal = groupPalette(group?.color);
      let total = 0;
      let night = 0;
      const cells = dates.map((date, i) => {
        const shifts = data.shifts
          .filter((s) => s.empId === e.id && s.date === date && s.localId === localId)
          .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
        const off = data.daysOff.some((o) => o.empId === e.id && o.date === date);
        if (!shifts.length) return off ? '<td class="off">Libre</td>' : '<td></td>';
        const chips = shifts
          .map((s) => {
            const h = shiftHours(s.start, s.end);
            total += h.total;
            night += h.night;
            perDay[i].hours += h.total;
            perDay[i].people.add(e.id);
            return `<div class="sh">${s.start} – ${s.end}${h.night > 0 ? ' ☾' : ''}</div>`;
          })
          .join('');
        return `<td>${chips}</td>`;
      });
      grandTotal += total;
      return `<tr><td class="name"><i style="background:${pal.dot}"></i>${esc(`${e.nombre} ${e.apellidos}`)}</td>${cells.join('')}</tr>`;
    })
    .join('');

  const header = dates
    .map((d, i) => `<th>${DAY_NAMES[i]}<span>${parseYmd(d).getDate()}/${parseYmd(d).getMonth() + 1}</span></th>`)
    .join('');
  const footer = `<tr class="foot"><td class="name">Total del día</td>${perDay
    .map((t) => `<td>${t.people.size} pers.<br><b>${hhmm(t.hours)} h</b></td>`)
    .join('')}</tr>`;

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>${esc(local.name)} · Semana ${isoWeek(ws)}</title>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700&family=Figtree:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>${PRINT_CSS}</style></head><body>
<header>Semana ${isoWeek(ws)} · ${ws.getDate()} ${MONTHS_SHORT[ws.getMonth()]} – ${we.getDate()} ${MONTHS_SHORT[we.getMonth()]} ${we.getFullYear()}</header>
<table><thead><tr><th class="c-name">Trabajador/a</th>${header}</tr></thead>
<tbody>${rows || '<tr><td colspan="8">Sin trabajadores asignados</td></tr>'}${footer}</tbody></table>
<div class="legend">☾ turno con horas nocturnas (22:00–06:00) · Libre = día libre</div></body></html>`;

  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(frame);
  const doc = frame.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  const ready = doc.fonts?.ready ?? Promise.resolve();
  ready.then(() =>
    setTimeout(() => {
      frame.contentWindow.focus();
      frame.contentWindow.print();
      setTimeout(() => frame.remove(), 60_000);
    }, 150),
  );
}

const PRINT_CSS = `
@page{size:A4 landscape;margin:10mm}*{box-sizing:border-box}
body{margin:0;font-family:Figtree,system-ui,sans-serif;color:#16181a;-webkit-print-color-adjust:exact;print-color-adjust:exact}
header{margin-bottom:6px;font-size:11pt;font-weight:800}
table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:9.5pt}
th,td{border:1px solid #c9c5bc;padding:2px 4px;vertical-align:middle;text-align:center}
th{background:#16181a;color:#fff;font-weight:800}th span{display:block;font-weight:600;font-size:8pt;color:#c9c5bc}
.c-name{width:20%;text-align:left}
.name{text-align:left;font-weight:700;background:#faf9f6}
.name i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;vertical-align:middle}
.name small,.tot small{display:block;font-weight:600;font-size:7.5pt;color:#6b6f73}
.sh{line-height:1.3;font-weight:700;white-space:nowrap}
.off{background:#f4efe6;font-weight:800;color:#6b6f73}.tot{font-weight:800;font-size:11pt;background:#fff7c2}
tr{break-inside:avoid}.foot td{background:#efece5;font-size:8.5pt}.foot .tot{background:#ffe94d}
.legend{margin-top:8px;font-size:8pt;color:#6b6f73}`;

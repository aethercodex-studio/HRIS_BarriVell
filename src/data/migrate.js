/**
 * Data migrations. Bring stored data (localStorage or old exports) up to the
 * current shape. Each step is idempotent; bump DATA_VERSION when adding one.
 */
import { DEFAULT_SETTINGS } from '@/config/constants';

export const DATA_VERSION = 3;

export function migrate(data) {
  const d = data;
  d.files ||= [];
  d.nominas ||= [];
  d.settings = { ...DEFAULT_SETTINGS, ...(d.settings || {}) };

  if ((d.v || 0) < 3) {
    // v3 — only two groups (Camarero, Cocinero); kitchen roles → Cocinero, the rest → Camarero.
    const ensure = (id, name, color) => {
      if (!d.groups.some((g) => g.id === id)) d.groups.push({ id, name, color });
    };
    ensure('g2', 'Camarero', 0);
    ensure('g3', 'Cocinero', 1);
    const kitchen = new Set(d.groups.filter((g) => /cocin/i.test(g.name)).map((g) => g.id));
    d.employees.forEach((e) => {
      if (!['g2', 'g3'].includes(e.groupId)) e.groupId = kitchen.has(e.groupId) ? 'g3' : 'g2';
      // v3 — night rate defaults to the normal rate.
      if (e.nightRate == null && e.rate != null) e.nightRate = e.rate;
    });
    d.groups = d.groups.filter((g) => g.id === 'g2' || g.id === 'g3');
  }

  d.v = DATA_VERSION;
  return d;
}

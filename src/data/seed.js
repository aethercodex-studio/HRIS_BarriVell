/**
 * Demo data for the localStorage mode: 2 companies, 3 locals, 5 groups and a
 * handful of workers with weekly patterns around the current date.
 * Delete or replace freely — production data comes from Supabase.
 */
import { DEFAULT_SETTINGS } from '@/config/constants';
import { addDays, mondayOf, toYmd, todayYmd, weekdayIndex } from '@/lib/dates';
import { uid } from '@/lib/utils';

const L = 'LIBRE';

const employee = (id, nombre, apellidos, extra) => ({
  id, nombre, apellidos,
  dni: '', tel: '', email: '', rate: null, nightRate: null, contractHours: null,
  prl: false, active: true, companyId: 'c1', locals: [], groupId: null,
  fechaAlta: '2025-01-01', fechaBaja: null, nss: '', iban: '', nacimiento: '', direccion: '',
  dniFront: null, dniBack: null, altaSolicitada: '2025-01-01',
  ...extra,
});

/** Weekly patterns, Monday → Sunday. Each day: 'LIBRE' or [[localId, start, end], …] */
const PATTERNS = {
  e1: [[['l1', '12:00', '16:00'], ['l1', '19:00', '23:00']], [['l2', '10:00', '14:00'], ['l2', '18:00', '22:00']], L, [['l1', '12:00', '16:00'], ['l1', '19:00', '23:00']], [['l2', '12:00', '16:00'], ['l1', '20:00', '00:00']], [['l1', '12:00', '16:00'], ['l1', '20:00', '00:00']], L],
  e2: [L, L, [['l1', '12:00', '14:00']], [['l1', '12:00', '16:00']], [['l1', '22:00', '02:00']], [['l1', '12:00', '14:00'], ['l1', '22:00', '02:00']], [['l1', '12:00', '16:00']]],
  e3: [L, [['l2', '12:00', '17:00']], [['l2', '12:00', '17:00']], [['l2', '12:00', '17:00']], [['l2', '12:00', '16:00'], ['l2', '20:00', '23:00']], [['l2', '13:00', '17:00'], ['l2', '19:00', '23:00']], L],
  e4: [L, ...Array(5).fill([['l2', '11:00', '16:00'], ['l2', '19:30', '22:30']]), L],
  e5: [L, L, ...Array(5).fill([['l1', '11:00', '16:00'], ['l1', '19:00', '22:00']])],
  e6: [L, L, [['l3', '19:00', '23:00']], [['l3', '19:00', '00:00']], [['l3', '19:00', '01:00']], [['l3', '19:00', '01:00']], [['l3', '12:00', '16:00']]],
  e7: [L, L, ...Array(5).fill([['l3', '12:00', '16:00'], ['l3', '19:00', '23:00']])],
  e8: [[['l3', '10:00', '14:00']], [['l3', '10:00', '16:00']], L, [['l3', '16:00', '00:00']], [['l3', '16:00', '00:00']], [['l3', '18:00', '02:00']], [['l3', '12:00', '18:00']]],
};

export function createSeedData() {
  const companies = [{ id: 'c1', name: 'TrescientascuarentaSL' }, { id: 'c2', name: 'Valadri24SL' }];
  const locals = [
    { id: 'l1', companyId: 'c1', name: 'Vermuteria' },
    { id: 'l2', companyId: 'c1', name: 'Lola' },
    { id: 'l3', companyId: 'c2', name: 'River' },
  ];
  const groups = [
    { id: 'g1', name: 'Encargado', color: 3 },
    { id: 'g2', name: 'Camarero', color: 0 },
    { id: 'g3', name: 'Cocinero', color: 1 },
    { id: 'g4', name: 'Jefe de cocina', color: 2 },
    { id: 'g5', name: 'Ayudante de cocina', color: 4 },
  ];
  const employees = [
    employee('e1', 'Martí', 'Puig Soler', { dni: '47812345K', tel: '612 345 678', email: 'marti.puig@gmail.com', rate: 14, nightRate: 16.5, contractHours: 40, prl: true, locals: ['l1', 'l2'], groupId: 'g1' }),
    employee('e2', 'Joan', 'Ferrer Vidal', { dni: '40398765T', tel: '634 112 908', email: 'joanferrer@hotmail.com', rate: 11.5, contractHours: 20, prl: true, locals: ['l1'], groupId: 'g2' }),
    employee('e3', 'Miriam', 'Costa Roca', { dni: '41234567R', tel: '655 870 221', rate: 11.5, nightRate: 13.5, contractHours: 30, locals: ['l2'], groupId: 'g2' }),
    employee('e4', 'Laia', 'Serra Bosch', { dni: '40987123M', tel: '622 450 017', rate: 12.5, nightRate: 14.5, contractHours: 40, prl: true, locals: ['l2'], groupId: 'g3' }),
    employee('e5', 'Pau', 'Riera Font', { dni: '45671234B', tel: '690 334 552', rate: 15, nightRate: 17.5, contractHours: 40, prl: true, locals: ['l1'], groupId: 'g4' }),
    employee('e6', 'Núria', 'Vila Mas', { dni: '41876543L', tel: '611 908 334', rate: 11, nightRate: 13, contractHours: 25, prl: true, companyId: 'c2', locals: ['l3'], groupId: 'g2', fechaAlta: todayYmd(), altaSolicitada: null }),
    employee('e7', 'Arnau', 'Comas Pujol', { dni: '40112233H', tel: '644 221 876', rate: 12, nightRate: 14, contractHours: 40, companyId: 'c2', locals: ['l3'], groupId: 'g3' }),
    employee('e8', 'Carla', 'Prats Gil', { dni: '47223344D', tel: '678 554 120', rate: 14, nightRate: 16, contractHours: 40, prl: true, companyId: 'c2', locals: ['l3'], groupId: 'g1' }),
    employee('e9', 'Oriol', 'Batlle Coll', { rate: 11, nightRate: 13, contractHours: 20, prl: true, active: false, companyId: 'c2', locals: ['l3'], groupId: 'g2', fechaBaja: '2026-08-31' }),
  ];

  // Generate shifts for 5 weeks before and 6 weeks after the current week.
  const shifts = [];
  const daysOff = [];
  const start = addDays(mondayOf(new Date()), -35);
  for (let i = 0; i < 77; i++) {
    const day = addDays(start, i);
    const date = toYmd(day);
    const wd = weekdayIndex(day);
    for (const [empId, pattern] of Object.entries(PATTERNS)) {
      const p = pattern[wd];
      if (p === L) daysOff.push({ id: uid('o'), empId, date });
      else p.forEach(([localId, s, e]) => shifts.push({ id: uid('s'), empId, localId, date, start: s, end: e }));
    }
  }

  return { companies, locals, groups, employees, shifts, daysOff, settings: { ...DEFAULT_SETTINGS } };
}

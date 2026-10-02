-- ═══════════════════════════════════════════════════════════════════════════
-- HRIS Barri Vell · Importación de datos desde "HORARIOS Y PRECIO HORA.docx"
--
-- Ejecuta ANTES supabase/schema.sql. Luego pega este archivo en SQL Editor → Run.
-- Se puede volver a ejecutar: actualiza los trabajadores y vuelve a crear los turnos importados.
--
-- ⚠ REVISA ESTAS FECHAS antes de ejecutar (lunes de cada semana del documento):
--   · River, "OCTUBRE 2026 · SEMANA 4" (camareros)  → lunes 2026-10-19
--   · River, "SEMANA 1" (cocineros)                 → lunes 2026-09-28
--     (se cuenta como semana 1 la que contiene el 1 de octubre; si para vosotros la
--      semana 1 empieza el lunes 5, usa 2026-10-26 y 2026-10-05)
--   · Vermuteria, "SEMANA 6" (sin mes ni año)       → lunes 2026-02-02 (semana ISO 6 de 2026)
--
-- Notas:
--   · Grupos: los de la tabla "COCINEROS RIVER" (Djiby, Ayoub, Dolors) entran como Cocinero; el resto, Camarero.
--   · Hay dos "Judit" en Vermuteria (8,50 €/h y 8 €/h): la segunda se crea con apellidos "(2)".
--   · Sin €/h en el documento: Maria (River), Selene (River), Alexia (River), Albert (River), Berta (River), Ayoub (River), Dolors (River).
--   · Sin turnos esa semana (se crean igualmente): Martí Homsi, Jan, Felipe, Berta, Dolors, Damaris, Jana, Grau, Andrea, Wendy, Sandra.
--   · €/h nocturna = €/h (regla por defecto).
--   · Salidas "24:00", "24:30" y "26:30" se guardan como 00:00, 00:30 y 02:30 (el turno termina al día siguiente).
--   · Apellidos, DNI, teléfono y horas de contrato no estaban en el documento: complétalos en la app.
--   · Si ya ejecutaste la importación anterior (Vermuteria.docx), los trabajadores importados que ya
--     no aparecen se eliminan (con sus turnos). Los creados a mano en la app no se tocan.
-- ═══════════════════════════════════════════════════════════════════════════

do $$
declare
  semana_river_camareros date := '2026-09-19';
  semana_river_cocineros date := '2026-09-28';
  semana_vermuteria      date := '2026-09-02';
begin

-- ── Limpia la importación anterior ─────────────────────────────────────────
delete from shifts where id like 'imp-%';
delete from employees where id ~ '^(v|r)[0-9]{2}$' and id not in ('r01', 'r02', 'r03', 'r04', 'r05', 'r06', 'r07', 'r08', 'r09', 'r10', 'r11', 'r12', 'r13', 'r14', 'r15', 'r16', 'r17', 'r18', 'r19', 'r20', 'r21', 'r22', 'r23', 'r24', 'r25', 'v01', 'v02', 'v03', 'v04', 'v05', 'v06', 'v07', 'v08', 'v09', 'v10', 'v11', 'v12', 'v13', 'v14', 'v15', 'v16');

-- ── Trabajadores ───────────────────────────────────────────────────────────
insert into employees (id, nombre, apellidos, precio_hora, precio_hora_nocturna, company_id, group_id, locales, fecha_alta, alta_solicitada) values
  ('r01', 'Olivia', '', 8.5, 8.5, 'c2', 'g2', array['l3'], current_date, current_date),
  ('r02', 'Martí Homsi', '', 9, 9, 'c2', 'g2', array['l3'], current_date, current_date),
  ('r03', 'Yasna', '', 9.2, 9.2, 'c2', 'g2', array['l3'], current_date, current_date),
  ('r04', 'Jan', '', 9.2, 9.2, 'c2', 'g2', array['l3'], current_date, current_date),
  ('r05', 'Bet', '', 8.5, 8.5, 'c2', 'g2', array['l3'], current_date, current_date),
  ('r06', 'Clàudia', '', 8.5, 8.5, 'c2', 'g2', array['l3'], current_date, current_date),
  ('r07', 'Anna', '', 8.5, 8.5, 'c2', 'g2', array['l3'], current_date, current_date),
  ('r08', 'Gian Luca', '', 8.5, 8.5, 'c2', 'g2', array['l3'], current_date, current_date),
  ('r09', 'Eva', '', 8, 8, 'c2', 'g2', array['l3'], current_date, current_date),
  ('r10', 'Benjamí', '', 8, 8, 'c2', 'g2', array['l3'], current_date, current_date),
  ('r11', 'Emma', '', 8, 8, 'c2', 'g2', array['l3'], current_date, current_date),
  ('r12', 'Santi', '', 8.5, 8.5, 'c2', 'g2', array['l3'], current_date, current_date),
  ('r13', 'Felipe', '', 8, 8, 'c2', 'g2', array['l3'], current_date, current_date),
  ('r14', 'Maria', '', null, null, 'c2', 'g2', array['l3'], current_date, current_date),
  ('r15', 'Geri', '', 8.5, 8.5, 'c2', 'g2', array['l3'], current_date, current_date),
  ('r16', 'Selene', '', null, null, 'c2', 'g2', array['l3'], current_date, current_date),
  ('r17', 'Alexia', '', null, null, 'c2', 'g2', array['l3'], current_date, current_date),
  ('r18', 'Albert', '', null, null, 'c2', 'g2', array['l3'], current_date, current_date),
  ('r19', 'Berta', '', null, null, 'c2', 'g2', array['l3'], current_date, current_date),
  ('r20', 'Djiby', '', 9, 9, 'c2', 'g3', array['l3'], current_date, current_date),
  ('r21', 'Ayoub', '', null, null, 'c2', 'g3', array['l3'], current_date, current_date),
  ('r22', 'Dolors', '', null, null, 'c2', 'g3', array['l3'], current_date, current_date),
  ('r23', 'Damaris', '', 9.2, 9.2, 'c2', 'g2', array['l3'], current_date, current_date),
  ('r24', 'Jana', '', 8.5, 8.5, 'c2', 'g2', array['l3'], current_date, current_date),
  ('r25', 'Grau', '', 8, 8, 'c2', 'g2', array['l3'], current_date, current_date),
  ('v01', 'Anna', '', 8, 8, 'c1', 'g2', array['l1'], current_date, current_date),
  ('v02', 'Christian', '', 9, 9, 'c1', 'g2', array['l1'], current_date, current_date),
  ('v03', 'Judit', '', 8.5, 8.5, 'c1', 'g2', array['l1'], current_date, current_date),
  ('v04', 'Paula', '', 8.5, 8.5, 'c1', 'g2', array['l1'], current_date, current_date),
  ('v05', 'Roger', '', 8, 8, 'c1', 'g2', array['l1'], current_date, current_date),
  ('v06', 'Alba', '', 8, 8, 'c1', 'g2', array['l1'], current_date, current_date),
  ('v07', 'Denís', '', 9, 9, 'c1', 'g2', array['l1'], current_date, current_date),
  ('v08', 'Eloi', '', 8, 8, 'c1', 'g2', array['l1'], current_date, current_date),
  ('v09', 'Eugènia', '', 9, 9, 'c1', 'g2', array['l1'], current_date, current_date),
  ('v10', 'Judit', '(2)', 8, 8, 'c1', 'g2', array['l1'], current_date, current_date),
  ('v11', 'Mar', '', 8, 8, 'c1', 'g2', array['l1'], current_date, current_date),
  ('v12', 'Julia', '', 8, 8, 'c1', 'g2', array['l1'], current_date, current_date),
  ('v13', 'Andrea', '', 8, 8, 'c1', 'g2', array['l1'], current_date, current_date),
  ('v14', 'Carla', '', 8, 8, 'c1', 'g2', array['l1'], current_date, current_date),
  ('v15', 'Wendy', '', 10, 10, 'c1', 'g2', array['l1'], current_date, current_date),
  ('v16', 'Sandra', '', 8.5, 8.5, 'c1', 'g2', array['l1'], current_date, current_date)
on conflict (id) do update set
  nombre = excluded.nombre, apellidos = excluded.apellidos,
  precio_hora = excluded.precio_hora, precio_hora_nocturna = excluded.precio_hora_nocturna,
  company_id = excluded.company_id, group_id = excluded.group_id, locales = excluded.locales;

-- ── Turnos ─────────────────────────────────────────────────────────────────
insert into shifts (id, employee_id, local_id, fecha, inicio, fin) values
  ('imp-001', 'r01', 'l3', semana_river_camareros + 0, '08:00', '16:30'),
  ('imp-002', 'r01', 'l3', semana_river_camareros + 1, '08:00', '16:30'),
  ('imp-003', 'r01', 'l3', semana_river_camareros + 2, '08:30', '16:30'),
  ('imp-004', 'r01', 'l3', semana_river_camareros + 5, '08:30', '16:30'),
  ('imp-005', 'r01', 'l3', semana_river_camareros + 6, '08:00', '16:00'),
  ('imp-006', 'r03', 'l3', semana_river_camareros + 0, '08:30', '16:30'),
  ('imp-007', 'r03', 'l3', semana_river_camareros + 1, '16:00', '00:00'),
  ('imp-008', 'r03', 'l3', semana_river_camareros + 5, '13:00', '17:30'),
  ('imp-009', 'r05', 'l3', semana_river_camareros + 0, '16:00', '00:00'),
  ('imp-010', 'r05', 'l3', semana_river_camareros + 1, '16:00', '00:00'),
  ('imp-011', 'r05', 'l3', semana_river_camareros + 2, '16:00', '00:00'),
  ('imp-012', 'r06', 'l3', semana_river_camareros + 2, '16:00', '00:00'),
  ('imp-013', 'r06', 'l3', semana_river_camareros + 3, '16:00', '00:00'),
  ('imp-014', 'r06', 'l3', semana_river_camareros + 4, '18:30', '02:30'),
  ('imp-015', 'r06', 'l3', semana_river_camareros + 5, '18:30', '02:30'),
  ('imp-016', 'r06', 'l3', semana_river_camareros + 6, '16:00', '00:00'),
  ('imp-017', 'r07', 'l3', semana_river_camareros + 3, '10:30', '16:00'),
  ('imp-018', 'r07', 'l3', semana_river_camareros + 4, '16:00', '00:00'),
  ('imp-019', 'r07', 'l3', semana_river_camareros + 5, '19:30', '02:30'),
  ('imp-020', 'r08', 'l3', semana_river_camareros + 2, '08:00', '16:00'),
  ('imp-021', 'r08', 'l3', semana_river_camareros + 3, '08:00', '16:00'),
  ('imp-022', 'r08', 'l3', semana_river_camareros + 4, '08:00', '16:00'),
  ('imp-023', 'r08', 'l3', semana_river_camareros + 5, '08:00', '16:00'),
  ('imp-024', 'r09', 'l3', semana_river_camareros + 0, '16:00', '00:00'),
  ('imp-025', 'r09', 'l3', semana_river_camareros + 1, '18:30', '00:00'),
  ('imp-026', 'r09', 'l3', semana_river_camareros + 2, '16:00', '00:00'),
  ('imp-027', 'r10', 'l3', semana_river_camareros + 2, '08:00', '16:00'),
  ('imp-028', 'r10', 'l3', semana_river_camareros + 3, '08:00', '16:00'),
  ('imp-029', 'r10', 'l3', semana_river_camareros + 4, '08:00', '16:00'),
  ('imp-030', 'r10', 'l3', semana_river_camareros + 5, '08:00', '16:00'),
  ('imp-031', 'r11', 'l3', semana_river_camareros + 0, '16:00', '00:00'),
  ('imp-032', 'r11', 'l3', semana_river_camareros + 1, '14:00', '18:30'),
  ('imp-033', 'r11', 'l3', semana_river_camareros + 4, '18:30', '00:00'),
  ('imp-034', 'r11', 'l3', semana_river_camareros + 5, '16:00', '00:00'),
  ('imp-035', 'r11', 'l3', semana_river_camareros + 6, '09:00', '17:00'),
  ('imp-036', 'r12', 'l3', semana_river_camareros + 4, '08:30', '16:30'),
  ('imp-037', 'r12', 'l3', semana_river_camareros + 6, '08:30', '16:30'),
  ('imp-038', 'r14', 'l3', semana_river_camareros + 3, '12:00', '17:00'),
  ('imp-039', 'r14', 'l3', semana_river_camareros + 4, '12:00', '17:00'),
  ('imp-040', 'r14', 'l3', semana_river_camareros + 5, '12:00', '17:00'),
  ('imp-041', 'r14', 'l3', semana_river_camareros + 6, '12:00', '17:00'),
  ('imp-042', 'r15', 'l3', semana_river_camareros + 4, '16:00', '00:00'),
  ('imp-043', 'r15', 'l3', semana_river_camareros + 5, '09:00', '17:00'),
  ('imp-044', 'r16', 'l3', semana_river_camareros + 0, '10:30', '16:00'),
  ('imp-045', 'r16', 'l3', semana_river_camareros + 1, '10:30', '16:00'),
  ('imp-046', 'r16', 'l3', semana_river_camareros + 2, '10:30', '16:00'),
  ('imp-047', 'r16', 'l3', semana_river_camareros + 3, '08:30', '16:30'),
  ('imp-048', 'r17', 'l3', semana_river_camareros + 2, '19:00', '23:00'),
  ('imp-049', 'r17', 'l3', semana_river_camareros + 3, '19:00', '23:00'),
  ('imp-050', 'r17', 'l3', semana_river_camareros + 4, '18:30', '00:00'),
  ('imp-051', 'r17', 'l3', semana_river_camareros + 5, '18:30', '00:00'),
  ('imp-052', 'r17', 'l3', semana_river_camareros + 6, '16:00', '00:00'),
  ('imp-053', 'r18', 'l3', semana_river_camareros + 3, '16:00', '00:00'),
  ('imp-054', 'r18', 'l3', semana_river_camareros + 4, '10:00', '16:30'),
  ('imp-055', 'r18', 'l3', semana_river_camareros + 5, '16:00', '00:00'),
  ('imp-056', 'r18', 'l3', semana_river_camareros + 6, '17:00', '22:30'),
  ('imp-057', 'r20', 'l3', semana_river_cocineros + 0, '12:00', '17:00'),
  ('imp-058', 'r20', 'l3', semana_river_cocineros + 1, '12:00', '17:00'),
  ('imp-059', 'r20', 'l3', semana_river_cocineros + 4, '14:00', '23:30'),
  ('imp-060', 'r20', 'l3', semana_river_cocineros + 5, '14:00', '23:30'),
  ('imp-061', 'r20', 'l3', semana_river_cocineros + 6, '14:00', '23:30'),
  ('imp-062', 'r20', 'l3', semana_river_cocineros + 0, '19:00', '23:00'),
  ('imp-063', 'r20', 'l3', semana_river_cocineros + 1, '19:00', '23:00'),
  ('imp-064', 'r21', 'l3', semana_river_cocineros + 2, '14:00', '23:30'),
  ('imp-065', 'r21', 'l3', semana_river_cocineros + 3, '14:00', '23:30'),
  ('imp-066', 'r21', 'l3', semana_river_cocineros + 4, '11:00', '19:00'),
  ('imp-067', 'r21', 'l3', semana_river_cocineros + 5, '10:00', '17:00'),
  ('imp-068', 'r21', 'l3', semana_river_cocineros + 6, '11:00', '19:00'),
  ('imp-069', 'r21', 'l3', semana_river_cocineros + 5, '20:00', '23:00'),
  ('imp-070', 'v01', 'l1', semana_vermuteria + 1, '10:30', '17:00'),
  ('imp-071', 'v01', 'l1', semana_vermuteria + 2, '08:00', '17:00'),
  ('imp-072', 'v01', 'l1', semana_vermuteria + 3, '10:30', '17:00'),
  ('imp-073', 'v01', 'l1', semana_vermuteria + 4, '10:30', '17:00'),
  ('imp-074', 'v02', 'l1', semana_vermuteria + 0, '17:00', '00:00'),
  ('imp-075', 'v02', 'l1', semana_vermuteria + 5, '17:00', '00:30'),
  ('imp-076', 'v02', 'l1', semana_vermuteria + 6, '17:00', '00:00'),
  ('imp-077', 'v03', 'l1', semana_vermuteria + 0, '20:00', '00:00'),
  ('imp-078', 'v03', 'l1', semana_vermuteria + 1, '20:00', '00:00'),
  ('imp-079', 'v04', 'l1', semana_vermuteria + 3, '17:00', '00:00'),
  ('imp-080', 'v04', 'l1', semana_vermuteria + 4, '17:00', '00:30'),
  ('imp-081', 'v04', 'l1', semana_vermuteria + 5, '10:30', '17:00'),
  ('imp-082', 'v04', 'l1', semana_vermuteria + 6, '10:30', '17:00'),
  ('imp-083', 'v05', 'l1', semana_vermuteria + 5, '17:00', '00:30'),
  ('imp-084', 'v05', 'l1', semana_vermuteria + 6, '17:00', '00:00'),
  ('imp-085', 'v06', 'l1', semana_vermuteria + 2, '17:00', '00:00'),
  ('imp-086', 'v06', 'l1', semana_vermuteria + 3, '12:00', '16:00'),
  ('imp-087', 'v06', 'l1', semana_vermuteria + 5, '18:30', '00:00'),
  ('imp-088', 'v06', 'l1', semana_vermuteria + 6, '12:00', '17:00'),
  ('imp-089', 'v07', 'l1', semana_vermuteria + 0, '10:30', '17:00'),
  ('imp-090', 'v07', 'l1', semana_vermuteria + 1, '10:30', '17:00'),
  ('imp-091', 'v07', 'l1', semana_vermuteria + 2, '08:00', '17:00'),
  ('imp-092', 'v07', 'l1', semana_vermuteria + 3, '10:30', '17:00'),
  ('imp-093', 'v07', 'l1', semana_vermuteria + 4, '10:30', '17:00'),
  ('imp-094', 'v08', 'l1', semana_vermuteria + 0, '17:00', '20:00'),
  ('imp-095', 'v08', 'l1', semana_vermuteria + 1, '17:00', '20:00'),
  ('imp-096', 'v08', 'l1', semana_vermuteria + 4, '20:00', '22:30'),
  ('imp-097', 'v08', 'l1', semana_vermuteria + 5, '13:00', '18:30'),
  ('imp-098', 'v08', 'l1', semana_vermuteria + 6, '13:00', '18:30'),
  ('imp-099', 'v09', 'l1', semana_vermuteria + 5, '10:30', '16:00'),
  ('imp-100', 'v09', 'l1', semana_vermuteria + 6, '10:30', '16:00'),
  ('imp-101', 'v10', 'l1', semana_vermuteria + 1, '17:00', '00:00'),
  ('imp-102', 'v10', 'l1', semana_vermuteria + 2, '17:00', '00:00'),
  ('imp-103', 'v10', 'l1', semana_vermuteria + 3, '17:00', '00:00'),
  ('imp-104', 'v10', 'l1', semana_vermuteria + 4, '17:00', '00:30'),
  ('imp-105', 'v10', 'l1', semana_vermuteria + 5, '17:00', '00:30'),
  ('imp-106', 'v11', 'l1', semana_vermuteria + 0, '12:00', '16:00'),
  ('imp-107', 'v11', 'l1', semana_vermuteria + 1, '18:30', '22:30'),
  ('imp-108', 'v11', 'l1', semana_vermuteria + 2, '18:30', '22:30'),
  ('imp-109', 'v12', 'l1', semana_vermuteria + 3, '18:30', '23:00'),
  ('imp-110', 'v12', 'l1', semana_vermuteria + 4, '18:30', '00:00'),
  ('imp-111', 'v12', 'l1', semana_vermuteria + 5, '12:00', '17:00'),
  ('imp-112', 'v12', 'l1', semana_vermuteria + 6, '18:30', '22:30'),
  ('imp-113', 'v14', 'l1', semana_vermuteria + 5, '10:30', '16:00'),
  ('imp-114', 'v14', 'l1', semana_vermuteria + 6, '10:30', '16:00');

end $$;

-- Comprobación (debería mostrar 41 trabajadores y 114 turnos):
select (select count(*) from employees where id ~ '^(v|r)[0-9]{2}$') as trabajadores,
       (select count(*) from shifts where id like 'imp-%') as turnos;

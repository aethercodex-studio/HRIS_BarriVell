/**
 * App-wide constants. Anything a non-developer might want to tweak lives here
 * (night window, group palette, default email template, table columns…).
 */

/** Night window in minutes from 00:00. Night = 22:00 → 06:00 (next day). */
export const NIGHT_START_MIN = 22 * 60;
export const NIGHT_END_MIN = 6 * 60;

/** The calendar grid starts at 06:00 so night shifts are drawn without breaks. */
export const GRID_START_MIN = 6 * 60;

/** Group colour palette (taken from the Barri Vell logo). [main, tint] */
export const GROUP_COLORS = [
  ['#2EA9E1', '#dcf0fa'],
  ['#F29100', '#fde9cc'],
  ['#E63229', '#fbdcda'],
  ['#13A09A', '#d3efed'],
  ['#F9B233', '#feefd2'],
  ['#E9609A', '#fbe0ec'],
  ['#5DAE45', '#e2f1dc'],
  ['#7D6BD6', '#e7e3f8'],
];

export const DEFAULT_EMAIL_TEMPLATE = {
  subject: 'Solicitud de alta: {NOMBRE}',
  template:
    'Hola,\n\nSolicito el alta de {NOMBRE} con fecha {FECHA_ALTA} y DNI {DNI}.\n\nEmpresa: {EMPRESA}\n\nAdjunto las imágenes del DNI.\n\nGracias.',
};

/** Variables accepted by the gestoría template (see lib/template.js). */
export const TEMPLATE_VARS = ['{NOMBRE}', '{DNI}', '{FECHA_ALTA}', '{EMPRESA}', '{NSS}'];

export const DEFAULT_SETTINGS = {
  gestoriaEmail: 'prueba@gestoria.com',
  ...DEFAULT_EMAIL_TEMPLATE,
};

/** Columns visible by default in the employees table. */
export const DEFAULT_EMPLOYEE_COLUMNS = ['nombre', 'apellidos', 'tel', 'email', 'rate', 'prl', 'active'];

/** Max side (px) for DNI images after downscaling. */
export const DNI_IMAGE_MAX_PX = 520;

/** Breakpoint under which the mobile layout is used. Keep in sync with CSS. */
export const MOBILE_BREAKPOINT = 900;

export const STORAGE_KEYS = {
  data: 'hris-barrivell-v1',
  auth: 'hris-barrivell-auth',
  ui: 'hris-barrivell-ui',
};

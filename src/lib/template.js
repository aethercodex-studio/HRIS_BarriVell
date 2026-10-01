/**
 * Gestoría email template. Variables in braces are replaced with the worker's data.
 * Unknown variables are left untouched so typos are visible in the preview.
 */
import { formatDate, fullName } from './format';

export function fillTemplate(text, employee, data) {
  const company = data.companies.find((c) => c.id === employee.companyId);
  const vars = {
    NOMBRE: fullName(employee),
    DNI: employee.dni || '(sin DNI)',
    FECHA_ALTA: formatDate(employee.fechaAlta),
    EMPRESA: company ? company.name : '—',
    NSS: employee.nss || '—',
  };
  return String(text || '').replace(/\{(\w+)\}/g, (match, key) => (vars[key] != null ? vars[key] : match));
}

/** mailto: links cannot carry attachments — images must be attached manually. */
export const buildMailto = ({ to, subject, body }) =>
  `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

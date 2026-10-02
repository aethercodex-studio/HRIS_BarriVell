/**
 * Worker card (side drawer): view, edit and create modes.
 * Also hosts the gestoría email modal.
 */
import { useState } from 'react';
import { useApp } from '@/state/AppProvider';
import { useNav } from '@/state/NavContext';
import { Button, Drawer } from '@/components/ui';
import { parseDecimal } from '@/lib/format';
import * as actions from '@/domain/actions';
import { EmployeeDetails } from './EmployeeDetails';
import { EmployeeForm, emptyEmployeeDraft, employeeToDraft } from './EmployeeForm';
import { GestoriaEmailModal } from './GestoriaEmailModal';

export function EmployeeDrawer() {
  const { data, update, showToast } = useApp();
  const { employeePanel, openEmployee, editEmployee, closeEmployee } = useNav();
  const { id, mode } = employeePanel;
  const employee = id ? data.employees.find((e) => e.id === id) : null;

  const [draft, setDraft] = useState(() =>
    mode === 'new' ? emptyEmployeeDraft(data.companies[0]?.id) : employee ? employeeToDraft(employee) : null,
  );
  const [errors, setErrors] = useState({});
  const [mailKind, setMailKind] = useState(null); // null | 'alta' | 'prl'

  // Re-initialise the draft when switching from view → edit.
  const startEdit = () => {
    setDraft(employeeToDraft(employee));
    setErrors({});
    editEmployee(id);
  };

  function save() {
    const errs = validate(draft);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const fields = {
      ...draft,
      nombre: draft.nombre.trim(),
      apellidos: draft.apellidos.trim(),
      rate: parseDecimal(draft.rate),
      nightRate: parseDecimal(draft.nightRate),
      contractHours: parseDecimal(draft.contractHours),
      groupId: draft.groupId || null,
    };
    if (mode === 'new') {
      const newId = update(actions.createEmployee, fields);
      showToast('Empleado creado. Fecha de contratación: hoy');
      openEmployee(newId);
    } else {
      update(actions.updateEmployee, id, fields);
      showToast('Cambios guardados');
      openEmployee(id);
    }
  }

  const cancel = () => (mode === 'new' ? closeEmployee() : openEmployee(id));
  const title = mode === 'new' ? 'Nuevo empleado' : mode === 'edit' ? 'Editar ficha' : 'Ficha del empleado';

  if (mode !== 'new' && !employee) return null; // deleted meanwhile

  return (
    <>
      <Drawer
        title={title}
        onClose={closeEmployee}
        footer={
          mode !== 'view' && (
            <>
              <Button onClick={cancel}>Cancelar</Button>
              <Button variant="primary" onClick={save}>Guardar</Button>
            </>
          )
        }
      >
        {mode === 'view' ? (
          <EmployeeDetails employee={employee} onEdit={startEdit} onMail={setMailKind} />
        ) : (
          <EmployeeForm draft={draft} setDraft={setDraft} errors={errors} isNew={mode === 'new'} employeeId={id} />
        )}
      </Drawer>
      {mailKind && employee && <GestoriaEmailModal kind={mailKind} employee={employee} onClose={() => setMailKind(null)} />}
    </>
  );
}

/** Form validation rules. Returns { field: message }. */
function validate(d) {
  const errs = {};
  if (!d.nombre.trim()) errs.nombre = 'Obligatorio';
  if (!d.apellidos.trim()) errs.apellidos = 'Obligatorio';
  if (!d.companyId) errs.companyId = 'Elige una empresa';
  if (d.email && !/^\S+@\S+\.\S+$/.test(d.email)) errs.email = 'Correo no válido';
  for (const k of ['rate', 'nightRate', 'contractHours']) if (Number.isNaN(parseDecimal(d[k]))) errs[k] = 'Número no válido';
  return errs;
}

/**
 * Gestoría email address and the "solicitud de alta" template, with live preview.
 */
import { useApp } from '@/state/AppProvider';
import { Button, Field, TextInput } from '@/components/ui';
import { DEFAULT_EMAIL_TEMPLATE, TEMPLATE_VARS } from '@/config/constants';
import { fillTemplate } from '@/lib/template';
import { fullName } from '@/lib/format';
import * as actions from '@/domain/actions';
import s from './settings.module.css';

export function GestoriaSettings() {
  const { data, update } = useApp();
  const settings = data.settings;
  const set = (key) => (value) => update(actions.updateSettings, { [key]: value });
  const sample = data.employees.find((e) => e.active) || data.employees[0];

  return (
    <div className={s.twoCols}>
      <section className={`card ${s.card}`}>
        <h2 className={s.title}>Correo a la gestoría</h2>
        <Field label="Correo de la gestoría"><TextInput type="email" value={settings.gestoriaEmail} onChange={set('gestoriaEmail')} /></Field>
        <Field label="Asunto"><TextInput value={settings.subject} onChange={set('subject')} /></Field>
        <Field label="Plantilla del mensaje">
          <textarea className={s.textarea} rows={9} value={settings.template} onChange={(ev) => set('template')(ev.target.value)} />
        </Field>
        <span className="muted" style={{ fontSize: 13 }}>Toca una variable para añadirla al final del mensaje:</span>
        <div className={s.vars}>
          {TEMPLATE_VARS.map((v) => (
            <button key={v} className={s.varChip} onClick={() => set('template')((settings.template || '') + v)}>{v}</button>
          ))}
        </div>
        <Button size="sm" style={{ alignSelf: 'flex-start' }} onClick={() => update(actions.updateSettings, DEFAULT_EMAIL_TEMPLATE)}>Restablecer plantilla</Button>
      </section>

      {sample && (
        <section className={`card ${s.card}`}>
          <span className={s.eyebrow}>Vista previa · {fullName(sample)}</span>
          <div className="muted">Para: <strong style={{ color: 'var(--ink)' }}>{settings.gestoriaEmail}</strong></div>
          <strong style={{ fontSize: 16 }}>{fillTemplate(settings.subject, sample, data)}</strong>
          <div className={s.preview}>{fillTemplate(settings.template, sample, data)}</div>
        </section>
      )}
    </div>
  );
}

/**
 * Gestoría request email ("Solicitar alta" or "Solicitar PRL"), pre-filled from
 * the matching template in Configuración. Opens the user's mail program (mailto). Browsers cannot attach
 * files through mailto, so DNI images are offered as downloads.
 *
 * Future: send automatically with attachments via a Supabase Edge Function.
 */
import { useState } from 'react';
import { useApp } from '@/state/AppProvider';
import { Button, Field, Modal, TextInput } from '@/components/ui';
import { buildMailto, fillTemplate } from '@/lib/template';
import { downloadFile } from '@/lib/utils';
import * as actions from '@/domain/actions';
import s from './employees.module.css';

/** kind: 'alta' | 'prl' */
export function GestoriaEmailModal({ kind = 'alta', employee: e, onClose }) {
  const isPrl = kind === 'prl';
  const { data, update, showToast } = useApp();
  const [mail, setMail] = useState(() => ({
    to: data.settings.gestoriaEmail,
    subject: fillTemplate(isPrl ? data.settings.prlSubject : data.settings.subject, e, data),
    body: fillTemplate(isPrl ? data.settings.prlTemplate : data.settings.template, e, data),
  }));
  const set = (k) => (v) => setMail((m) => ({ ...m, [k]: v }));
  const hasImages = Boolean(e.dniFront || e.dniBack);

  const downloadImages = () =>
    [['dniFront', 'anverso'], ['dniBack', 'reverso']].forEach(([k, side]) => {
      if (e[k]) downloadFile(e[k], `DNI_${e.nombre}_${e.apellidos}_${side}.jpg`.replace(/\s+/g, '_'));
    });

  const copyText = () =>
    navigator.clipboard
      .writeText(`Para: ${mail.to}\nAsunto: ${mail.subject}\n\n${mail.body}`)
      .then(() => showToast('Texto copiado'))
      .catch(() => showToast('No se ha podido copiar'));

  const markSent = () =>
    setTimeout(() => {
      update(isPrl ? actions.markPrlRequested : actions.markAltaRequested, e.id);
      showToast(isPrl ? 'Solicitud de PRL preparada en tu correo' : 'Solicitud de alta preparada en tu correo');
      onClose();
    }, 300); // let the browser follow the mailto link first

  return (
    <Modal
      title={isPrl ? 'Solicitar PRL a la gestoría' : 'Solicitar alta a la gestoría'}
      onClose={onClose}
      width={580}
      footer={
        <>
          <Button onClick={copyText}>Copiar texto</Button>
          {hasImages && <Button onClick={downloadImages}>Descargar imágenes</Button>}
          <a className={s.mailBtn} href={buildMailto(mail)} onClick={markSent}>Abrir en mi correo</a>
        </>
      }
    >
      <Field label="Para"><TextInput value={mail.to} onChange={set('to')} /></Field>
      <Field label="Asunto"><TextInput value={mail.subject} onChange={set('subject')} /></Field>
      <Field label="Mensaje">
        <textarea className={s.textarea} rows={8} value={mail.body} onChange={(ev) => set('body')(ev.target.value)} />
      </Field>
      <div className={s.info}>
        <span className={s.infoLabel}>Adjuntos</span>
        {hasImages ? (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              {e.dniFront && <span className={s.dniImg} style={{ width: 110, backgroundImage: `url("${e.dniFront}")` }} />}
              {e.dniBack && <span className={s.dniImg} style={{ width: 110, backgroundImage: `url("${e.dniBack}")` }} />}
            </div>
            <span className="muted" style={{ fontSize: 12.5 }}>Tu programa de correo no permite adjuntar archivos automáticamente: descarga las imágenes y adjúntalas al mensaje.</span>
          </>
        ) : (
          <span style={{ color: 'var(--warning-ink)', fontWeight: 600, fontSize: 13.5 }}>Este trabajador no tiene imágenes del DNI. Puedes subirlas desde Editar.</span>
        )}
      </div>
    </Modal>
  );
}

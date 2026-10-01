/**
 * Global overlays driven by AppProvider: confirmation dialog and toast.
 */
import { useApp } from '@/state/AppProvider';
import { Button, Modal } from './index';

export function ConfirmDialog() {
  const { confirmState, setConfirmState } = useApp();
  if (!confirmState) return null;
  const { steps, index, resolve } = confirmState;
  const step = steps[index];
  const close = (result) => {
    setConfirmState(null);
    resolve(result);
  };
  const next = () => (index < steps.length - 1 ? setConfirmState({ ...confirmState, index: index + 1 }) : close(true));

  return (
    <Modal
      title={step.title}
      subtitle={steps.length > 1 ? `Paso ${index + 1} de ${steps.length}` : undefined}
      onClose={() => close(false)}
      width={430}
      footer={
        <>
          <Button onClick={() => close(false)}>Cancelar</Button>
          <Button variant="primary" onClick={next} style={step.danger ? { background: 'var(--danger)' } : undefined}>
            {step.label}
          </Button>
        </>
      }
    >
      <p style={{ margin: 0, lineHeight: 1.5, color: 'var(--ink-2)' }}>{step.text}</p>
    </Modal>
  );
}

export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div
      role="status"
      style={{
        position: 'fixed', left: '50%', bottom: 'calc(28px + var(--bottom-nav, 0px))', transform: 'translateX(-50%)', zIndex: 90,
        background: 'var(--ink)', color: '#fff', padding: '12px 18px', borderRadius: 14, fontWeight: 600,
        boxShadow: '0 12px 30px rgba(22,24,26,.25)', maxWidth: 'calc(100vw - 32px)', textAlign: 'center',
      }}
    >
      {toast}
    </div>
  );
}

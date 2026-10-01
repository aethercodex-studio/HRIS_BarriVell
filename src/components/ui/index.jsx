/**
 * Small reusable UI primitives. Each one is intentionally thin: styling lives
 * in ui.module.css, behaviour stays in the feature components.
 */
import { useEffect } from 'react';
import { Icon } from './Icon';
import s from './ui.module.css';

const cx = (...c) => c.filter(Boolean).join(' ');

/** variant: primary | secondary | ghost | danger | outline */
export function Button({ variant = 'secondary', size = 'md', icon, children, className, ...rest }) {
  return (
    <button type="button" className={cx(s.btn, s[variant], s[size], className)} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 17} />}
      {children}
    </button>
  );
}

export function IconButton({ icon, label, className, ...rest }) {
  return (
    <button type="button" aria-label={label} title={label} className={cx(s.iconBtn, className)} {...rest}>
      <Icon name={icon} size={19} />
    </button>
  );
}

/** Pill-shaped segmented control. options: [{ value, label }] */
export function Segmented({ options, value, onChange }) {
  return (
    <div className={s.segmented} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          className={cx(s.segment, o.value === value && s.segmentOn)}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Native select (best on mobile). options: [{ value, label }] */
export function Select({ value, onChange, options, className, ...rest }) {
  return (
    <select className={cx(s.input, s.select, className)} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...rest}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function TextInput({ value, onChange, className, ...rest }) {
  return <input className={cx(s.input, className)} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...rest} />;
}

/** Label + control + optional error. */
export function Field({ label, error, children, className }) {
  return (
    <label className={cx(s.field, className)}>
      <span className={s.label}>{label}</span>
      {children}
      {error && <span className={s.error}>{error}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className={s.toggle} onClick={() => onChange(!checked)}>
      <span className={cx(s.track, checked && s.trackOn)}>
        <span className={s.thumb} />
      </span>
      {label}
    </button>
  );
}

/** Circle with initials, coloured by group. */
export function Avatar({ text, palette, size = 32 }) {
  return (
    <span className={s.avatar} style={{ width: size, height: size, background: palette.bg, borderColor: palette.dot, fontSize: size * 0.36 }}>
      {text}
    </span>
  );
}

/** Small rounded label. tone: success | warning | neutral | info, or custom colours. */
export function Pill({ tone = 'neutral', dot, children, style }) {
  return (
    <span className={cx(s.pill, s[`pill_${tone}`])} style={style}>
      {dot && <span className={s.dot} style={{ background: dot }} />}
      {children}
    </span>
  );
}

/** Inline message box. tone: warning | info */
export function Alert({ tone = 'warning', children }) {
  return (
    <div className={cx(s.alert, s[`alert_${tone}`])} role="status">
      <Icon name={tone === 'warning' ? 'alert' : 'check'} size={18} color={tone === 'warning' ? 'var(--warning-ink)' : 'currentColor'} />
      <div>{children}</div>
    </div>
  );
}

/** Centered dialog. Closes on backdrop click and Escape. */
export function Modal({ title, subtitle, onClose, width = 500, children, footer }) {
  useEscape(onClose);
  return (
    <>
      <div className={s.backdrop} onClick={onClose} />
      <div className={s.modal} style={{ width: `min(${width}px, calc(100vw - 20px))` }} role="dialog" aria-modal="true">
        <div className={s.modalHead}>
          <div>
            <h2 className={s.modalTitle}>{title}</h2>
            {subtitle && <span className="muted">{subtitle}</span>}
          </div>
          <IconButton icon="x" label="Cerrar" onClick={onClose} />
        </div>
        {children}
        {footer && <div className={s.modalFoot}>{footer}</div>}
      </div>
    </>
  );
}

/** Right-side panel (full screen on mobile). */
export function Drawer({ title, onClose, children, footer }) {
  useEscape(onClose);
  return (
    <>
      <div className={s.backdrop} onClick={onClose} />
      <aside className={s.drawer} role="dialog" aria-modal="true">
        <div className={s.drawerHead}>
          <span className={s.drawerTitle}>{title}</span>
          <IconButton icon="x" label="Cerrar" onClick={onClose} />
        </div>
        <div className={s.drawerBody}>{children}</div>
        {footer && <div className={s.drawerFoot}>{footer}</div>}
      </aside>
    </>
  );
}

function useEscape(onClose) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
}

export function EmptyState({ children }) {
  return <div className={cx('card', s.empty)}>{children}</div>;
}

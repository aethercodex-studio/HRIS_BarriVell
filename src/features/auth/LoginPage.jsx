/**
 * Login screen with the animated logo. Fast: two fields and one button.
 * Demo mode accepts any credentials; with Supabase it uses email + password auth.
 */
import { useEffect, useState } from 'react';
import { useApp } from '@/state/AppProvider';
import { Icon } from '@/components/ui/Icon';
import s from './auth.module.css';

export function LoginPage() {
  const { signIn, isRemote } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | busy | ok
  const [error, setError] = useState('');
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 40); // triggers the entrance transition
    return () => clearTimeout(t);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (phase !== 'idle') return;
    if (!email.trim() || !password) return setError('Escribe tu correo y tu contraseña.');
    setError('');
    setPhase('busy');
    try {
      await signIn(email.trim(), password);
      setPhase('ok');
    } catch {
      setPhase('idle');
      setError('Correo o contraseña incorrectos.');
    }
  }

  return (
    <div className={s.screen}>
      <div className={`${s.wrap} ${entered ? s.entered : ''}`}>
        <div className={s.hero}>
          <AnimatedLogo spun={entered} success={phase === 'ok'} />
          <h1 className={s.title}>HRIS Barri Vell</h1>
          <p className={s.subtitle}>Equipo, turnos y horas en un solo sitio</p>
        </div>

        <form className={s.card} onSubmit={handleSubmit} noValidate>
          <label className={s.field}>
            <span>Correo</span>
            <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
          </label>
          <label className={s.field}>
            <span>Contraseña</span>
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </label>
          {error && <div className={s.error}>{error}</div>}
          <button type="submit" className={`${s.submit} ${phase === 'ok' ? s.submitOk : ''}`}>
            {phase === 'idle' && 'Entrar'}
            {phase === 'busy' && (
              <>
                <span className={s.spinner} /> Entrando…
              </>
            )}
            {phase === 'ok' && (
              <>
                <Icon name="check" size={20} strokeWidth={2.5} /> ¡Hola de nuevo!
              </>
            )}
          </button>
          {!isRemote && <p className={s.demo}>Modo demo: entra con cualquier correo y contraseña.</p>}
        </form>
      </div>
    </div>
  );
}

/** Logo + small clock whose hands spin and settle at 10:10. */
function AnimatedLogo({ spun, success }) {
  return (
    <div className={s.logo}>
      {success && <div className={s.ring} />}
      <img src="/logo.png" alt="Barri Vell" className={s.logoImg} />
      <div className={s.clock}>
        <span className={s.hand} style={{ height: 11, transform: `rotate(${spun ? 300 : -60}deg)` }} />
        <span className={s.hand} style={{ height: 15, transform: `rotate(${spun ? (success ? 420 : 60) : -300}deg)` }} />
        <span className={s.pivot} />
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { MOBILE_BREAKPOINT, STORAGE_KEYS } from '@/config/constants';

/** True below the mobile breakpoint. Updates only when crossing it. */
export function useIsMobile() {
  const query = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return isMobile;
}

/** useState that survives reloads (UI preferences only — never business data). */
export function useUiPreference(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.ui)) || {};
      return all[key] ?? initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.ui)) || {};
      localStorage.setItem(STORAGE_KEYS.ui, JSON.stringify({ ...all, [key]: value }));
    } catch {
      /* storage disabled */
    }
  }, [key, value]);
  return [value, setValue];
}

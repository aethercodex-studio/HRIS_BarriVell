/**
 * Global app state: auth, data, toast and confirmation dialogs.
 *
 * - `update(action, ...args)` clones the data, runs a domain action on the
 *   draft, re-renders and persists (debounced) through the repository.
 * - `confirm(steps)` returns a Promise<boolean>; pass 2 steps for the
 *   "alert twice" deletions.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { repository } from '@/data';

const AppContext = createContext(null);
const SAVE_DELAY_MS = 600;

export function AppProvider({ children }) {
  const [status, setStatus] = useState('loading'); // loading | ready
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  const lastSaved = useRef(null);
  const saveTimer = useRef(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((message) => {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const loadData = useCallback(async () => {
    const loaded = await repository.load();
    lastSaved.current = structuredClone(loaded);
    setData(loaded);
  }, []);

  // Restore session on start.
  useEffect(() => {
    (async () => {
      try {
        if (await repository.auth.getSession()) {
          await loadData();
          setAuthed(true);
        }
      } catch {
        showToast('No se han podido cargar los datos');
      } finally {
        setStatus('ready');
      }
    })();
  }, [loadData, showToast]);

  const signIn = useCallback(
    async (email, password) => {
      await repository.auth.signIn(email, password); // throws on error
      await loadData();
      setAuthed(true);
    },
    [loadData],
  );

  const signOut = useCallback(async () => {
    await repository.auth.signOut();
    setAuthed(false);
  }, []);

  /** Persist after a short pause so fast edits are batched into one save. */
  const scheduleSave = useCallback(
    (next) => {
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await repository.save(lastSaved.current, next);
          lastSaved.current = structuredClone(next);
        } catch {
          showToast('Error al guardar. Revisa la conexión.');
        }
      }, repository.isRemote ? SAVE_DELAY_MS : 0);
    },
    [showToast],
  );

  /** Runs a domain action on a copy of the data. Returns the action's result. */
  const update = useCallback(
    (action, ...args) => {
      let result;
      setData((current) => {
        const draft = structuredClone(current);
        result = action(draft, ...args);
        scheduleSave(draft);
        return draft;
      });
      return result;
    },
    [scheduleSave],
  );

  const confirm = useCallback(
    (steps) => new Promise((resolve) => setConfirmState({ steps, index: 0, resolve })),
    [],
  );

  const value = useMemo(
    () => ({ status, authed, data, signIn, signOut, update, toast, showToast, confirm, confirmState, setConfirmState, isRemote: repository.isRemote }),
    [status, authed, data, signIn, signOut, update, toast, showToast, confirm, confirmState],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

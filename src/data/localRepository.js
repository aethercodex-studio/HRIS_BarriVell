/**
 * Demo repository: keeps everything in localStorage. Used when Supabase is not
 * configured. Any email/password is accepted.
 */
import { STORAGE_KEYS } from '@/config/constants';
import { createSeedData } from './seed';
import { migrate } from './migrate';

export function createLocalRepository() {
  return {
    isRemote: false,

    auth: {
      async getSession() {
        return localStorage.getItem(STORAGE_KEYS.auth) === '1';
      },
      async signIn() {
        await new Promise((r) => setTimeout(r, 600)); // feels like a real request
        localStorage.setItem(STORAGE_KEYS.auth, '1');
      },
      async signOut() {
        localStorage.removeItem(STORAGE_KEYS.auth);
      },
    },

    async load() {
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.data));
        if (stored && Array.isArray(stored.employees)) return migrate(stored);
      } catch {
        /* corrupted storage → reseed */
      }
      const seed = migrate(createSeedData());
      localStorage.setItem(STORAGE_KEYS.data, JSON.stringify(seed));
      return seed;
    },

    async save(_previous, next) {
      localStorage.setItem(STORAGE_KEYS.data, JSON.stringify(next));
    },

    /* Files: in demo mode the "path" is the file itself as a data URL. */
    uploadFile(_empId, file) {
      return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
    },
    async fileUrl(path) {
      return path;
    },
    async removeFile() {},
  };
}

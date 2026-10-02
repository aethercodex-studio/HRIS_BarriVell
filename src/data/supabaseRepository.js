/**
 * Supabase repository. Only the rows that changed since the last save are
 * upserted, and removed rows are deleted — cheap enough for the free plan.
 */
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/env';
import { DEFAULT_SETTINGS } from '@/config/constants';
import { TABLES, settingsFromRow, settingsToRow } from './mappers';
import { migrate } from './migrate';

const BUCKET = 'ficheros'; // private Storage bucket created by schema.sql

const PAGE = 1000; // Supabase returns max 1000 rows per request
const CHUNK = 500;

export function createSupabaseRepository() {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  async function fetchAll(table) {
    let rows = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await client.from(table).select('*').range(from, from + PAGE - 1);
      if (error) throw error;
      rows = rows.concat(data);
      if (data.length < PAGE) return rows;
    }
  }

  return {
    isRemote: true,

    auth: {
      async getSession() {
        const { data } = await client.auth.getSession();
        return Boolean(data.session);
      },
      async signIn(email, password) {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async signOut() {
        await client.auth.signOut();
      },
    },

    async load() {
      const data = { settings: { ...DEFAULT_SETTINGS } };
      for (const t of TABLES) data[t.key] = (await fetchAll(t.table)).map(t.fromRow);
      const { data: s } = await client.from('settings').select('*').eq('id', 1).maybeSingle();
      if (s) data.settings = { ...data.settings, ...settingsFromRow(s) };
      data.v = 3; // the database already has the current shape
      return migrate(data);
    },

    async save(previous, next) {
      // 1) upsert changed rows, parents first
      for (const t of TABLES) {
        const before = new Map((previous ? previous[t.key] : []).map((x) => [x.id, JSON.stringify(t.toRow(x))]));
        const changed = next[t.key].map(t.toRow).filter((row) => before.get(row.id) !== JSON.stringify(row));
        for (let i = 0; i < changed.length; i += CHUNK) {
          const { error } = await client.from(t.table).upsert(changed.slice(i, i + CHUNK));
          if (error) throw error;
        }
      }
      // 2) delete removed rows, children first
      if (previous) {
        for (const t of [...TABLES].reverse()) {
          const keep = new Set(next[t.key].map((x) => x.id));
          const gone = previous[t.key].filter((x) => !keep.has(x.id)).map((x) => x.id);
          for (let i = 0; i < gone.length; i += 200) {
            const { error } = await client.from(t.table).delete().in('id', gone.slice(i, i + 200));
            if (error) throw error;
          }
        }
      }
      // 3) settings (single row)
      if (!previous || JSON.stringify(previous.settings) !== JSON.stringify(next.settings)) {
        const { error } = await client.from('settings').upsert(settingsToRow(next.settings));
        if (error) throw error;
      }
    },

    /* Files go to Storage; only their path is stored in employee_files. */
    async uploadFile(empId, file) {
      const safe = file.name.normalize('NFD').replace(/[^\w.-]+/g, '_');
      const path = `${empId}/${Date.now()}_${safe}`;
      const { error } = await client.storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined });
      if (error) throw error;
      return path;
    },
    /** Short-lived signed URL (bucket is private). */
    async fileUrl(path) {
      const { data, error } = await client.storage.from(BUCKET).createSignedUrl(path, 60, { download: true });
      if (error) throw error;
      return data.signedUrl;
    },
    async removeFile(path) {
      await client.storage.from(BUCKET).remove([path]);
    },
  };
}

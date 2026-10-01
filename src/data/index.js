/**
 * Repository contract (implemented by local and Supabase repositories):
 *
 *   isRemote: boolean
 *   auth.getSession(): Promise<boolean>
 *   auth.signIn(email, password): Promise<void>   (throws on bad credentials)
 *   auth.signOut(): Promise<void>
 *   load(): Promise<Data>
 *   save(previous: Data|null, next: Data): Promise<void>
 *
 * Data shape: { companies, locals, groups, employees, shifts, daysOff, settings }
 */
import { SUPABASE_ENABLED } from '@/config/env';
import { createLocalRepository } from './localRepository';
import { createSupabaseRepository } from './supabaseRepository';

export const repository = SUPABASE_ENABLED ? createSupabaseRepository() : createLocalRepository();

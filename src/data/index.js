/**
 * Repository contract (implemented by local and Supabase repositories):
 *
 *   isRemote: boolean
 *   auth.getSession(): Promise<boolean>
 *   auth.signIn(email, password): Promise<void>   (throws on bad credentials)
 *   auth.signOut(): Promise<void>
 *   load(): Promise<Data>
 *   save(previous: Data|null, next: Data): Promise<void>
 *   uploadFile(empId, File): Promise<path>   fileUrl(path): Promise<url>   removeFile(path)
 *
 * Data shape: { companies, locals, groups, employees, shifts, daysOff, files, nominas, settings }
 */
import { SUPABASE_ENABLED } from '@/config/env';
import { createLocalRepository } from './localRepository';
import { createSupabaseRepository } from './supabaseRepository';

export const repository = SUPABASE_ENABLED ? createSupabaseRepository() : createLocalRepository();

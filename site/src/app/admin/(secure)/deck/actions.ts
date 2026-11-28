'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { getSql } from '@/lib/db';
import { createLink, deleteLink, deleteSession, extendLink, isUuid, readLinkInput, setLinkRevoked, setNoteDone } from '@/lib/deck';

export interface LinkFormState {
  error?: string;
  created?: { name: string; token: string };
}

export async function createShareLink(_prev: LinkFormState | null, form: FormData): Promise<LinkFormState> {
  await requireAdmin();
  const input = readLinkInput((k) => form.get(k));
  if ('error' in input) return { error: input.error };
  const link = await createLink(getSql(), input);
  revalidatePath('/admin/deck');
  return { created: { name: link.name, token: link.token } };
}

export async function revokeLink(id: string) {
  await requireAdmin();
  if (isUuid(id)) await setLinkRevoked(getSql(), id, true);
  revalidatePath('/admin/deck');
}

export async function restoreLink(id: string) {
  await requireAdmin();
  // Restoring an expired link gives it another two weeks.
  if (isUuid(id)) await extendLink(getSql(), id, 14);
  revalidatePath('/admin/deck');
}

export async function removeLink(id: string) {
  await requireAdmin();
  if (isUuid(id)) await deleteLink(getSql(), id);
  revalidatePath('/admin/deck');
}

export async function markNote(id: string, done: boolean) {
  await requireAdmin();
  if (isUuid(id)) await setNoteDone(getSql(), id, done);
  revalidatePath('/admin/deck');
  revalidatePath('/admin');
}

export async function removeRun(id: string) {
  await requireAdmin();
  if (isUuid(id)) await deleteSession(getSql(), id);
  revalidatePath('/admin/analytics');
  redirect('/admin/analytics');
}

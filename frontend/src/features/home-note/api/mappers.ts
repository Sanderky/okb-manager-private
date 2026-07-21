import type { HomeDocument } from '../model/types';
import type { HomeNoteDTO } from './types';

export const mapHomeNoteFromDB = (
  data: HomeNoteDTO | null,
  fallbackId: string
): HomeDocument => ({
  id: data?.id || fallbackId,
  note: data?.note || '',
});

export const mapToHomeNotePayload = (id: string, noteContent: string) => ({
  id,
  note: noteContent,
  updated_at: new Date().toISOString(),
});

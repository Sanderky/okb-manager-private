import { mockDb } from '@/shared/api/mock/mockDb';
import type { HomeDocument } from '../model/types';
import { mapHomeNoteFromDB, mapToHomeNotePayload } from './mappers';
import { delay } from '@/shared/lib/delay';

const NOTE_ID = 'home';

export const getHomeNote = async (): Promise<HomeDocument> => {
  await delay(300);

  const noteRow = mockDb.home_notes.find((n) => n.id === NOTE_ID);

  if (!noteRow) {
    return mapHomeNoteFromDB(null, NOTE_ID);
  }

  return mapHomeNoteFromDB(noteRow, NOTE_ID);
};

export const saveHomeNote = async (noteContent: string): Promise<void> => {
  await delay();

  const payload = mapToHomeNotePayload(NOTE_ID, noteContent);
  const index = mockDb.home_notes.findIndex((n) => n.id === NOTE_ID);

  if (index >= 0) {
    mockDb.home_notes[index] = { ...mockDb.home_notes[index], ...payload };
  } else {
    mockDb.home_notes.push(payload as any);
  }
};

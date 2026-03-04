import { supabase } from '@/shared/api/supabase';
import type { HomeDocument } from '../model/types';
import { mapHomeNoteFromDB, mapToHomeNotePayload } from './mappers';

const NOTE_ID = 'home';

export const getHomeNote = async (): Promise<HomeDocument> => {
  const { data, error } = await supabase
    .from('home_notes')
    .select('id, note')
    .eq('id', NOTE_ID)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return mapHomeNoteFromDB(null, NOTE_ID);
    }

    throw error;
  }

  return mapHomeNoteFromDB(data, NOTE_ID);
};

export const saveHomeNote = async (noteContent: string): Promise<void> => {
  const payload = mapToHomeNotePayload(NOTE_ID, noteContent);

  const { error } = await supabase.from('home_notes').upsert(payload);

  if (error) throw error;
};

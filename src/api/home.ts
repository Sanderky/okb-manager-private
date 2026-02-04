import { supabase } from '../supabase';
import type { HomeDocument } from '../types';

const NOTE_ID = 'home';

export const getHomeNote = async (): Promise<HomeDocument> => {
  const { data, error } = await supabase
    .from('home_notes')
    .select('id, note')
    .eq('id', NOTE_ID)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { id: NOTE_ID, note: '' };
    }

    console.error('Błąd pobierania notatki:', error);
    return { id: NOTE_ID, note: '' };
  }

  return {
    id: data.id,
    note: data.note || '',
  };
};

export const saveHomeNote = async (noteContent: string): Promise<void> => {
  const { error } = await supabase.from('home_notes').upsert({
    id: NOTE_ID,
    note: noteContent,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
};

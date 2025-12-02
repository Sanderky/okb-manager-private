import { supabase } from '../supabase';
import type { HomeDocument } from '../types';

export const getHomeNote = async (): Promise<HomeDocument | null> => {
  const { data, error } = await supabase
    .from('home_notes')
    .select('id, note')
    .eq('id', 'note')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Błąd pobierania notatki:', error);
    return null;
  }

  return {
    id: data.id,
    note: data.note || undefined,
  };
};

export const saveHomeNote = async (noteContent: string): Promise<void> => {
  const { error } = await supabase.from('home_notes').upsert({
    id: 'note',
    note: noteContent,
  });

  if (error) throw error;
};

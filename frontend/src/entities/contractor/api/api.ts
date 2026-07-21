import { supabase } from '@/shared/api/supabase';
import type { Contractor } from '../model/types';
import { mapToContractor } from './mappers';

const TABLE_NAME = 'contractors';

export const getContractors = async (): Promise<Contractor[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*, constructions(count)')
    .order('name', { ascending: true });

  if (error) throw error;

  return data.map(mapToContractor);
};

export const addContractor = async (name: string): Promise<string> => {
  if (!name.trim()) {
    throw new Error('Nazwa kontrahenta jest wymagana');
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert({ name })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Taki wykonawca już istnieje (błąd bazy danych)');
    }
    throw error;
  }
  return data.id;
};

export const updateContractor = async (
  id: string,
  data: Partial<Contractor>
): Promise<void> => {
  const payload: any = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.note !== undefined) payload.note = data.note;

  const { error } = await supabase
    .from(TABLE_NAME)
    .update(payload)
    .eq('id', id);

  if (error) throw error;
};

export const deleteContractor = async (id: string): Promise<void> => {
  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);

  if (error) throw error;
};

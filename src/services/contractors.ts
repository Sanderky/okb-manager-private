import { supabase } from '../supabase';
import type { Contractor } from '../types';

const TABLE_NAME = 'contractors';

export const getContractors = async (): Promise<Contractor[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;

  return data as Contractor[];
};

export const addContractor = async (name: string) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert({ name })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateContractor = async ({
  id,
  name,
}: {
  id: string;
  name: string;
}) => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .update({ name })
    .eq('id', id);

  if (error) throw error;
};

export const deleteContractor = async (id: string) => {
  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);

  if (error) throw error;
};

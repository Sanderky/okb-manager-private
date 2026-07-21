import { supabase } from '@/shared/api/supabase';
import type { Construction } from '../model/types';
import { mapConstruction, mapToPayload } from './mappers';

export async function createConstruction(
  data: Partial<Construction> & { name: string; startDate: Date }
): Promise<string> {
  if (!data.name || !data.startDate) {
    throw new Error('Nazwa i data rozpoczęcia są wymagane');
  }

  const payload = mapToPayload({
    status: true,
    ...data,
  });

  const { data: insertedData, error } = await supabase
    .from('constructions')
    .insert(payload)
    .select('id')
    .single();

  if (error) throw error;
  return insertedData.id;
}

export async function updateConstruction(
  id: string,
  data: Partial<Construction>
): Promise<void> {
  const payload = mapToPayload(data);

  const { error } = await supabase
    .from('constructions')
    .update(payload)
    .eq('id', id);

  if (error) throw error;
}

export async function removeConstruction(id: string): Promise<void> {
  const { error } = await supabase.from('constructions').delete().eq('id', id);

  if (error) throw error;
}

export async function getConstructionList(
  activeOnly = false
): Promise<Construction[]> {
  let query = supabase
    .from('constructions')
    .select(
      `
      id,
      name,
      status,
      start_date,
      end_date,
      location,
      contractor_id,
      contractors ( name )
    `
    )
    .order('status', { ascending: false })
    .order('name', { ascending: true });

  if (activeOnly) {
    query = query.eq('status', true);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data.map(mapConstruction);
}

export async function getConstruction(
  id: string
): Promise<Construction | null> {
  const { data, error } = await supabase
    .from('constructions')
    .select(
      `
      *,
      contractors ( name )
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapConstruction(data);
}

export async function getConstructionStats(): Promise<{
  total: number;
  active: number;
}> {
  const [totalResponse, activeResponse] = await Promise.all([
    supabase.from('constructions').select('*', { count: 'exact', head: true }),
    supabase
      .from('constructions')
      .select('*', { count: 'exact', head: true })
      .eq('status', true),
  ]);

  if (totalResponse.error) throw totalResponse.error;
  if (activeResponse.error) throw activeResponse.error;

  return {
    total: totalResponse.count || 0,
    active: activeResponse.count || 0,
  };
}

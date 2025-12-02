import { supabase } from '../supabase';
import type { Construction } from '../types';
import { sortConstructions } from '../pages/Dashboard/Constructions/ConstructionsHelpers';

const mapConstruction = (data: any): Construction => ({
  id: data.id,
  name: data.name,
  status: data.status,
  location: data.location || null,
  contractor: data.contractor_id || null,
  startDate: new Date(data.start_date),
  endDate: data.end_date ? new Date(data.end_date) : null,
  note: data.note || null,
});

export async function createConstruction(
  data: Partial<Construction> & { name: string; status: boolean }
): Promise<string> {
  if (!data.name || !data.startDate) {
    throw new Error('Nazwa i data rozpoczęcia są wymagane');
  }

  const payload = {
    name: data.name,
    status: data.status,
    location: data.location ?? null,
    contractor_id: data.contractor ?? null,
    start_date: data.startDate.toISOString(),
    end_date: data.endDate ? data.endDate.toISOString() : null,
    note: data.note ?? null,
  };

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
  const updatePayload: any = {};

  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.status !== undefined) updatePayload.status = data.status;
  if (data.location !== undefined) updatePayload.location = data.location;
  if (data.contractor !== undefined)
    updatePayload.contractor_id = data.contractor;
  if (data.startDate !== undefined)
    updatePayload.start_date = data.startDate.toISOString();
  if (data.endDate !== undefined)
    updatePayload.end_date = data.endDate ? data.endDate.toISOString() : null;
  if (data.note !== undefined) updatePayload.note = data.note;

  const { error } = await supabase
    .from('constructions')
    .update(updatePayload)
    .eq('id', id);

  if (error) throw error;
}

export async function removeConstruction(id: string): Promise<void> {
  const { error } = await supabase.from('constructions').delete().eq('id', id);

  if (error) throw error;
}

export async function getConstructionList(): Promise<Construction[]> {
  const { data, error } = await supabase.from('constructions').select('*');

  if (error) throw error;

  const constructionsList = data.map(mapConstruction);
  return sortConstructions(constructionsList);
}

export async function getConstruction(
  id: string
): Promise<Construction | null> {
  const { data, error } = await supabase
    .from('constructions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapConstruction(data);
}

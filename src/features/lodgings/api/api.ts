import { supabase } from '@/shared/api/supabase';
import type { Lodging, LodgingAssignment } from '../model/types';
import { toSqlDate } from '@/shared/lib/date';
import {
  mapLodgingFromDB,
  mapToLodgingCreatePayload,
  mapToLodgingUpdatePayload,
  mapAssignmentsToRelations,
  type LodgingWithAssignments,
} from './mappers';

const TABLE_NAME = 'lodgings';
const JOIN_TABLE = 'lodging_employees';

export const getLodgings = async (): Promise<LodgingWithAssignments[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(`*, lodging_employees ( employee_id, start_date, end_date )`)
    .order('start_date', { ascending: true });

  if (error) throw error;
  return data.map(mapLodgingFromDB);
};

export const createLodging = async (
  data: Partial<Lodging> & { assignments?: LodgingAssignment[] }
): Promise<string> => {
  const payload = mapToLodgingCreatePayload(data);

  const { data: created, error } = await supabase
    .from(TABLE_NAME)
    .insert(payload)
    .select('id')
    .single();

  if (error) throw error;

  if (data.assignments && data.assignments.length > 0) {
    const relations = mapAssignmentsToRelations(created.id, data.assignments);

    const { error: relError } = await supabase
      .from(JOIN_TABLE)
      .insert(relations);

    if (relError) throw relError;
  }

  return created.id;
};

export const updateLodging = async (
  id: string,
  data: Partial<Lodging> & { assignments?: LodgingAssignment[] }
): Promise<void> => {
  const payload = mapToLodgingUpdatePayload(data);

  if (Object.keys(payload).length > 0) {
    const { error } = await supabase
      .from(TABLE_NAME)
      .update(payload)
      .eq('id', id);
    if (error) throw error;
  }

  if (data.assignments !== undefined) {
    const { error: delError } = await supabase
      .from(JOIN_TABLE)
      .delete()
      .eq('lodging_id', id);
    if (delError) throw delError;

    if (data.assignments.length > 0) {
      const relations = mapAssignmentsToRelations(id, data.assignments);
      const { error: insError } = await supabase
        .from(JOIN_TABLE)
        .insert(relations);
      if (insError) throw insError;
    }
  }
};

export const deleteLodging = async (id: string): Promise<void> => {
  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
  if (error) throw error;
};

export const deleteOutdatedLodgings = async (): Promise<number> => {
  const today = toSqlDate(new Date());

  const { error, count } = await supabase
    .from(TABLE_NAME)
    .delete({ count: 'exact' })
    .lt('end_date', today);

  if (error) throw error;
  return count || 0;
};

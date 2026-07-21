import { supabase } from '@/shared/api/supabase';
import { toSqlDate } from '@/shared/lib/date';
import type { Employee } from '../../model/types';
import { sortByLastName } from '../../model/sort';
import { mapEmployeeToPayload, mapToEmployeeDtoToDomain } from '../mappers';

export async function createEmployee(
  data: Partial<Employee> & { name: string }
): Promise<string> {
  if (!data.name) throw new Error('Imię jest wymagane');

  const payload = mapEmployeeToPayload(data);

  const { data: insertedData, error } = await supabase
    .from('employees')
    .insert(payload)
    .select('id')
    .single();

  if (error) throw error;
  return insertedData.id;
}

export async function updateEmployee(
  id: string,
  data: Partial<Employee>
): Promise<void> {
  const payload = mapEmployeeToPayload(data);

  const { error } = await supabase
    .from('employees')
    .update(payload)
    .eq('id', id);

  if (error) throw error;
}

export async function removeEmployee(id: string): Promise<void> {
  const { error } = await supabase.from('employees').delete().eq('id', id);

  if (error) throw error;
}

export async function getEmployeeList(activeOnly = false): Promise<Employee[]> {
  let query = supabase
    .from('employees')
    .select(
      `
      id,
      name,
      status,
      is_contractor,
      pesel,
      birth_date,
      address,
      hour_rate,
      email,
      phone,
      birth_place,
      account_number,
      contract_start_date,
      contract_end_date,
      contract_is_permanent,
      a1_start_date,
      a1_end_date
    `
    )
    .order('name', { ascending: true });

  if (activeOnly) {
    query = query.eq('status', true);
  }

  const { data, error } = await query;

  if (error) throw error;

  const mappedEmployees = data.map(mapToEmployeeDtoToDomain);

  return mappedEmployees.sort((a, b) => sortByLastName(a.name, b.name));
}

export async function getEmployee(id: string): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapToEmployeeDtoToDomain(data);
}

export async function getEmployeeStats(): Promise<{
  total: number;
  active: number;
}> {
  const [totalResponse, activeResponse] = await Promise.all([
    supabase.from('employees').select('*', { count: 'exact', head: true }),

    supabase
      .from('employees')
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

export const getEmployeesByScheduledConstruction = async (
  constructionIds: string[],
  date: Date
): Promise<{ constructionId: string; employees: Employee[] }[]> => {
  const dateStr = toSqlDate(date);

  if (constructionIds.length === 0) return [];

  const { data: schedules, error } = await supabase
    .from('daily_schedules')
    .select(`construction_id, employee_id, employees (*)`)
    .eq('date', dateStr)
    .in('construction_id', constructionIds);

  if (error) throw error;

  const resultBuilder: Record<string, Employee[]> = {};

  constructionIds.forEach((cid) => {
    resultBuilder[cid] = [];
  });

  schedules.forEach((row: any) => {
    const empData = row.employees;

    if (!empData || !empData.status) return;

    const employee = mapToEmployeeDtoToDomain(empData);

    if (resultBuilder[row.construction_id]) {
      resultBuilder[row.construction_id].push(employee);
    }
  });

  return Object.entries(resultBuilder).map(([constructionId, employees]) => ({
    constructionId,
    employees,
  }));
};

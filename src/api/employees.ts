import { sortByLastName } from '../pages/Dashboard/Employees/EmployeesHelpers';
import { supabase } from '../supabase';
import type { Employee } from '../types';
import { toSqlDate } from '../utils';

const mapToEmployee = (data: any): Employee => ({
  id: data.id,
  name: data.name,
  status: data.status,
  isContractor: data.is_contractor ?? false,

  pesel: data.pesel || null,
  address: data.address || null,
  hourRate: data.hour_rate ? Number(data.hour_rate) : null,
  email: data.email || null,
  phone: data.phone || null,
  birthPlace: data.birth_place || null,
  accountNumber: data.account_number || null,
  note: data.note || null,

  birthDate: data.birth_date ? new Date(data.birth_date) : null,
  contractStartDate: data.contract_start_date
    ? new Date(data.contract_start_date)
    : null,
  contractEndDate: data.contract_end_date
    ? new Date(data.contract_end_date)
    : null,
  contractIsPermanent: data.contract_is_permanent ?? null,
  a1StartDate: data.a1_start_date ? new Date(data.a1_start_date) : null,
  a1EndDate: data.a1_end_date ? new Date(data.a1_end_date) : null,
});

const mapToPayload = (data: Partial<Employee>) => {
  const payload: any = {};

  if (data.name !== undefined) payload.name = data.name;
  if (data.status !== undefined) payload.status = data.status;
  if (data.isContractor !== undefined)
    payload.is_contractor = data.isContractor;
  if (data.pesel !== undefined) payload.pesel = data.pesel;
  if (data.address !== undefined) payload.address = data.address;
  if (data.hourRate !== undefined) payload.hour_rate = data.hourRate;
  if (data.email !== undefined) payload.email = data.email;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.birthPlace !== undefined) payload.birth_place = data.birthPlace;
  if (data.accountNumber !== undefined)
    payload.account_number = data.accountNumber;
  if (data.note !== undefined) payload.note = data.note;
  if (data.contractIsPermanent !== undefined)
    payload.contract_is_permanent = data.contractIsPermanent;

  if (data.birthDate !== undefined)
    payload.birth_date = toSqlDate(data.birthDate);
  if (data.contractStartDate !== undefined)
    payload.contract_start_date = toSqlDate(data.contractStartDate);
  if (data.contractEndDate !== undefined)
    payload.contract_end_date = toSqlDate(data.contractEndDate);
  if (data.a1StartDate !== undefined)
    payload.a1_start_date = toSqlDate(data.a1StartDate);
  if (data.a1EndDate !== undefined)
    payload.a1_end_date = toSqlDate(data.a1EndDate);

  return payload;
};

export async function createEmployee(
  data: Partial<Employee> & { name: string }
): Promise<string> {
  if (!data.name) throw new Error('Imię jest wymagane');

  const payload = mapToPayload(data);

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
  const payload = mapToPayload(data);

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

  const mappedEmployees = data.map(mapToEmployee);

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

  return mapToEmployee(data);
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

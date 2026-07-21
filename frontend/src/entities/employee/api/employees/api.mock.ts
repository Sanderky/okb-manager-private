import { mockDb } from '@/shared/api/mock/mockDb';
import { toSqlDate } from '@/shared/lib/date';
import type { Employee } from '../../model/types';
import { sortByLastName } from '../../model/sort';
import { mapEmployeeToPayload, mapToEmployeeDtoToDomain } from '../mappers';
import { delay } from '@/shared/lib/delay';

export async function createEmployee(
  data: Partial<Employee> & { name: string }
): Promise<string> {
  await delay();
  if (!data.name) throw new Error('Imię jest wymagane');

  const payload = mapEmployeeToPayload(data);
  const id = crypto.randomUUID();

  const newEmployee = { ...payload, id } as any;
  mockDb.employees.push(newEmployee);

  return id;
}

export async function updateEmployee(
  id: string,
  data: Partial<Employee>
): Promise<void> {
  await delay();
  const payload = mapEmployeeToPayload(data);
  const index = mockDb.employees.findIndex((e) => e.id === id);

  if (index === -1) throw new Error(`Employee with id ${id} not found`);

  mockDb.employees[index] = { ...mockDb.employees[index], ...payload };
}

export async function removeEmployee(id: string): Promise<void> {
  await delay();
  mockDb.employees = mockDb.employees.filter((e) => e.id !== id);
}

export async function getEmployeeList(activeOnly = false): Promise<Employee[]> {
  await delay();
  let filtered = [...mockDb.employees];

  if (activeOnly) {
    filtered = filtered.filter((e) => e.status === true);
  }

  const mappedEmployees = filtered.map(mapToEmployeeDtoToDomain);
  return mappedEmployees.sort((a, b) => sortByLastName(a.name, b.name));
}

export async function getEmployee(id: string): Promise<Employee | null> {
  await delay();
  const employee = mockDb.employees.find((e) => e.id === id);
  if (!employee) return null;

  return mapToEmployeeDtoToDomain(employee);
}

export async function getEmployeeStats(): Promise<{
  total: number;
  active: number;
}> {
  await delay();
  const total = mockDb.employees.length;
  const active = mockDb.employees.filter((e) => e.status === true).length;
  return { total, active };
}

export const getEmployeesByScheduledConstruction = async (
  constructionIds: string[],
  date: Date
): Promise<{ constructionId: string; employees: Employee[] }[]> => {
  await delay();
  const dateStr = toSqlDate(date);

  if (constructionIds.length === 0) return [];

  const schedules = mockDb.daily_schedules.filter(
    (ds) => ds.date === dateStr && constructionIds.includes(ds.construction_id)
  );

  const resultBuilder: Record<string, Employee[]> = {};
  constructionIds.forEach((cid) => {
    resultBuilder[cid] = [];
  });

  schedules.forEach((schedule) => {
    const empData = mockDb.employees.find((e) => e.id === schedule.employee_id);
    if (!empData || !empData.status) return;

    const employee = mapToEmployeeDtoToDomain(empData);
    if (resultBuilder[schedule.construction_id]) {
      resultBuilder[schedule.construction_id].push(employee);
    }
  });

  return Object.entries(resultBuilder).map(([constructionId, employees]) => ({
    constructionId,
    employees,
  }));
};

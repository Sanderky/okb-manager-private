import dayjs from 'dayjs';
import { mockDb } from '@/shared/api/mock/mockDb';
import { toSqlDate } from '@/shared/lib/date';
import type { Vacation } from '../model/types';
import { mapVacationFromDB, mapToVacationPayload } from './mappers';
import { delay } from '@/shared/lib/delay';

const joinEmployee = (vacation: any) => {
  const employee = mockDb.employees.find((e) => e.id === vacation.employee_id);
  return {
    ...vacation,
    employees: employee
      ? { name: employee.name, status: employee.status }
      : null,
  };
};

export const createVacation = async (
  data: Partial<Vacation>
): Promise<string> => {
  await delay();
  if (!data.startDate || !data.endDate || !data.employeeId) {
    throw new Error('Brak wymaganych danych do utworzenia urlopu');
  }

  const payload = mapToVacationPayload(data);
  const id = crypto.randomUUID();

  const newVacation = {
    ...payload,
    id,
    group_id: payload.group_id || id,
    description: payload.description || null,
  } as any;

  mockDb.vacations.push(newVacation);

  return id;
};

export async function updateVacation(id: string, data: Partial<Vacation>) {
  await delay();
  const payload = mapToVacationPayload(data);
  const index = mockDb.vacations.findIndex((v) => v.id === id);

  if (index === -1) throw new Error(`Vacation with id ${id} not found`);

  mockDb.vacations[index] = { ...mockDb.vacations[index], ...payload };
}

export async function removeVacation(id: string) {
  await delay();
  mockDb.vacations = mockDb.vacations.filter((v) => v.id !== id);
}

export async function getVacationListForMonths(
  monthKeys: string[]
): Promise<Vacation[]> {
  await delay();
  if (!monthKeys.length) return [];

  const sortedKeys = [...monthKeys].sort();
  const startMonth = sortedKeys[0];
  const endMonth = sortedKeys[sortedKeys.length - 1];
  const minDate = dayjs(startMonth).startOf('month').format('YYYY-MM-DD');
  const maxDate = dayjs(endMonth).endOf('month').format('YYYY-MM-DD');

  const filtered = mockDb.vacations.filter(
    (v) => v.start_date <= maxDate && v.end_date >= minDate
  );

  const withRelations = filtered.map(joinEmployee);
  return withRelations.map(mapVacationFromDB);
}

export const removeEmployeeVacations = async (
  employeeId: string
): Promise<void> => {
  await delay();
  mockDb.vacations = mockDb.vacations.filter(
    (v) => v.employee_id !== employeeId
  );
};

export const getUpcomingVacations = async (
  limit: number = 10
): Promise<Vacation[]> => {
  await delay();
  const todayStr = toSqlDate(new Date());
  if (!todayStr) return [];

  let filtered = mockDb.vacations.filter((v) => v.end_date >= todayStr);
  filtered.sort((a, b) => a.start_date.localeCompare(b.start_date));

  const limited = filtered.slice(0, limit);
  const withRelations = limited.map(joinEmployee);

  return withRelations.map(mapVacationFromDB);
};

export const getUpcomingVacationsForEmployee = async (
  employeeId: string,
  limit: number = 10
): Promise<Vacation[]> => {
  await delay();
  const todayStr = toSqlDate(new Date());
  if (!todayStr) return [];

  let filtered = mockDb.vacations.filter(
    (v) => v.employee_id === employeeId && v.end_date >= todayStr
  );
  filtered.sort((a, b) => a.start_date.localeCompare(b.start_date));

  const limited = filtered.slice(0, limit);

  return limited.map(mapVacationFromDB);
};

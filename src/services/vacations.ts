import { supabase } from '../supabase';
import type { Vacation } from '../types';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);

const expandVacationToDays = (row: any): Vacation[] => {
  const days: Vacation[] = [];
  let current = dayjs(row.start_date);
  const end = dayjs(row.end_date);

  while (current.isSameOrBefore(end)) {
    days.push({
      id: `${row.id}_${current.format('YYYY-MM-DD')}`,

      employeeId: row.employee_id,
      date: current.toDate(),
      yearMonth: current.format('YYYY-MM'),

      groupId: row.id,

      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      color: row.color,
      description: row.description || '',
    });
    current = current.add(1, 'day');
  }
  return days;
};

export const createVacation = async (
  data: Partial<Vacation> | Partial<Vacation>[]
) => {
  const list = Array.isArray(data) ? data : [data];
  if (list.length === 0) return null;

  const first = list[0];
  // const last = list[list.length - 1];

  const startDateStr = dayjs(first.startDate).format('YYYY-MM-DD');
  const endDateStr = dayjs(first.endDate).format('YYYY-MM-DD');

  const { data: createdRecord, error } = await supabase
    .from('vacations')
    .insert({
      employee_id: first.employeeId,
      start_date: startDateStr,
      end_date: endDateStr,
      color: first.color,
      description: first.description,
    })
    .select()
    .single();

  if (error) throw error;

  return createdRecord.id;
};

export const batchCreateVacations = async (
  employeeId: string,
  startDate: Date,
  endDate: Date,
  color: string,
  description?: string
) => {
  await createVacation([
    {
      employeeId,
      startDate,
      endDate,
      color,
      description,
    },
  ]);
};

export async function updateVacationGroup(
  groupId: string,
  data: Partial<Vacation>
) {
  const updatePayload: any = {};

  if (data.startDate)
    updatePayload.start_date = dayjs(data.startDate).format('YYYY-MM-DD');
  if (data.endDate)
    updatePayload.end_date = dayjs(data.endDate).format('YYYY-MM-DD');
  if (data.color) updatePayload.color = data.color;
  if (data.description) updatePayload.description = data.description;

  const { error } = await supabase
    .from('vacations')
    .update(updatePayload)
    .eq('id', groupId);

  if (error) throw error;
}

export async function removeVacation(groupId: string) {
  const { error } = await supabase.from('vacations').delete().eq('id', groupId);

  if (error) throw error;
}

export async function getVacationList(): Promise<Vacation[]> {
  const { data, error } = await supabase.from('vacations').select('*');
  if (error) throw error;

  const allDays: Vacation[] = [];
  data.forEach((row) => {
    allDays.push(...expandVacationToDays(row));
  });

  return allDays;
}

export async function getVacation(id: string): Promise<Vacation | null> {
  const { data, error } = await supabase
    .from('vacations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  const days = expandVacationToDays(data);
  return days.length > 0 ? days[0] : null;
}

export async function getVacationListForMonths(
  monthKeys: string[]
): Promise<Vacation[]> {
  if (!monthKeys.length) return [];

  const { data, error } = await supabase.from('vacations').select('*');
  if (error) throw error;

  const allDays: Vacation[] = [];

  data.forEach((row) => {
    const days = expandVacationToDays(row);
    const matchingDays = days.filter((d) => monthKeys.includes(d.yearMonth));
    allDays.push(...matchingDays);
  });

  return allDays;
}

export const getUpcomingVacations = async () => {
  const now = dayjs();
  const nextMonth = now.add(1, 'month');

  const currentMonthKey = now.format('YYYY-MM');
  const nextMonthKey = nextMonth.format('YYYY-MM');

  const vacations = await getVacationListForMonths([
    currentMonthKey,
    nextMonthKey,
  ]);

  const today = dayjs().startOf('day');
  return vacations.filter(
    (vacation) =>
      dayjs(vacation.startDate).isSameOrAfter(today) ||
      dayjs(vacation.endDate).isSameOrAfter(today)
  );
};

export const getUpcomingVacationsForEmployee = async (
  employeeId: string
): Promise<Vacation[]> => {
  const now = dayjs();
  const oneMonthFromNow = now.add(1, 'month').endOf('day');

  const monthKeys: string[] = [];
  for (let i = -1; i < 2; i++) {
    const date = now.add(i, 'month');
    const monthKey = date.format('YYYY-MM');
    monthKeys.push(monthKey);
  }

  const vacations = await getVacationListForMonths(monthKeys);

  const employeeVacations = vacations.filter(
    (vacation) => vacation.employeeId === employeeId
  );

  const uniqueVacations = employeeVacations.reduce((acc, vacation) => {
    if (!acc.has(vacation.groupId)) {
      acc.set(vacation.groupId, vacation);
    }
    return acc;
  }, new Map<string, Vacation>());

  const uniqueVacationsArray = Array.from(uniqueVacations.values());

  const filteredVacations = uniqueVacationsArray.filter((vacation) => {
    const startDate = dayjs(vacation.startDate);
    const endDate = dayjs(vacation.endDate);

    const isCurrent = now.isBetween(startDate, endDate, 'day', '[]');
    const isUpcoming =
      startDate.isAfter(now) && startDate.isBefore(oneMonthFromNow);

    return isCurrent || isUpcoming;
  });

  return filteredVacations;
};

export const removeEmployeeVacations = async (
  employeeId: string
): Promise<number> => {
  const { count, error } = await supabase
    .from('vacations')
    .delete({ count: 'exact' })
    .eq('employee_id', employeeId);

  if (error) throw error;
  return count || 0;
};

import { supabase } from '../supabase';
import type { Employee, Schedule } from '../types';
import dayjs from 'dayjs';

const mapToSchedule = (data: any): Schedule => ({
  id: data.id,
  employeeId: data.employee_id,
  weekStart: new Date(data.week_start),
  constructions: data.constructions,
});

const toSqlDate = (date: Date | string) => dayjs(date).format('YYYY-MM-DD');

export const getScheduleList = async (): Promise<Schedule[]> => {
  const { data, error } = await supabase.from('schedules').select('*');
  if (error) throw error;
  return data.map(mapToSchedule);
};

export const getScheduleListForWeek = async (
  weekStart: Date
): Promise<Schedule[]> => {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('week_start', toSqlDate(weekStart));

  if (error) throw error;
  return data.map(mapToSchedule);
};

export const updateSchedule = async (
  schedule: Omit<Schedule, 'id'> & { id?: string }
): Promise<void> => {
  const { id, ...data } = schedule;

  const payload = {
    employee_id: data.employeeId,
    week_start: toSqlDate(data.weekStart),
    constructions: data.constructions,
  };

  if (id) {
    const { error } = await supabase
      .from('schedules')
      .update(payload)
      .eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('schedules')
      .upsert(payload, { onConflict: 'employee_id, week_start' });
    if (error) throw error;
  }
};

export const removeEmployeeSchedules = async (
  employeeId: string
): Promise<number> => {
  const { count, error } = await supabase
    .from('schedules')
    .delete({ count: 'exact' })
    .eq('employee_id', employeeId);

  if (error) throw error;
  return count || 0;
};

export const getScheduleListForDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<Schedule[]> => {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .gte('week_start', toSqlDate(startDate))
    .lte('week_start', toSqlDate(endDate));

  if (error) throw error;
  return data.map(mapToSchedule);
};

export const getEmployeesByScheduledConstruction = async (
  constructionIds: string[],
  date: Date
): Promise<{ constructionId: string; employees: Employee[] }[]> => {
  const targetDate = dayjs(date);
  const weekStart = targetDate.startOf('week');

  const { data: schedules, error: scheduleError } = await supabase
    .from('schedules')
    .select('*')
    .eq('week_start', toSqlDate(weekStart.toDate()));

  if (scheduleError) throw scheduleError;

  const constructionEmployeeMap: Record<string, Set<string>> = {};
  const allEmployeeIds = new Set<string>();

  constructionIds.forEach((cid) => {
    constructionEmployeeMap[cid] = new Set();
  });

  schedules.forEach((data) => {
    const scheduleWeekStart = dayjs(data.week_start);
    const dayIndex = targetDate.diff(scheduleWeekStart, 'day');

    const todayConstructionId = data.constructions?.[dayIndex];

    if (todayConstructionId && constructionEmployeeMap[todayConstructionId]) {
      constructionEmployeeMap[todayConstructionId].add(data.employee_id);
      allEmployeeIds.add(data.employee_id);
    }
  });

  if (allEmployeeIds.size === 0) {
    return constructionIds.map((cid) => ({
      constructionId: cid,
      employees: [],
    }));
  }

  const uniqueEmployeeIds = Array.from(allEmployeeIds);

  const [employeesResponse, vacationResponse] = await Promise.all([
    supabase.from('employees').select('*').in('id', uniqueEmployeeIds),

    supabase
      .from('vacations')
      .select('employee_id')
      .in('employee_id', uniqueEmployeeIds)
      .lte('start_date', targetDateSql)
      .gte('end_date', targetDateSql),
  ]);

  if (employeesResponse.error) throw employeesResponse.error;
  if (vacationResponse.error) throw vacationResponse.error;

  const employeesMap = new Map(
    employeesResponse.data.map((emp: any) => [
      emp.id,
      {
        id: emp.id,
        name: emp.name,
        status: emp.status,
        // ... reszta pól Employeerzutuję, ale w produkcji użyj mapToEmployee z employeesService, lub użyj mappera z employeesService jeśli go eksportujesz
        ...emp,
      } as Employee,
    ])
  );

  const vacationEmployeeIds = new Set(
    vacationResponse.data.map((v) => v.employee_id)
  );

  const result = constructionIds.map((cid) => {
    const employeeIds = Array.from(constructionEmployeeMap[cid] || []);

    const employees = employeeIds
      .filter((id) => !vacationEmployeeIds.has(id) && employeesMap.has(id))
      .map((id) => employeesMap.get(id)!);

    return {
      constructionId: cid,
      employees,
    };
  });

  return result;
};

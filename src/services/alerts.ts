import { supabase } from '../supabase';
import type { EmployeeAlert } from '../types';
import dayjs from 'dayjs';

const generateAlertMessage = (
  type: 'contract' | 'a1',
  days: number,
  dateStr: string
) => {
  const date = dayjs(dateStr).format('DD.MM.YYYY');
  const typeName = type === 'contract' ? 'Umowa' : 'A1';
  const dayWord = Math.abs(days) === 1 ? 'dzień' : 'dni';

  if (days < 0) {
    return `${typeName} wygasła ${Math.abs(days)} ${dayWord} temu (${date})`;
  }
  if (days === 0) {
    return `${typeName} wygasa dzisiaj!`;
  }
  return `${typeName} wygasa ${date} (za ${days} ${dayWord})`;
};

const generateAlertTitle = (type: 'contract' | 'a1', name: string) => {
  return `${type === 'contract' ? 'Kończy się umowa' : 'Kończy się A1'} - ${name}`;
};

export const getEmployeeAlerts = async (): Promise<EmployeeAlert[]> => {
  const { data, error } = await supabase
    .from('view_employee_alerts')
    .select('*');

  if (error) throw error;

  return data.map((row: any) => ({
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    severity: row.severity,
    typePriority: row.type_priority,

    title: generateAlertTitle(row.type, row.employee_name),
    message: generateAlertMessage(
      row.type,
      row.days_remaining,
      row.expiry_date
    ),
  }));
};

export interface DailyScheduleDTO {
  id: string;
  construction_id: string;
  employee_id: string;
  date: string;
  constructions?: { name: string; status: boolean } | { name: string; status: boolean }[] | null;
  employees?: { name: string; status: boolean } | { name: string; status: boolean }[] | null;
}
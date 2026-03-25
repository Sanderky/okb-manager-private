export interface VacationDTO {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  color: string;
  description: string | null;
  group_id: string | null;
  employees?:
    | { name: string; status: boolean }
    | { name: string; status: boolean }[]
    | null;
}

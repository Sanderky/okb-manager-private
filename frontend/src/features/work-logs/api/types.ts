export interface WorkLogDTO {
  id: string;
  employee_id: string;
  construction_id: string;
  date: string;
  hours: number | null;
  employees?:
    | { name: string; status: boolean }
    | { name: string; status: boolean }[]
    | null;
  constructions?:
    | { name: string; status: boolean }
    | { name: string; status: boolean }[]
    | null;
}

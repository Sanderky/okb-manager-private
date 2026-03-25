export interface LodgingDTO {
  id: string;
  name: string | null;
  address: string | null;
  start_date: string;
  end_date: string;
  description: string | null;
  construction_site_id: string | null;

  lodging_employees?: LodgingEmployeeDTO[] | null;
}

export interface LodgingEmployeeDTO {
  lodging_id?: string;
  employee_id: string;
  start_date: string | null;
  end_date: string | null;
}

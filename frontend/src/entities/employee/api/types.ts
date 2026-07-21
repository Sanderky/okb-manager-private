export interface AlertSettingsDTO {
  id: number;
  a1_warning: number;
  a1_critical: number;
  contract_warning: number;
  contract_critical: number;
  updated_at?: string;
}

export interface EmployeeDTO {
  id: string;
  name: string;
  status: boolean;
  is_contractor: boolean;
  pesel: string | null;
  birth_date: string | null;
  birth_place: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  hour_rate: number | null;
  account_number: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  contract_is_permanent: boolean | null;
  a1_start_date: string | null;
  a1_end_date: string | null;
  note?: string | null;
}

export interface EmployeeAlertDTO {
  id: string;
  employee_id: string;
  employee_name: string;
  severity: 'error' | 'warning';
  type: 'contract' | 'a1';
  days_remaining?: number;
  expiry_date?: string | null;
}

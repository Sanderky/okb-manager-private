export interface CalendarEventDTO {
  id: string;
  group_id: string | null;
  title: string;
  start_date: string;
  end_date: string;
  category: string;
  color: string;
  is_auto_generated: boolean;
  description: string | null;
  calendar_event_employees?: { employee_id: string }[] | null;
  calendar_event_constructions?: { construction_id: string }[] | null;
}

export interface CalendarEventEmployeeDTO {
  event_id: string;
  employee_id: string;
}

export interface CalendarEventConstructionDTO {
  event_id: string;
  construction_id: string;
}

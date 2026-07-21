export interface Vacation {
  id: string;
  employeeId: string;
  groupId?: string;
  startDate: Date;
  endDate: Date;
  color: string;
  description?: string;
  employeeName?: string;
  employeeActive?: boolean;
}

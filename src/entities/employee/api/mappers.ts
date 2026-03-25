import type {
  AlertsSettings,
  Attachment,
  Employee,
  EmployeeAlert,
  EmployeeAttachmentType,
} from '../model/types';
import { generateAlertMessage, generateAlertTitle } from '../lib/alerts';
import { toSqlDate } from '@/shared/lib/date';
import type { AlertSettingsDTO, EmployeeAlertDTO, EmployeeDTO } from './types';

export const mapSettingsDtoToDomain = (
  data: AlertSettingsDTO
): AlertsSettings => ({
  a1Warning: data.a1_warning,
  a1Critical: data.a1_critical,
  contractWarning: data.contract_warning,
  contractCritical: data.contract_critical,
});

export const mapSettingsToPayload = (
  settings: AlertsSettings,
  id: number
): AlertSettingsDTO => ({
  id,
  a1_warning: settings.a1Warning,
  a1_critical: settings.a1Critical,
  contract_warning: settings.contractWarning,
  contract_critical: settings.contractCritical,
  updated_at: new Date().toISOString(),
});

export const mapAlertRowToDomain = (row: EmployeeAlertDTO): EmployeeAlert => ({
  id: row.id,
  employeeId: row.employee_id,
  employeeName: row.employee_name,
  severity: row.severity,
  title: generateAlertTitle(row.type, row.employee_name),
  message: generateAlertMessage(
    row.type,
    row.days_remaining ?? 0,
    row.expiry_date ?? ''
  ),
});

export const mapToEmployeeDtoToDomain = (data: EmployeeDTO): Employee => ({
  id: data.id,
  name: data.name,
  status: data.status,
  isContractor: data.is_contractor ?? false,
  pesel: data.pesel || null,
  address: data.address || null,
  hourRate: data.hour_rate ? Number(data.hour_rate) : null,
  email: data.email || null,
  phone: data.phone || null,
  birthPlace: data.birth_place || null,
  accountNumber: data.account_number || null,
  note: data.note || null,
  birthDate: data.birth_date ? new Date(data.birth_date) : null,
  contractStartDate: data.contract_start_date
    ? new Date(data.contract_start_date)
    : null,
  contractEndDate: data.contract_end_date
    ? new Date(data.contract_end_date)
    : null,
  contractIsPermanent: data.contract_is_permanent ?? null,
  a1StartDate: data.a1_start_date ? new Date(data.a1_start_date) : null,
  a1EndDate: data.a1_end_date ? new Date(data.a1_end_date) : null,
});

export const mapEmployeeToPayload = (data: Partial<Employee>) => {
  const payload: any = {};

  if (data.name !== undefined) payload.name = data.name;
  if (data.status !== undefined) payload.status = data.status;
  if (data.isContractor !== undefined)
    payload.is_contractor = data.isContractor;
  if (data.pesel !== undefined) payload.pesel = data.pesel;
  if (data.address !== undefined) payload.address = data.address;
  if (data.hourRate !== undefined) payload.hour_rate = data.hourRate;
  if (data.email !== undefined) payload.email = data.email;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.birthPlace !== undefined) payload.birth_place = data.birthPlace;
  if (data.accountNumber !== undefined)
    payload.account_number = data.accountNumber;
  if (data.note !== undefined) payload.note = data.note;
  if (data.contractIsPermanent !== undefined)
    payload.contract_is_permanent = data.contractIsPermanent;

  if (data.birthDate !== undefined)
    payload.birth_date = toSqlDate(data.birthDate);
  if (data.contractStartDate !== undefined)
    payload.contract_start_date = toSqlDate(data.contractStartDate);
  if (data.contractEndDate !== undefined)
    payload.contract_end_date = toSqlDate(data.contractEndDate);
  if (data.a1StartDate !== undefined)
    payload.a1_start_date = toSqlDate(data.a1StartDate);
  if (data.a1EndDate !== undefined)
    payload.a1_end_date = toSqlDate(data.a1EndDate);

  return payload;
};

export const mapStorageItemToAttachment = (
  item: any,
  type: EmployeeAttachmentType,
  employeeId: string
): Attachment => ({
  id: item.id || item.path,
  employeeId: employeeId,
  name: item.name,
  path: item.path,
  size: item.size,
  contentType: item.contentType,
  type: 'file',
  createdAt: item.createdAt,
  attachmentType: type,
});

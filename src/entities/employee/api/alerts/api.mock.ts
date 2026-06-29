import { mockDb } from '@/shared/api/mock/mockDb';

import type { EmployeeAlert, AlertsSettings } from '../../model/types';
import { DEFAULT_SETTINGS, SETTINGS_ID } from '../../model/constants';
import {
  mapSettingsDtoToDomain,
  mapSettingsToPayload,
  mapAlertRowToDomain,
} from '../mappers';
import dayjs from 'dayjs';
import { delay } from '@/shared/lib/delay';

export const fetchAlertsSettings = async (): Promise<AlertsSettings> => {
  await delay();
  const settings = mockDb.alert_settings.find((s) => s.id === SETTINGS_ID);

  if (!settings) return DEFAULT_SETTINGS;
  return mapSettingsDtoToDomain(settings);
};

export const updateAlertsSettings = async (
  settings: AlertsSettings
): Promise<void> => {
  await delay();
  const payload = mapSettingsToPayload(settings, SETTINGS_ID);

  const index = mockDb.alert_settings.findIndex((s) => s.id === SETTINGS_ID);
  if (index >= 0) {
    mockDb.alert_settings[index] = {
      ...mockDb.alert_settings[index],
      ...payload,
    };
  } else {
    mockDb.alert_settings.push(payload as any);
  }
};

export const getEmployeeAlerts = async (): Promise<EmployeeAlert[]> => {
  await delay();

  const settings =
    mockDb.alert_settings.find((s) => s.id === SETTINGS_ID) ||
    mapSettingsToPayload(DEFAULT_SETTINGS, SETTINGS_ID);
  const alerts: any[] = [];
  const today = dayjs();

  const activeEmployees = mockDb.employees.filter((e) => e.status === true);

  activeEmployees.forEach((emp) => {
    if (emp.contract_end_date && !emp.contract_is_permanent) {
      const daysLeft = dayjs(emp.contract_end_date).diff(today, 'day');

      if (daysLeft <= settings.contract_critical) {
        alerts.push({
          id: `alert-contract-${emp.id}`,
          employee_id: emp.id,
          employee_name: emp.name,
          type: 'contract',
          severity: 'error',
          days_remaining: daysLeft,
          expiry_date: emp.contract_end_date,
        });
      } else if (daysLeft <= settings.contract_warning) {
        alerts.push({
          id: `alert-contract-${emp.id}`,
          employee_id: emp.id,
          employee_name: emp.name,
          type: 'contract',
          severity: 'warning',
          days_remaining: daysLeft,
          expiry_date: emp.contract_end_date,
        });
      }
    }

    if (emp.a1_end_date) {
      const daysLeft = dayjs(emp.a1_end_date).diff(today, 'day');

      if (daysLeft <= settings.a1_critical) {
        alerts.push({
          id: `alert-a1-${emp.id}`,
          employee_id: emp.id,
          employee_name: emp.name,
          type: 'a1',
          severity: 'error',
          days_remaining: daysLeft,
          expiry_date: emp.a1_end_date,
        });
      } else if (daysLeft <= settings.a1_warning) {
        alerts.push({
          id: `alert-a1-${emp.id}`,
          employee_id: emp.id,
          employee_name: emp.name,
          type: 'a1',
          severity: 'warning',
          days_remaining: daysLeft,
          expiry_date: emp.a1_end_date,
        });
      }
    }
  });

  return alerts.map(mapAlertRowToDomain);
};

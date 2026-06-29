import { supabase } from '@/shared/api/supabase';
import type { EmployeeAlert } from '../../model/types';
import type { AlertsSettings } from '../../model/types';
import {
  mapSettingsDtoToDomain,
  mapSettingsToPayload,
  mapAlertRowToDomain,
} from '../mappers';
import { DEFAULT_SETTINGS, SETTINGS_ID } from '../../model/constants';

export const fetchAlertsSettings = async (): Promise<AlertsSettings> => {
  const { data, error } = await supabase
    .from('alert_settings')
    .select('*')
    .eq('id', SETTINGS_ID)
    .single();

  if (error) {
    console.warn(
      'Nie udało się pobrać ustawień alertów, używam domyślnych.',
      error
    );
    return DEFAULT_SETTINGS;
  }

  return mapSettingsDtoToDomain(data);
};

export const updateAlertsSettings = async (
  settings: AlertsSettings
): Promise<void> => {
  const payload = mapSettingsToPayload(settings, SETTINGS_ID);

  const { error } = await supabase.from('alert_settings').upsert(payload);

  if (error) throw error;
};

export const getEmployeeAlerts = async (): Promise<EmployeeAlert[]> => {
  const { data, error } = await supabase
    .from('view_employee_alerts')
    .select('*');

  if (error) throw error;

  return data.map(mapAlertRowToDomain);
};

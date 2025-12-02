import { supabase } from '../supabase';
import type { AlertsSettings } from '../types';
import { EmployeeAlertDefault } from '../hooks/useEmployeeAlert';

const SETTINGS_ID = 'alerts';

export const fetchAlertsSettings = async (): Promise<AlertsSettings> => {
  const { data, error } = await supabase
    .from('alert_settings')
    .select('*')
    .eq('id', SETTINGS_ID)
    .single();

  if (error) {
    console.warn('Using default alerts setting.', error);
    return EmployeeAlertDefault;
  }

  return {
    a1Warning: data.a1_warning,
    a1Critical: data.a1_critical,
    contractWarning: data.contract_warning,
    contractCritical: data.contract_critical,
  };
};

export const updateAlertsSettings = async (
  data: AlertsSettings
): Promise<void> => {
  if (!data) return;

  const payload = {
    id: SETTINGS_ID,
    a1_warning: data.a1Warning,
    a1_critical: data.a1Critical,
    contract_warning: data.contractWarning,
    contract_critical: data.contractCritical,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('alert_settings').upsert(payload);

  if (error) throw error;
};

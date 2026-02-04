import { supabase } from '../supabase';
import type { AlertsSettings } from '../types';

const SETTINGS_ID = 1;

const DEFAULT_SETTINGS: AlertsSettings = {
  a1Warning: 30,
  a1Critical: 7,
  contractWarning: 30,
  contractCritical: 7,
};

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

  return {
    a1Warning: data.a1_warning,
    a1Critical: data.a1_critical,
    contractWarning: data.contract_warning,
    contractCritical: data.contract_critical,
  };
};

export const updateAlertsSettings = async (
  settings: AlertsSettings
): Promise<void> => {
  const payload = {
    id: SETTINGS_ID,
    a1_warning: settings.a1Warning,
    a1_critical: settings.a1Critical,
    contract_warning: settings.contractWarning,
    contract_critical: settings.contractCritical,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('alert_settings').upsert(payload);

  if (error) throw error;
};

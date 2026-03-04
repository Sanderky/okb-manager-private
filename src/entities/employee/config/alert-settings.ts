import type { AlertsSettings } from "../model/types";

export const SETTINGS_ID = 1;

export const DEFAULT_SETTINGS: AlertsSettings = {
  a1Warning: 30,
  a1Critical: 7,
  contractWarning: 30,
  contractCritical: 7,
};
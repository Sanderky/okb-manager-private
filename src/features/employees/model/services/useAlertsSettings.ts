import { useState, useEffect } from 'react';
import useNotifications from '@/shared/ui/notifications/useNotifications';
import {
  useEmployeeAlertsSettings,
  useUpdateEmployeeAlertsSettings,
  type AlertsSettings,
} from '@/entities/employee';
import type { AlertsSettingsErrors } from '../types';

export const useAlertsSettings = (isOpen: boolean, onClose: () => void) => {
  const notifications = useNotifications();

  const [formData, setFormData] = useState<AlertsSettings>({
    a1Warning: 0,
    a1Critical: 0,
    contractWarning: 0,
    contractCritical: 0,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [formErrors, setFormErrors] = useState<AlertsSettingsErrors>(
    {} as AlertsSettingsErrors
  );

  const {
    data: alertsSettings,
    isLoading,
    isError,
  } = useEmployeeAlertsSettings(isOpen);

  useEffect(() => {
    if (alertsSettings) {
      setFormData(alertsSettings);
      setHasChanges(false);
    }
  }, [alertsSettings]);

  const updateMutation = useUpdateEmployeeAlertsSettings();

  const handleInputChange = (field: keyof AlertsSettings, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData((prev) => ({ ...prev, [field]: numValue }));
    if (alertsSettings) setHasChanges(alertsSettings[field] !== numValue);
  };

  const validate = (): boolean => {
    let isValid = true;
    const newErrors: AlertsSettingsErrors = {
      a1Warning: '',
      a1Critical: '',
      contractWarning: '',
      contractCritical: '',
    };

    if (isNaN(formData.a1Warning) || formData.a1Warning < 0) {
      newErrors.a1Warning = 'Wartość musi być liczbą nieujemną';
      isValid = false;
    }

    if (isNaN(formData.a1Critical) || formData.a1Critical < 0) {
      newErrors.a1Critical = 'Wartość musi być liczbą nieujemną';
      isValid = false;
    }

    if (isNaN(formData.contractWarning) || formData.contractWarning < 0) {
      newErrors.contractWarning = 'Wartość musi być liczbą nieujemną';
      isValid = false;
    }

    if (isNaN(formData.contractCritical) || formData.contractCritical < 0) {
      newErrors.contractCritical = 'Wartość musi być liczbą nieujemną';
      isValid = false;
    }

    if (
      !isNaN(formData.a1Warning) &&
      !isNaN(formData.a1Critical) &&
      formData.a1Warning !== 0 &&
      formData.a1Critical !== 0
    ) {
      if (formData.a1Critical >= formData.a1Warning) {
        newErrors.a1Critical =
          'Wartość krytyczna musi być mniejsza niż ostrzeżenie';
        isValid = false;
      }
    }

    if (
      !isNaN(formData.contractWarning) &&
      !isNaN(formData.contractCritical) &&
      formData.contractWarning !== 0 &&
      formData.contractCritical !== 0
    ) {
      if (formData.contractCritical >= formData.contractWarning) {
        newErrors.contractCritical =
          'Wartość krytyczna musi być mniejsza niż ostrzeżenie';
        isValid = false;
      }
    }

    setFormErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (hasChanges && validate()) {
      try {
        await updateMutation.mutateAsync(formData);
        notifications.show('Ustawienia alertów zostały zmienione.', {
          severity: 'success',
        });
        onClose();
      } catch {
        notifications.show('Ustawienia nie zostały zmienione.', {
          severity: 'error',
        });
      }
    }
  };

  const handleClose = () => {
    if (alertsSettings) setFormData(alertsSettings);
    setHasChanges(false);
    setFormErrors({} as AlertsSettingsErrors);
    onClose();
  };

  return {
    formData,
    formErrors,
    hasChanges,
    isLoading,
    isError,
    handleInputChange,
    handleSave,
    handleClose,
    isSaving: updateMutation.isPending,
  };
};

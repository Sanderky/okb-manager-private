import BaseDialog from '@/shared/ui/BaseDialog';
import { useTranslation } from 'react-i18next';
import { EmployeeAlertsSettingsBase } from './EmployeeAlertsSettings';

interface EmployeeAlertsSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeAlertsSettingsModal = ({
  isOpen,
  onClose,
}: EmployeeAlertsSettingsModalProps) => {
  const { t } = useTranslation('employees');

  return (
    <BaseDialog
      open={isOpen}
      onClose={onClose}
      title={t('alerts.settingsTitle')}
      showConfirm={false}
      maxWidth="sm"
      fullWidth
    >
      <EmployeeAlertsSettingsBase isOpen={isOpen} onClose={onClose} />
    </BaseDialog>
  );
};

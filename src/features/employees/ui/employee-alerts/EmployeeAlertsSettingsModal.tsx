import BaseDialog from '@/shared/ui/BaseDialog';
import { EmployeeAlertsSettingsBase } from './EmployeeAlertsSettings';

interface EmployeeAlertsSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeAlertsSettingsModal = ({
  isOpen,
  onClose,
}: EmployeeAlertsSettingsModalProps) => {
  return (
    <BaseDialog
      open={isOpen}
      onClose={onClose}
      title="Ustawienia alertów"
      showConfirm={false}
      maxWidth="sm"
      fullWidth
    >
      <EmployeeAlertsSettingsBase isOpen={isOpen} onClose={onClose} />
    </BaseDialog>
  );
};

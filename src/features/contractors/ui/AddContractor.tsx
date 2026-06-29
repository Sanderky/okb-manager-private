import { Button, TextField } from '@mui/material';
import BaseDialog from '@/shared/ui/BaseDialog';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useContractorsService } from '../model/services/useContractorsService';

export interface AddContractorDialogProps {
  open: boolean;
  onClose: () => void;
  onAddSuccess?: (newId: string) => void;
}
export const AddContractorDialog = ({
  open,
  onClose,
  onAddSuccess,
}: AddContractorDialogProps) => {
  const { t } = useTranslation(['contractors', 'common']);
  const [newName, setNewName] = useState('');
  const { handleAdd, isLoading } = useContractorsService();

  const onAdd = () => {
    handleAdd(newName, (newId) => {
      if (onAddSuccess) onAddSuccess(newId);
      setNewName('');
      onClose();
    });
    setNewName('');
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={t('addContractorTitle')}
      showCancel={false}
      actions={
        <Button
          variant="contained"
          onClick={onAdd}
          disabled={!newName.trim()}
          loading={isLoading}
        >
          {t('common:buttons.add')}
        </Button>
      }
    >
      <TextField
        size="small"
        fullWidth
        label={t('newContractorLabel')}
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        variant="outlined"
        onKeyDown={(e) => e.key === 'Enter' && onAdd()}
        disabled={isLoading}
      />
    </BaseDialog>
  );
};

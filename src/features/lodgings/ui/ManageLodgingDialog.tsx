import { useDialogs } from '@/shared/ui/dialogs/useDialogs';
import useNotifications from '@/shared/ui/notifications/useNotifications';
import { useTranslation } from 'react-i18next';
import LodgingFormView from './LodgingFormView';
import { useCreateLodging } from '../model/services/useCreateLodging';
import { useUpdateLodging } from '../model/services/useUpdateLodging';
import { useDeleteLodging } from '../model/services/useDeleteLodgings';
import type { Lodging } from '../model/types';
import { useLodgingsContext } from '../model/providers/LodgingsContext';

export const ManageLodgingDialog = () => {
  const { t } = useTranslation(['lodgings', 'common']);
  const { isOpen, close, employees, constructions, editingLodging } =
    useLodgingsContext();

  const dialogs = useDialogs();
  const notifications = useNotifications();

  const createMutation = useCreateLodging();
  const updateMutation = useUpdateLodging();
  const deleteMutation = useDeleteLodging();

  const handleFormSubmit = async (data: Partial<Lodging>) => {
    try {
      if (editingLodging) {
        await updateMutation.mutateAsync({ id: editingLodging.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      close();
      notifications.show(t('lodgings:notifications.saved'), {
        severity: 'success',
      });
    } catch {
      notifications.show(t('lodgings:notifications.saveError'), {
        severity: 'error',
      });
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await dialogs.confirm(
      t('lodgings:dialogs.delete.description'),
      {
        okText: t('common:buttons.delete'),
        cancelText: t('common:buttons.cancel'),
        title: t('lodgings:dialogs.delete.title'),
        severity: 'error',
      }
    );
    if (confirmed) {
      await deleteMutation.mutateAsync(id);
      close();
      notifications.show(t('lodgings:notifications.deleted'), {
        severity: 'info',
      });
    }
  };

  return (
    <LodgingFormView
      open={isOpen}
      onClose={close}
      onDelete={handleDelete}
      onSubmit={handleFormSubmit}
      initialData={editingLodging}
      loading={createMutation.isPending || updateMutation.isPending}
      allEmployees={employees}
      sites={constructions}
    />
  );
};

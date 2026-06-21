import { useDialogs } from '@/shared/ui/dialogs/useDialogs';
import useNotifications from '@/shared/ui/notifications/useNotifications';
import LodgingFormView from './LodgingFormView';
import { useCreateLodging } from '../model/services/useCreateLodging';
import { useUpdateLodging } from '../model/services/useUpdateLodging';
import { useDeleteLodging } from '../model/services/useDeleteLodgings';
import type { Lodging } from '../model/types';
import type { Construction } from '@/entities/construction';
import type { Employee } from '@/entities/employee';
import { useLodgingsContext } from '../model/providers/LodgingsContext';

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: Lodging;
  employees: Employee[];
  constructions: Construction[];
  editingLodging?: Lodging;
}

export const ManageLodgingDialog = () => {
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
      notifications.show('Zapisano pomyślnie!', { severity: 'success' });
    } catch {
      notifications.show('Błąd podczas zapisywania', { severity: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await dialogs.confirm(
      'Czy na pewno chcesz usunąć ten nocleg?',
      {
        okText: 'Usuń',
        cancelText: 'Anuluj',
        title: 'Usuwanie noclegu',
        severity: 'error',
      }
    );
    if (confirmed) {
      await deleteMutation.mutateAsync(id);
      close();
      notifications.show('Usunięto nocleg', { severity: 'info' });
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

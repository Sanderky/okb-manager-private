import { useDialogs } from '@/shared/ui/dialogs/useDialogs';
import useNotifications from '@/shared/ui/notifications/useNotifications';
import LodgingFormView from './LodgingFormView';
import { useCreateLodging } from '../model/useCreateLodging';
import { useUpdateLodging } from '../model/useUpdateLodging';
import { useDeleteLodging } from '../model/useDeleteLodgings';
import type { Lodging } from '../model/types';
import type { Construction } from '@/entities/construction';
import type { Employee } from '@/entities/employee';

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: Lodging;
  employees: Employee[];
  constructions: Construction[];
  editingLodging?: Lodging;
}

export const ManageLodgingDialog = ({
  open,
  onClose,
  initialData,
  employees,
  constructions,
  editingLodging,
}: Props) => {
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
      onClose();
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
      onClose();
      notifications.show('Usunięto nocleg', { severity: 'info' });
    }
  };

  return (
    <LodgingFormView
      open={open}
      onClose={onClose}
      onDelete={handleDelete}
      onSubmit={handleFormSubmit}
      initialData={initialData}
      loading={createMutation.isPending || updateMutation.isPending}
      allEmployees={employees}
      sites={constructions}
    />
  );
};

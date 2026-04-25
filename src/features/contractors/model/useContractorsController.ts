import { useState, useCallback } from 'react';
import { useDialogs } from '@/shared/ui/dialogs/useDialogs';
import useNotifications from '@/shared/ui/notifications/useNotifications';
import {
  useAddContractor,
  useContractors,
  useDeleteContractor,
  useUpdateContractor,
  type Contractor,
} from '@/entities/contractor';
import { useConstructions } from '@/entities/construction';

export const useContractorsController = () => {
  const dialogs = useDialogs();
  const notifications = useNotifications();

  const [operatingId, setOperatingId] = useState<string | null>(null);

  const {
    data: contractors,
    isError: isFetchingError,
    isLoading: isFetching,
  } = useContractors();
  const addMutation = useAddContractor();
  const updateMutation = useUpdateContractor();
  const deleteMutation = useDeleteContractor();

  const { constructions } = useConstructions();

  const getConstructionsForContractor = useCallback(
    (contractorId: string) => {
      return (
        constructions?.filter((c) => c.contractorId === contractorId) || []
      );
    },
    [constructions]
  );

  const handleSaveNote = useCallback(
    async (contractorId: string, newNote: string) => {
      setOperatingId(contractorId);
      try {
        await updateMutation.mutateAsync({
          id: contractorId,
          data: { note: newNote },
        });
        notifications.show('Notatka zapisana', { severity: 'success' });
      } catch (error: any) {
        notifications.show('Błąd zapisu: ' + error.message, {
          severity: 'error',
        });
      } finally {
        setOperatingId(null);
      }
    },
    [updateMutation, notifications]
  );

  const handleEdit = useCallback(
    (newName: string, contractor: Contractor) => {
      if (!newName || !contractor) return;
      const trimmedName = newName.trim();

      if (trimmedName === contractor.name || !trimmedName) return;

      const exists = contractors?.some(
        (c) =>
          c.id !== contractor.id &&
          c.name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (exists) {
        notifications.show('Taki wykonawca już istnieje!', {
          severity: 'warning',
          autoHideDuration: 3000,
        });
        return;
      }

      setOperatingId(contractor.id);

      updateMutation.mutate(
        { id: contractor.id, data: { name: trimmedName } },
        {
          onSuccess: () => {
            notifications.show('Zapisano zmiany', { severity: 'success' });
          },
          onError: (error: any) => {
            notifications.show('Błąd zapisu: ' + error.message, {
              severity: 'error',
            });
          },
          onSettled: () => {
            setOperatingId(null);
          },
        }
      );
    },
    [contractors, updateMutation, notifications]
  );

  const handleDelete = useCallback(
    async (contractor: Contractor) => {
      if (!contractor) return false;
      const confirmation = await dialogs.confirm(
        `Czy na pewno chcesz usunąć wykonawcę ${contractor.name}?`,
        {
          title: `Usuwanie wykonawcy`,
          severity: 'error',
          okText: 'Usuń',
          cancelText: 'Anuluj',
        }
      );

      if (confirmation) {
        try {
          await deleteMutation.mutateAsync(contractor.id);
          notifications.show('Wykonawca został usunięty', {
            severity: 'success',
          });
          return true;
        } catch (error) {
          notifications.show('Błąd podczas usuwania', { severity: 'error' });
          return false;
        }
      }
      return false;
    },
    [dialogs, deleteMutation, notifications]
  );

  const handleAdd = useCallback(
    (newName: string, onSuccess?: (id: string) => void) => {
      if (!newName) return;
      const trimmedName = newName.trim();

      if (!trimmedName) return;

      const exists = contractors?.some(
        (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (exists) {
        notifications.show('Taki wykonawca już istnieje!', {
          severity: 'warning',
        });
        return;
      }

      addMutation.mutate(trimmedName, {
        onSuccess: (data) => {
          notifications.show('Dodano wykonawcę', { severity: 'success' });
          if (onSuccess) onSuccess(data);
        },
        onError: (error: any) => {
          notifications.show(error.message, { severity: 'error' });
        },
      });
    },
    [addMutation, notifications, contractors]
  );

  return {
    isFetching,
    isFetchingError,
    isLoading:
      updateMutation.isPending ||
      deleteMutation.isPending ||
      addMutation.isPending,
    operatingId,
    contractors,
    handleAdd,
    handleDelete,
    handleEdit,
    handleSaveNote,
    getConstructionsForContractor,
  };
};

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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

export const useContractorsService = () => {
  const { t } = useTranslation(['contractors', 'common']);
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
        notifications.show(t('notifications.noteSaved'), {
          severity: 'success',
        });
      } catch (error: any) {
        notifications.show(
          t('notifications.saveError', { message: error.message }),
          {
            severity: 'error',
          }
        );
      } finally {
        setOperatingId(null);
      }
    },
    [updateMutation, notifications, t]
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
        notifications.show(t('notifications.alreadyExists'), {
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
            notifications.show(t('notifications.changesSaved'), {
              severity: 'success',
            });
          },
          onError: (error: any) => {
            notifications.show(
              t('notifications.saveError', { message: error.message }),
              {
                severity: 'error',
              }
            );
          },
          onSettled: () => {
            setOperatingId(null);
          },
        }
      );
    },
    [contractors, updateMutation, notifications, t]
  );

  const handleDelete = useCallback(
    async (contractor: Contractor) => {
      if (!contractor) return false;
      const confirmation = await dialogs.confirm(
        t('dialogs.deleteConfirm', { name: contractor.name }),
        {
          title: t('dialogs.deleteTitle'),
          severity: 'error',
          okText: t('common:buttons.delete'),
          cancelText: t('common:buttons.cancel'),
        }
      );

      if (confirmation) {
        try {
          await deleteMutation.mutateAsync(contractor.id);
          notifications.show(t('notifications.deleted'), {
            severity: 'success',
          });
          return true;
        } catch (error) {
          notifications.show(t('notifications.deleteError'), {
            severity: 'error',
          });
          return false;
        }
      }
      return false;
    },
    [dialogs, deleteMutation, notifications, t]
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
        notifications.show(t('notifications.alreadyExists'), {
          severity: 'warning',
        });
        return;
      }

      addMutation.mutate(trimmedName, {
        onSuccess: (data) => {
          notifications.show(t('notifications.added'), { severity: 'success' });
          if (onSuccess) onSuccess(data);
        },
        onError: (error: any) => {
          notifications.show(error.message, { severity: 'error' });
        },
      });
    },
    [addMutation, notifications, contractors, t]
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

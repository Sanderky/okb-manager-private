import { useTranslation } from 'react-i18next';
import useNotifications from '@/shared/ui/notifications/useNotifications';
import { Note } from '@/shared/ui/Note';
import { useUpdateHomeNote } from '../model/services/useUpdateHomeNote';
import { useHomeNote } from '../model/services/useHomeNote';

export const HomeNote = () => {
  const { t } = useTranslation('home');

  const notifications = useNotifications();
  const updateNoteMutation = useUpdateHomeNote();
  const { data: home, isLoading: noteLoading } = useHomeNote();

  const handleSave = async (note: string) => {
    try {
      await updateNoteMutation.mutateAsync(note);

      notifications.show(t('notifications.success'), {
        severity: 'success',
        autoHideDuration: 5000,
      });
    } catch {
      notifications.show(t('notifications.error'), {
        severity: 'error',
        autoHideDuration: 5000,
      });
    }
  };

  return (
    <Note
      content={home?.note ?? ''}
      onSave={handleSave}
      loading={updateNoteMutation.isPending || noteLoading}
      dashedBorder={false}
    />
  );
};

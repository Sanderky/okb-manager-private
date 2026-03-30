import useNotifications from '@/shared/ui/notifications/useNotifications';
import { Note } from '@/shared/ui/Note';
import { useUpdateHomeNote } from '../model/useUpdateHomeNote';
import { useHomeNote } from '../model/useHomeNote';

export const HomeNote = () => {
  const notifications = useNotifications();
  const updateNoteMutation = useUpdateHomeNote();
  const { data: home, isLoading: noteLoading } = useHomeNote();

  const handleSave = async (note: string) => {
    try {
      await updateNoteMutation.mutateAsync(note);
      notifications.show('Notatka została zaktualizowana.', {
        severity: 'success',
        autoHideDuration: 5000,
      });
    } catch {
      notifications.show('Wystąpił błąd podczas zapisywania notatki.', {
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

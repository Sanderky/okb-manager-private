import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useNotifications from '@/shared/ui/notifications/useNotifications';
import { Note } from '@/shared/ui/Note';
import { getHomeNote, saveHomeNote } from '../api/home';

export const HomeNote = () => {
  const notifications = useNotifications();
  const queryClient = useQueryClient();

  const { data: home, isLoading: noteLoading } = useQuery({
    queryKey: ['home', 'note'],
    queryFn: getHomeNote,
  });

  const updateNoteMutation = useMutation({
    mutationFn: (newNote: string) => saveHomeNote(newNote),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['home', 'note'],
      });
      notifications.show('Notatka została zaktualizowana.', {
        severity: 'success',
        autoHideDuration: 5000,
      });
    },
    onError: (error: Error) => {
      console.error('Update note error:', error);
      notifications.show('Wystąpił błąd podczas zapisywania notatki.', {
        severity: 'error',
        autoHideDuration: 5000,
      });
    },
  });

  return (
    <Note
      content={home?.note ?? ''}
      onSave={(note) => updateNoteMutation.mutate(note)}
      loading={updateNoteMutation.isPending || noteLoading}
      dashedBorder={false}
    />
  );
};

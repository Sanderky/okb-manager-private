import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveHomeNote } from '../../api';

export const useUpdateHomeNote = () => {
  const queryClient = useQueryClient();

  const updateNoteMutation = useMutation({
    mutationFn: (newNote: string) => saveHomeNote(newNote),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['home', 'note'],
      });
    },
    onError: (error: Error) => {
      console.error('Update note error:', error);
    },
  });

  return updateNoteMutation;
};

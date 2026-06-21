import { useMutation } from '@tanstack/react-query';
import { updateDisplayName, updateEmail } from '../../api';

export const useUpdateDisplayName = () => {
  return useMutation({
    mutationFn: async (name: string) => updateDisplayName(name),
  });
};

export const useUpdateEmail = () => {
  return useMutation({
    mutationFn: async (email: string) => updateEmail(email),
  });
};

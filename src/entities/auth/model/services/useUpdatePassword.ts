import { useMutation } from '@tanstack/react-query';
import { resetPassword } from '../../api';

export const useUpdatePassword = () => {
  return useMutation({
    mutationFn: (email: string) => resetPassword(email),
  });
};

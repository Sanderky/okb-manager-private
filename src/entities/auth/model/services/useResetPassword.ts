import { useMutation } from '@tanstack/react-query';
import { resetPassword } from '../../api';

export const useResetPassword = () => {
  return useMutation({
    mutationFn: (email: string) => resetPassword(email),
  });
};

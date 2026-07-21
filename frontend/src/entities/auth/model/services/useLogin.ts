import { useMutation } from '@tanstack/react-query';
import { login } from '../../api';

export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) =>
      login(credentials.email, credentials.password),
  });
};

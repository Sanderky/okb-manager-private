import { AuthApi } from '@/entities/auth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const PasswordRecoveryListener = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = AuthApi.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return null;
};

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getRules, validateField, useResetPassword } from '@/entities/auth';
import useNotifications from '@/shared/ui/notifications/useNotifications';

export const useForgotPassword = (onSuccessCallback: () => void) => {
  const { t } = useTranslation('auth');
  const notifications = useNotifications();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');

  const resetMutation = useResetPassword();

  const resetForm = useCallback(() => {
    setEmail('');
    setEmailError(false);
    setEmailErrorMessage('');
  }, []);

  const validateEmail = () => {
    const error = validateField(email, getRules('email', t));
    if (error) {
      setEmailError(true);
      setEmailErrorMessage(error);
      return false;
    }
    setEmailError(false);
    setEmailErrorMessage('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;

    try {
      await resetMutation.mutateAsync(email);

      notifications.show(
        t('forgotPassword.successMessage'),
        {
          severity: 'success',
          autoHideDuration: 6000,
        }
      );

      resetForm();
      onSuccessCallback();
    } catch (error: any) {
      console.error('Reset password error:', error);
      let msg = t('errors.resetPasswordError');

      if (error.status === 429) {
        msg = t('errors.rateLimitWait');
      } else if (error.message) {
        msg = error.message; 
      }

      notifications.show(msg, {
        severity: 'error',
        autoHideDuration: 6000,
      });
    }
  };

  return {
    email,
    setEmail,
    emailError,
    emailErrorMessage,
    handleSubmit,
    resetForm,
    isLoading: resetMutation.isPending,
  };
};
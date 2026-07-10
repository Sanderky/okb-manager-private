import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getRules, validateField, useLogin } from '@/entities/auth';
import { DEMO_EMAIL, DEMO_PASSWORD } from '@/shared/api/mock/mockDb';
import * as FilesApi from '@/shared/api/storage';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

type FormValues = {
  email: string;
  password: string;
};

export const useLoginFacade = () => {
  const { t } = useTranslation(['auth']);
  const [values, setValues] = useState<FormValues>({
    email: isMock ? DEMO_EMAIL : '',
    password: isMock ? DEMO_PASSWORD : '',
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof FormValues, string>>
  >({});
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useLogin();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const validateInputs = () => {
    const newErrors: Partial<Record<keyof FormValues, string>> = {};
    Object.keys(values).forEach((key) => {
      const field = key as keyof FormValues;
      const validationError = validateField(values[field], getRules(field, t));
      if (validationError) newErrors[field] = validationError;
    });
    setErrors(newErrors);
    setError('');
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    try {
      await loginMutation.mutateAsync(values);
      setValues({ email: '', password: '' });
      setErrors({});
      setError('');
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err.message || '';
      const status = err.status;

      if (msg === 'Invalid login credentials' || status === 400) {
        setError(t('auth:errors.invalidCredentials'));
      } else if (msg.includes('Email not confirmed')) {
        setError(t('auth:errors.emailNotConfirmed'));
      } else if (status === 429 || msg.includes('Too many requests')) {
        setError(t('auth:errors.tooManyLoginAttempts'));
      } else if (
        msg.includes('Network request failed') ||
        msg.includes('fetch failed') ||
        msg.includes('network')
      ) {
        setError(t('auth:errors.networkError'));
      } else if (status >= 500) {
        setError(t('auth:errors.serverError'));
      } else {
        setError(t('auth:errors.unexpectedLoginError'));
      }
    }
  };

  const getRodoFilePublicUrl = FilesApi.getRodoFilePublicUrl;

  return {
    values,
    errors,
    error,
    showPassword,
    setShowPassword,
    handleChange,
    handleSubmit,
    isLoading: loginMutation.isPending,
    getRodoFilePublicUrl
  };
};

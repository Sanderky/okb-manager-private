import { useState } from 'react';
import { getRules, validateField, useLogin } from '@/entities/auth';
import { DEMO_EMAIL, DEMO_PASSWORD } from '@/shared/api/mock/mockDb';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

type FormValues = {
  email: string;
  password: string;
};

export const useLoginFacade = () => {
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
      const validationError = validateField(values[field], getRules(field));
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
        setError('Niepoprawny email lub hasło.');
      } else if (msg.includes('Email not confirmed')) {
        setError(
          'Twój adres email nie został jeszcze potwierdzony. Sprawdź skrzynkę odbiorczą.'
        );
      } else if (status === 429 || msg.includes('Too many requests')) {
        setError(
          'Zbyt wiele nieudanych prób logowania. Spróbuj ponownie za chwilę.'
        );
      } else if (
        msg.includes('Network request failed') ||
        msg.includes('fetch failed') ||
        msg.includes('network')
      ) {
        setError('Problem z połączeniem. Sprawdź swój internet.');
      } else if (status >= 500) {
        setError('Wystąpił błąd po stronie serwera. Spróbuj ponownie później.');
      } else {
        setError('Wystąpił nieoczekiwany błąd podczas logowania.');
      }
    }
  };

  return {
    values,
    errors,
    error,
    showPassword,
    setShowPassword,
    handleChange,
    handleSubmit,
    isLoading: loginMutation.isPending,
  };
};

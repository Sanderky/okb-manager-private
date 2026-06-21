import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getRules, validateField, useUpdatePassword } from '@/entities/auth';

export const useResetPasswordService = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showBackButton = searchParams.get('ref') === 'settings';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const updatePasswordMutation = useUpdatePassword();

  const handleBack = () => navigate(-1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setPasswordError('');
    setConfirmPasswordError('');
    setGeneralError('');

    let hasError = false;

    const validationError = validateField(password, getRules('password'));
    if (validationError) {
      setPasswordError(validationError);
      hasError = true;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Hasła nie są identyczne.');
      hasError = true;
    }

    if (hasError) return;

    try {
      await updatePasswordMutation.mutateAsync(password);
      navigate('/home');
    } catch (err: any) {
      console.error('Update password error:', err);

      const msg = err.message || '';

      if (msg.includes('Password should be at least')) {
        setPasswordError('Hasło jest za krótkie (minimum 6 znaków).');
      } else if (msg.includes('different from the old password')) {
        setGeneralError('Nowe hasło musi różnić się od starego hasła.');
      } else if (
        msg.includes('Auth session missing') ||
        msg.includes('User not authenticated') ||
        err.status === 401 ||
        err.status === 403
      ) {
        setGeneralError(
          'Link resetujący wygasł lub jest nieprawidłowy. Poproś o zmianę hasła ponownie.'
        );
      } else if (err.status === 429) {
        setGeneralError('Zbyt wiele prób. Odczekaj chwilę.');
      } else if (
        msg.includes('Network request failed') ||
        msg.includes('fetch failed')
      ) {
        setGeneralError('Błąd połączenia. Sprawdź internet.');
      } else {
        setGeneralError('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
      }
    }
  };

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    passwordError,
    confirmPasswordError,
    generalError,
    showBackButton,
    handleBack,
    handleSubmit,
    isLoading: updatePasswordMutation.isPending,
  };
};

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getRules, validateField, useUpdatePassword } from '@/entities/auth';

export const useResetPasswordService = () => {
  const { t } = useTranslation(['auth']);
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

    const validationError = validateField(password, getRules('password', t));
    if (validationError) {
      setPasswordError(validationError);
      hasError = true;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError(t('auth:errors.passwordsMismatch'));
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
        setPasswordError(t('auth:errors.passwordTooShort'));
      } else if (msg.includes('different from the old password')) {
        setGeneralError(t('auth:errors.passwordSameAsOld'));
      } else if (
        msg.includes('Auth session missing') ||
        msg.includes('User not authenticated') ||
        err.status === 401 ||
        err.status === 403
      ) {
        setGeneralError(t('auth:errors.resetLinkExpired'));
      } else if (err.status === 429) {
        setGeneralError(t('auth:errors.rateLimitWait'));
      } else if (
        msg.includes('Network request failed') ||
        msg.includes('fetch failed')
      ) {
        setGeneralError(t('auth:errors.networkError'));
      } else {
        setGeneralError(t('auth:errors.unexpected'));
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

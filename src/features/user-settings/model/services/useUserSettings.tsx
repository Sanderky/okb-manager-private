import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/entities/auth';
import { useUpdateDisplayName, useUpdateEmail } from '@/entities/auth';
import useNotifications from '@/shared/ui/notifications/useNotifications';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

const getErrorMessage = (error: any, t: TFunction): string => {
  const msg = error?.message || error?.error_description || '';
  if (msg.includes('rate limit')) return t('auth:errors.rateLimit');
  if (msg.includes('requires a valid email'))
    return t('auth:errors.invalidEmail');
  if (msg.includes('already registered') || msg.includes('already in use'))
    return t('auth:errors.emailTaken');
  if (msg.includes('Password')) return t('auth:errors.weakPassword');
  return t('auth:errors.unexpected');
};

export const useUserSettings = (isOpen: boolean) => {
  const { t } = useTranslation(['auth', 'common']);
  const { user } = useAuth();
  const navigate = useNavigate();
  const notifications = useNotifications();

  const updateNameMutation = useUpdateDisplayName();
  const updateEmailMutation = useUpdateEmail();

  const [emailEditMode, setEmailEditMode] = useState(false);
  const [usernameEditMode, setUsernameEditMode] = useState(false);
  const [verificationEmailInfo, setVerificationEmailInfo] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [fieldsErrors, setFieldsErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && user) {
      const metaName =
        user.user_metadata?.display_name || user.user_metadata?.full_name || '';
      setDisplayName(metaName);
      setEmail(user.email || '');
      setEmailEditMode(false);
      setUsernameEditMode(false);
      setVerificationEmailInfo(false);
      setFieldsErrors({});
    }
  }, [isOpen, user]);

  const handleCancelUsername = () => {
    setFieldsErrors((prev) => ({ ...prev, name: '' }));
    setDisplayName(
      user?.user_metadata?.display_name || user?.user_metadata?.full_name || ''
    );
    setUsernameEditMode(false);
  };

  const handleCancelEmail = () => {
    setFieldsErrors((prev) => ({ ...prev, email: '' }));
    setEmail(user?.email || '');
    setEmailEditMode(false);
  };

  const handleSaveUsername = async () => {
    if (!user) return;
    setFieldsErrors((prev) => ({ ...prev, name: '' }));

    if (!displayName) {
      setFieldsErrors((prev) => ({
        ...prev,
        name: t('auth:errors.emptyUsername'),
      }));
      return;
    }

    const currentName =
      user.user_metadata?.display_name || user.user_metadata?.full_name || '';
    if (displayName === currentName) {
      setFieldsErrors((prev) => ({
        ...prev,
        name: t('auth:errors.sameUsername'),
      }));
      return;
    }

    try {
      await updateNameMutation.mutateAsync(displayName.trim());
      notifications.show(t('auth:success.usernameUpdated'), {
        severity: 'success',
      });
      setUsernameEditMode(false);
    } catch (error) {
      setFieldsErrors((prev) => ({ ...prev, name: getErrorMessage(error, t) }));
      notifications.show(t('auth:errors.updateFailed'), { severity: 'error' });
    }
  };

  const handleSaveEmail = async () => {
    if (!user) return;
    setFieldsErrors((prev) => ({ ...prev, email: '' }));

    if (email === user.email) {
      setFieldsErrors((prev) => ({
        ...prev,
        email: t('auth:errors.sameEmail'),
      }));
      return;
    }
    if (!email) {
      setFieldsErrors((prev) => ({
        ...prev,
        email: t('auth:errors.emptyEmail'),
      }));
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setFieldsErrors((prev) => ({
        ...prev,
        email: t('auth:errors.emailFormat'),
      }));
      return;
    }

    try {
      await updateEmailMutation.mutateAsync(email.trim());
      setVerificationEmailInfo(true);
      setEmailEditMode(false);
    } catch (error) {
      setFieldsErrors((prev) => ({
        ...prev,
        email: getErrorMessage(error, t),
      }));
      notifications.show(t('auth:errors.emailUpdateFailed'), {
        severity: 'error',
      });
    }
  };

  const handleResetPassword = () => navigate('/reset-password?ref=settings');

  return {
    user,
    displayName,
    setDisplayName,
    email,
    setEmail,
    emailEditMode,
    setUsernameEditMode,
    setEmailEditMode,
    usernameEditMode,
    verificationEmailInfo,
    setVerificationEmailInfo,
    fieldsErrors,
    isUsernameLoading: updateNameMutation.isPending,
    isEmailLoading: updateEmailMutation.isPending,
    handleCancelUsername,
    handleCancelEmail,
    handleSaveUsername,
    handleSaveEmail,
    handleResetPassword,
  };
};

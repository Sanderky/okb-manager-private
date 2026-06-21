import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/entities/auth';
import { useUpdateDisplayName, useUpdateEmail } from '@/entities/auth';
import useNotifications from '@/shared/ui/notifications/useNotifications';

const getErrorMessage = (error: any): string => {
  const msg = error?.message || error?.error_description || '';
  if (msg.includes('rate limit'))
    return 'Zbyt wiele prób. Spróbuj ponownie później.';
  if (msg.includes('requires a valid email'))
    return 'Podany adres email jest nieprawidłowy.';
  if (msg.includes('already registered') || msg.includes('already in use'))
    return 'Ten adres email jest już zajęty.';
  if (msg.includes('Password')) return 'Hasło jest zbyt słabe.';
  return 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.';
};

export const useUserSettings = (isOpen: boolean) => {
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
        name: 'Wprowadź nazwę użytkownika',
      }));
      return;
    }

    const currentName =
      user.user_metadata?.display_name || user.user_metadata?.full_name || '';
    if (displayName === currentName) {
      setFieldsErrors((prev) => ({
        ...prev,
        name: 'Nowa nazwa jest taka sama jak stara',
      }));
      return;
    }

    try {
      await updateNameMutation.mutateAsync(displayName.trim());
      notifications.show('Pomyślnie zaktualizowano nazwę użytkownika', {
        severity: 'success',
      });
      setUsernameEditMode(false);
    } catch (error) {
      setFieldsErrors((prev) => ({ ...prev, name: getErrorMessage(error) }));
      notifications.show('Wystąpił błąd podczas aktualizacji danych', {
        severity: 'error',
      });
    }
  };

  const handleSaveEmail = async () => {
    if (!user) return;
    setFieldsErrors((prev) => ({ ...prev, email: '' }));

    if (email === user.email) {
      setFieldsErrors((prev) => ({
        ...prev,
        email: 'Nowy email jest taki sam jak stary',
      }));
      return;
    }
    if (!email) {
      setFieldsErrors((prev) => ({ ...prev, email: 'Wprowadź adres email' }));
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setFieldsErrors((prev) => ({
        ...prev,
        email: 'Nieprawidłowy format email.',
      }));
      return;
    }

    try {
      await updateEmailMutation.mutateAsync(email.trim());
      setVerificationEmailInfo(true);
      setEmailEditMode(false);
    } catch (error) {
      setFieldsErrors((prev) => ({ ...prev, email: getErrorMessage(error) }));
      notifications.show('Wystąpił błąd podczas zmiany emaila', {
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

import React, { useState, useEffect } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';
import {
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  TextField,
  Button,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { getRules, validateField } from './validation';
import useLoading from '../../hooks/useLoading';

interface ForgotPasswordProps {
  open: boolean;
  handleClose: () => void;
}

const ForgotPassword = ({ open, handleClose }: ForgotPasswordProps) => {
  const { t } = useTranslation();
  const {
    loading: actionLoading,
    startLoading: startActionLoading,
    stopLoading: stopActionLoading,
  } = useLoading(false);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [toast, setToast] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastSeverity, setToastSeverity] = useState<
    'success' | 'error' | undefined
  >(undefined);

  useEffect(() => {
    if (open) {
      setEmail('');
      setEmailError(false);
      setEmailErrorMessage('');
    }
  }, [open]);

  const validateEmail = () => {
    const error = validateField(email, getRules('email'));
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
    setToast(false);

    if (!validateEmail()) return;

    startActionLoading();
    try {
      await sendPasswordResetEmail(auth, email);
      setToastMsg(t('login.forgotPassword.resetSuccess'));
      setToastSeverity('success');

      setEmail('');
      setEmailError(false);
      setEmailErrorMessage('');
    } catch (error) {
      const firebaseError = error as { code?: string; message: string };

      setToastMsg(
        firebaseError.code === 'auth/invalid-email'
          ? t('login.forgotPassword.invalidEmail')
          : t('login.forgotPassword.error')
      );
      setToastSeverity('error');
    } finally {
      setToast(true);
      stopActionLoading();
      handleClose();
    }
  };

  return (
    <>
      <Snackbar
        open={toast}
        autoHideDuration={3000}
        onClose={() => setToast(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={toastSeverity} variant="filled" sx={{ width: '100%' }}>
          {toastMsg}
        </Alert>
      </Snackbar>

      <Dialog open={open} onClose={handleClose}>
        <form noValidate onSubmit={handleSubmit}>
          <DialogTitle>{t('login.forgotPassword.title')}</DialogTitle>
          <DialogContent>
            <DialogContentText className="mb-2">
              {t('login.forgotPassword.description')}
            </DialogContentText>
            <TextField
              size="small"
              autoFocus
              required
              id="email"
              name="email"
              label={t('login.forgotPassword.emailLabel')}
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError}
              helperText={emailErrorMessage}
              disabled={actionLoading}
            />
          </DialogContent>
          <DialogActions className="mr-4 mb-4 font-semibold">
            {!actionLoading && (
              <Button
                onClick={handleClose}
                loading={actionLoading}
                color="inherit"
              >
                {t('login.forgotPassword.cancelButton')}
              </Button>
            )}
            <Button type="submit" loading={actionLoading} variant="contained">
              {t('login.forgotPassword.continueButton')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default ForgotPassword;

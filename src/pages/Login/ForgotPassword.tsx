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
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { getRules, validateField } from './validation';
import { useAuth } from '../../context/AuthContext';

interface ForgotPasswordProps {
  open: boolean;
  handleClose: () => void;
}

const ForgotPassword = ({ open, handleClose }: ForgotPasswordProps) => {
  const { t } = useTranslation();
  const { loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [toast, setToast] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastSeverity, setToastSeverity] = useState<
    'success' | 'error' | undefined
  >(undefined);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail('');
      setEmailError(false);
      setEmailErrorMessage('');
    }
  }, [open]);

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
    setToast(false);

    if (!validateEmail()) return;

    setActionLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setToastMsg(t('login.forgotPassword.resetSuccess'));
      setToastSeverity('success');

      // Reset form after success
      setEmail('');
      setEmailError(false);
      setEmailErrorMessage('');
    } catch (error: any) {
      console.error('❌ Reset password error:', error.code, error.message);
      setToastMsg(
        error.code === 'auth/invalid-email'
          ? t('login.forgotPassword.invalidEmail')
          : t('login.forgotPassword.error')
      );
      setToastSeverity('error');
    } finally {
      setToast(true);
      setActionLoading(false);
      handleClose();
    }
  };

  if (authLoading) return null;

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
            <button
              type="button"
              onClick={handleClose}
              className="mr-4 cursor-pointer rounded-xl hover:underline"
              disabled={actionLoading}
            >
              {t('login.forgotPassword.cancelButton')}
            </button>
            <button
              type="submit"
              className="flex cursor-pointer items-center justify-center rounded-lg border border-indigo-500 px-5 py-2 text-indigo-500 hover:bg-indigo-500 hover:text-white"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <CircularProgress size={20} />
              ) : (
                t('login.forgotPassword.continueButton')
              )}
            </button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default ForgotPassword;

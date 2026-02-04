import React, { useState, useEffect } from 'react';
import { resetPassword } from '../../api/auth';
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
import { getRules, validateField } from './validation';
import useLoading from '../../hooks/useLoading';

interface ForgotPasswordProps {
  open: boolean;
  handleClose: () => void;
}

const ForgotPassword = ({ open, handleClose }: ForgotPasswordProps) => {
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
      await resetPassword(email);

      setToastMsg(
        'Link do resetowania hasła został wysłany na Twój adres e-mail.'
      );
      setToastSeverity('success');

      setEmail('');
      setEmailError(false);
      setEmailErrorMessage('');
    } catch (error: any) {
      console.error('Reset password error:', error);

      let msg = 'Wystąpił błąd podczas próby zresetowania hasła.';

      if (error.status === 429) {
        msg = 'Zbyt wiele prób. Spróbuj ponownie za chwilę.';
      } else if (error.message) {
        msg = error.message;
      }

      setToastMsg(msg);
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
        autoHideDuration={6000}
        onClose={() => setToast(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={toastSeverity} variant="filled" sx={{ width: '100%' }}>
          {toastMsg}
        </Alert>
      </Snackbar>

      <Dialog
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              width: '95%',
              m: 0,
            },
          },
        }}
      >
        <form noValidate onSubmit={handleSubmit}>
          <DialogTitle>Zresetuj hasło</DialogTitle>
          <DialogContent>
            <DialogContentText className="mb-6">
              Wprowadź swój adres e-mail poniżej, a my wyślemy Ci link do
              zresetowania hasła.
            </DialogContentText>
            <TextField
              size="small"
              autoFocus
              required
              id="email"
              name="email"
              label={'Adres e-mail'}
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
                Anuluj
              </Button>
            )}
            <Button type="submit" loading={actionLoading} variant="contained">
              Kontynuuj
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default ForgotPassword;

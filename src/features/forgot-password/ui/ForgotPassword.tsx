import { useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Button,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useForgotPassword } from '../model/services/useForgotPassword';

interface ForgotPasswordProps {
  open: boolean;
  handleClose: () => void;
}

const ForgotPassword = ({ open, handleClose }: ForgotPasswordProps) => {
  const { t } = useTranslation(['auth', 'common']);

  const {
    email,
    setEmail,
    emailError,
    emailErrorMessage,
    handleSubmit,
    resetForm,
    isLoading,
  } = useForgotPassword(handleClose);

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, resetForm]);

  return (
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
        <DialogTitle>{t('forgotPassword.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText className="mb-6">
            {t('forgotPassword.description')}
          </DialogContentText>
          <TextField
            size="small"
            autoFocus
            required
            id="email"
            name="email"
            label={t('forgotPassword.emailLabel')}
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
            helperText={emailErrorMessage}
            disabled={isLoading}
          />
        </DialogContent>
        <DialogActions className="mr-4 mb-4 font-semibold">
          {!isLoading && (
            <Button onClick={handleClose} color="inherit">
              {t('common:buttons.cancel')}
            </Button>
          )}
          <Button type="submit" loading={isLoading} variant="contained">
            {t('forgotPassword.continue')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ForgotPassword;

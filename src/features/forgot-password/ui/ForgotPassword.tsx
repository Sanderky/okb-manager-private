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
import { useForgotPassword } from '../model/services/useForgotPassword';

interface ForgotPasswordProps {
  open: boolean;
  handleClose: () => void;
}

const ForgotPassword = ({ open, handleClose }: ForgotPasswordProps) => {
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
            label="Adres e-mail"
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
              Anuluj
            </Button>
          )}
          <Button type="submit" loading={isLoading} variant="contained">
            Kontynuuj
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ForgotPassword;

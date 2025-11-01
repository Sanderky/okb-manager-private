import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  Typography,
  Button,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

export interface BaseDialogProps {
  // Podstawowe props
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;

  // Akcje
  actions?: React.ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'secondary' | 'error' | 'success' | 'warning';
  showConfirm?: boolean;
  showCancel?: boolean;

  // Konfiguracja
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fullWidth?: boolean;
  dividers?: boolean;
  showCloseButton?: boolean;
  loading?: boolean;
  disabled?: boolean;

  // Styling
  titleSx?: object;
  contentSx?: object;
  actionsSx?: object;
}

export const BaseDialog: React.FC<BaseDialogProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  onConfirm,
  onCancel,
  confirmText = 'Zapisz',
  cancelText = 'Anuluj',
  confirmColor = 'primary',
  showConfirm = true,
  showCancel = true,
  maxWidth = 'sm',
  fullWidth = true,
  dividers = true,
  showCloseButton = true,
  loading = false,
  disabled = false,
  titleSx = { px: 3, py: 2 },
  contentSx = { px: 3 },
  actionsSx = { px: 3, py: 2 },
}) => {
  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  const handleConfirm = () => {
    onConfirm?.();
  };

  const renderActions = () => {
    if (actions) return actions;

    return (
      <>
        {showCancel && (
          <Button
            onClick={handleCancel}
            disabled={loading || disabled}
            variant="outlined"
          >
            {cancelText}
          </Button>
        )}
        {showConfirm && onConfirm && (
          <Button
            onClick={handleConfirm}
            disabled={loading || disabled}
            variant="contained"
            color={confirmColor}
            startIcon={loading ? <CircularProgress size={16} /> : undefined}
          >
            {confirmText}
          </Button>
        )}
      </>
    );
  };

  const renderTitle = () => {
    if (typeof title === 'string') {
      return (
        <Typography variant="h6" component="div" fontWeight="600">
          {title}
        </Typography>
      );
    }
    return title;
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={titleSx}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent={'space-between'}
        >
          {renderTitle()}
          {showCloseButton && (
            <IconButton onClick={onClose} disabled={loading} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </Stack>
      </DialogTitle>

      <DialogContent dividers={dividers} sx={contentSx}>
        {children}
      </DialogContent>

      {(actions || onConfirm) && (
        <DialogActions sx={actionsSx}>{renderActions()}</DialogActions>
      )}
    </Dialog>
  );
};

// Helper components dla często używanych typów dialogów
export const ConfirmationDialog: React.FC<
  Omit<BaseDialogProps, 'children'> & {
    message: React.ReactNode;
    confirmColor?: 'primary' | 'error' | 'warning' | 'success';
  }
> = ({ message, confirmColor = 'primary', ...props }) => {
  return (
    <BaseDialog {...props} confirmColor={confirmColor} showCloseButton={false}>
      {typeof message === 'string' ? (
        <Typography variant="body1">{message}</Typography>
      ) : (
        message
      )}
    </BaseDialog>
  );
};

export const LoadingDialog: React.FC<
  Omit<BaseDialogProps, 'children' | 'actions'> & {
    message?: string;
  }
> = ({ message = 'Trwa przetwarzanie...', ...props }) => {
  return (
    <BaseDialog
      {...props}
      showCloseButton={false}
      showConfirm={false}
      showCancel={false}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <CircularProgress size={24} />
        <Typography variant="body1">{message}</Typography>
      </Stack>
    </BaseDialog>
  );
};

export default BaseDialog;

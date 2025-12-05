import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import BaseDialog from './BaseDialog';
import { useCallback, useState } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import {
  updateContractor,
  deleteContractor,
  addContractor,
  getContractors,
} from '../services/contractors';
import { useDialogs } from '../hooks/useDialogs/useDialogs';
import type { Contractor } from '../types';
import useNotifications from '../hooks/useNotifications/useNotifications';

const useContractors = () => {
  const queryClient = useQueryClient();
  const dialogs = useDialogs();
  const notifications = useNotifications();

  const {
    data: contractors,
    isLoading: isFetching,
    isError: isFetchingError,
  } = useQuery({
    queryKey: ['contractors'],
    queryFn: getContractors,
  });

  const addMutation = useMutation({
    mutationFn: addContractor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
    },
    onError: (error: Error) => {
      notifications.show(error.message, { severity: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateContractor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      queryClient.invalidateQueries({ queryKey: ['constructions'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContractor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      queryClient.invalidateQueries({ queryKey: ['constructions'] });
    },
  });

  const handleEdit = useCallback(
    (newName: string, contractor: Contractor) => {
      if (!newName || !contractor) return;
      const trimmedName = newName.trim();

      if (trimmedName === contractor.name) {
        return;
      }

      if (!trimmedName) return;

      const exists = contractors?.some(
        (c) =>
          c.id !== contractor.id &&
          c.name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (exists) {
        notifications.show('Taki wykonawca już istnieje!', {
          severity: 'warning',
          autoHideDuration: 3000,
        });
        return;
      }

      updateMutation.mutate({ id: contractor.id, name: trimmedName });
    },
    [contractors, updateMutation, notifications]
  );

  const handleDelete = useCallback(
    async (contractor: Contractor) => {
      if (!contractor) return;
      const confirmation = await dialogs.confirm(
        `Czy na pewno chcesz usunąć wykonawcę ${contractor.name}?`,
        {
          title: `Usuwanie wykonawcy`,
          severity: 'error',
          okText: 'Usuń',
          cancelText: 'Anuluj',
        }
      );
      if (confirmation) deleteMutation.mutate(contractor.id);
    },
    [dialogs, deleteMutation]
  );

  const handleAdd = useCallback(
    (newName: string, onSuccess?: (id: string) => void) => {
      if (!newName) return;
      const trimmedName = newName.trim();

      if (!trimmedName) return;

      const exists = contractors?.some(
        (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (exists) {
        notifications.show('Taki wykonawca już istnieje!', {
          severity: 'warning',
        });
        return;
      }

      addMutation.mutate(trimmedName, {
        onSuccess: (data) => {
          if (onSuccess) onSuccess(data);
        },
      });
    },
    [addMutation, notifications, contractors]
  );

  return {
    isFetching,
    isFetchingError,
    isLoading:
      updateMutation.isPending ||
      deleteMutation.isPending ||
      addMutation.isPending,
    contractors,
    handleAdd,
    handleDelete,
    handleEdit,
  };
};

const ContractorRow = ({
  contractor,
  index,
}: {
  contractor: Contractor;
  index: number;
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [localName, setLocalName] = useState(contractor.name);
  const { isLoading, handleDelete, handleEdit } = useContractors();

  const onEdit = () => {
    handleEdit(localName, contractor);
    setIsEditMode(false);
  };

  const onDelete = () => {
    handleDelete(contractor);
  };

  return (
    <TableRow hover>
      <TableCell
        sx={{
          textAlign: 'center',
        }}
      >
        {index + 1}
      </TableCell>
      <TableCell sx={{ minWidth: 160, width: 'min-content' }}>
        {isLoading ? (
          <CircularProgress size={10} />
        ) : (
          <TextField
            size="small"
            value={isEditMode ? localName : contractor.name}
            variant="standard"
            fullWidth
            autoFocus={isEditMode}
            disabled={isLoading}
            onChange={(e) => setLocalName(e.target.value)}
            slotProps={{
              input: {
                readOnly: !isEditMode,
                disableUnderline: !isEditMode,
              },
            }}
            sx={{
              '& .MuiInputBase-input': {
                cursor: isEditMode ? 'pointer' : 'default',
              },
            }}
          />
        )}
      </TableCell>
      <TableCell sx={{ minWidth: 160 }} className="border-b">
        {isEditMode ? (
          <Button onClick={onEdit} loading={isLoading}>
            Zapisz
          </Button>
        ) : (
          <Button color="inherit" onClick={() => setIsEditMode(true)}>
            Edytuj
          </Button>
        )}
        <Button color="error" onClick={onDelete} disabled={isLoading}>
          Usuń
        </Button>
      </TableCell>
    </TableRow>
  );
};

const ContractorsList = () => {
  const [newName, setNewName] = useState('');
  const { isFetching, isFetchingError, handleAdd, contractors, isLoading } =
    useContractors();

  const onAdd = () => {
    handleAdd(newName);
    setNewName('');
  };

  if (isFetching)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  if (isFetchingError)
    return <Alert severity="error">Nie udało się pobrać danych.</Alert>;

  return (
    <Box>
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          maxHeight: '55vh',
          overflow: 'auto',
          borderRadius: 0,
        }}
      >
        <Table
          size="small"
          stickyHeader
          sx={{
            '& .MuiTableBody-root .MuiTableRow-root:last-child .MuiTableCell-root':
              {
                borderBottom: 'none !important',
              },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell width="5%">Lp.</TableCell>
              <TableCell width="65%">Nazwa</TableCell>
              <TableCell width="30%" className="border-b">
                Akcje
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!contractors || contractors.length == 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  sx={{
                    textAlign: 'center',
                    py: 3,
                  }}
                >
                  Brak danych
                </TableCell>
              </TableRow>
            ) : (
              contractors?.map((contractor, index) => (
                <ContractorRow
                  key={contractor.id}
                  contractor={contractor}
                  index={index}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Stack
        direction={'row'}
        spacing={3}
        sx={{
          px: 2,
          pb: 1,
          pt: 2,
        }}
      >
        <TextField
          size="small"
          fullWidth
          label="Nowy wykonawca"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          variant="outlined"
          onKeyDown={(e) => e.key === 'Enter' && onAdd()}
          disabled={isLoading}
        />

        <Button
          variant="contained"
          onClick={onAdd}
          disabled={!newName.trim()}
          loading={isLoading}
        >
          Dodaj
        </Button>
      </Stack>
    </Box>
  );
};

interface ContractorsDialogProps {
  open: boolean;
  onClose: () => void;
}
export const ContractorsDialog = ({
  open,
  onClose,
}: ContractorsDialogProps) => {
  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Wykonawcy"
      showCancel={false}
      contentSx={{
        p: 0,
      }}
    >
      <ContractorsList />
    </BaseDialog>
  );
};

interface AddContractorDialogProps {
  open: boolean;
  onClose: () => void;
  onAddSuccess?: (newId: string) => void;
}
export const AddContractorDialog = ({
  open,
  onClose,
  onAddSuccess,
}: AddContractorDialogProps) => {
  const [newName, setNewName] = useState('');
  const { handleAdd, isLoading } = useContractors();

  const onAdd = () => {
    handleAdd(newName, (newId) => {
      if (onAddSuccess) onAddSuccess(newId);
      setNewName('');
      onClose();
    });
    setNewName('');
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Dodaj wykonawcę"
      showCancel={false}
      actions={
        <Button
          variant="contained"
          onClick={onAdd}
          disabled={!newName.trim()}
          loading={isLoading}
        >
          Dodaj
        </Button>
      }
    >
      <TextField
        size="small"
        fullWidth
        label="Nowy wykonawca"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        variant="outlined"
        onKeyDown={(e) => e.key === 'Enter' && onAdd()}
        disabled={isLoading}
      />
    </BaseDialog>
  );
};

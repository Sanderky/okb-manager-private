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
import { useState } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import {
  updateContractor,
  deleteContractor,
  addContractor,
  getContractors,
} from '../services/contractors';
import { useDialogs } from '../hooks/useDialogs/useDialogs';
import type { Contractor } from '../types';

const ContractorRow = ({
  contractor,
  index,
}: {
  contractor: Contractor;
  index: number;
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [localName, setLocalName] = useState(contractor.name);
  const queryClient = useQueryClient();
  const dialogs = useDialogs();

  const updateMutation = useMutation({
    mutationFn: updateContractor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      queryClient.invalidateQueries({ queryKey: ['constructions'] });
      setIsEditMode(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContractor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      queryClient.invalidateQueries({ queryKey: ['constructions'] });
    },
  });

  const handleSave = () => {
    if (localName !== contractor.name) {
      if (localName.trim()) {
        updateMutation.mutate({ id: contractor.id, name: localName });
      }
    } else {
      setIsEditMode(false);
    }
  };

  const handleDelete = async () => {
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
  };

  return (
    <TableRow hover>
      <TableCell
        className="border-r border-b border-r-gray-500 border-b-gray-500"
        sx={{
          textAlign: 'center',
        }}
      >
        {index + 1}
      </TableCell>
      <TableCell
        className="border-r border-b border-r-gray-500 border-b-gray-500"
        sx={{ minWidth: 160, width: 'min-content' }}
      >
        {isEditMode ? (
          <TextField
            size="small"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            variant="standard"
            fullWidth
            autoFocus
            disabled={updateMutation.isPending}
          />
        ) : (
          <TextField
            size="small"
            value={contractor.name}
            variant="standard"
            fullWidth
            InputProps={{
              readOnly: true,
              disableUnderline: true,
            }}
            sx={{
              '& .MuiInputBase-input': { cursor: 'default' },
            }}
          />
        )}
      </TableCell>
      <TableCell
        sx={{ minWidth: 160 }}
        className="border-b border-r-gray-500 border-b-gray-500"
      >
        {isEditMode ? (
          <Button onClick={handleSave} loading={updateMutation.isPending}>
            Zapisz
          </Button>
        ) : (
          <Button color="inherit" onClick={() => setIsEditMode(true)}>
            Edytuj
          </Button>
        )}
        <Button
          color="error"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
        >
          Usuń
        </Button>
      </TableCell>
    </TableRow>
  );
};

const ContractorAdd = () => {
  const [newName, setNewName] = useState('');
  const queryClient = useQueryClient();

  const {
    data: contractors,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['contractors'],
    queryFn: getContractors,
  });

  const addMutation = useMutation({
    mutationFn: addContractor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      setNewName('');
    },
  });

  const handleAdd = () => {
    if (newName.trim()) {
      addMutation.mutate(newName);
    }
  };

  if (isLoading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  if (isError)
    return <Alert severity="error">Nie udało się pobrać danych.</Alert>;

  return (
    <Box>
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          //  maxHeight: 600,
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
              <TableCell
                width="5%"
                className="border-r border-b border-r-gray-500 border-b-gray-500"
              >
                Lp.
              </TableCell>
              <TableCell
                width="65%"
                className="border-r border-b border-r-gray-500 border-b-gray-500"
              >
                Nazwa
              </TableCell>
              <TableCell width="30%" className="border-b border-b-gray-500">
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
            {/* {contractors?.map((contractor, index) => (
              <ContractorRow
                key={contractor.id}
                contractor={contractor}
                index={index}
              />
            ))} */}
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
        className="border-t border-t-gray-500"
      >
        <TextField
          size="small"
          fullWidth
          label="Nowy wykonawca"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          variant="outlined"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          disabled={addMutation.isPending}
        />

        <Button
          variant="contained"
          onClick={handleAdd}
          disabled={!newName.trim()}
          loading={addMutation.isPending}
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
      <ContractorAdd />
    </BaseDialog>
  );
};

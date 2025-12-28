import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import BaseDialog from './BaseDialog';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import {
  updateContractor,
  deleteContractor,
  addContractor,
  getContractors,
} from '../services/contractors';
import { useDialogs } from '../hooks/useDialogs/useDialogs';
import type { Construction, Contractor } from '../types';
import useNotifications from '../hooks/useNotifications/useNotifications';
import { Note } from './Note';
import { ArrowBack, EditDocument } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const useContractors = () => {
  const queryClient = useQueryClient();
  const dialogs = useDialogs();
  const notifications = useNotifications();

  const [operatingId, setOperatingId] = useState<string | null>(null);

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
    mutationFn: ({ id, data }: { id: string; data: Partial<Contractor> }) =>
      updateContractor(id, data),
    onMutate: (variables) => {
      setOperatingId(variables.id);
    },
    onSettled: () => {
      setOperatingId(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      queryClient.invalidateQueries({ queryKey: ['constructions'] });
      notifications.show('Zapisano zmiany', { severity: 'success' });
    },
    onError: (error) => {
      notifications.show('Błąd zapisu: ' + error.message, { severity: 'error' });
    }
  });

  const handleSaveNote = useCallback(
    async (contractorId: string, newNote: string) => {
      await updateMutation.mutateAsync({ id: contractorId, data: { note: newNote } });
    },
    [updateMutation]
  );

  const deleteMutation = useMutation({
    mutationFn: deleteContractor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      queryClient.invalidateQueries({ queryKey: ['constructions'] });
      notifications.show('Wykonawca został usunięty', { severity: 'success' });

    },
    onError: () => {
      notifications.show('Błąd podczas usuwania', { severity: 'error' });
    }
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

      updateMutation.mutate({ id: contractor.id, data: { name: trimmedName } });
    },
    [contractors, updateMutation, notifications]
  );

  const handleDelete = useCallback(
    async (contractor: Contractor) => {
      if (!contractor) return false;
      const confirmation = await dialogs.confirm(
        `Czy na pewno chcesz usunąć wykonawcę ${contractor.name}?`,
        {
          title: `Usuwanie wykonawcy`,
          severity: 'error',
          okText: 'Usuń',
          cancelText: 'Anuluj',
        }
      );
      if (confirmation) {
        await deleteMutation.mutateAsync(contractor.id)
        return true
      };
      return false
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
    operatingId,
    contractors,
    handleAdd,
    handleDelete,
    handleEdit,
    handleSaveNote
  };
};

interface ContractorsListProps {
  setOpenNote: (contractorId: string) => void,
  isLoading: boolean,
  isFetching: boolean,
  contractors: Contractor[] | undefined,
  isFetchingError: boolean,
  handleAdd: (newName: string) => void
}
const ContractorsList = ({ setOpenNote, handleAdd, isFetching, isFetchingError, isLoading, contractors }: ContractorsListProps) => {
  const [newName, setNewName] = useState('');

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
              <TableCell width="55%">Nazwa</TableCell>
              <TableCell width="10%">Budowy</TableCell>
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
                <TableRow hover key={contractor.id}>
                  <TableCell
                    sx={{
                      textAlign: 'center',
                    }}
                  >
                    {index + 1}
                  </TableCell>
                  <TableCell sx={{ minWidth: 160, width: 'min-content' }}>
                    {contractor.name}
                  </TableCell>
                  <TableCell align='center'>{contractor.constructionsCount ?? '-'}</TableCell>
                  <TableCell sx={{ minWidth: 160 }} className="border-b">
                    <IconButton onClick={() => setOpenNote(contractor.id)} disabled={isLoading}>
                      <EditDocument />
                    </IconButton>
                  </TableCell>
                </TableRow>
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


const ITEMS_PER_PAGE = 10;

interface ContractorDetailsProps {
  contractor: Contractor;
  onSaveNote: (contractorId: string, newNote: string) => Promise<void>;
  onEdit: (newName: string, contractor: Contractor) => void;
  onDelete: (contractor: Contractor) => void;
  isLoading: boolean;
  constructions: Construction[] | undefined
}

const ContractorDetails = ({
  contractor,
  onEdit,
  onDelete,
  isLoading,
  onSaveNote,
  constructions: allConstructions
}: ContractorDetailsProps) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [localName, setLocalName] = useState(contractor.name);
  const [page, setPage] = useState(1);
  const handleSave = () => {
    onEdit(localName, contractor);
    setIsEditMode(false);
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setLocalName(contractor.name)
  };

  const constructions = useMemo(() => {
    return allConstructions?.filter(c => c.contractorId === contractor.id) || []
  }, [allConstructions, contractor])

  useEffect(() => {
    setPage(1);
  }, [contractor.id]);

  const count = Math.ceil(constructions.length / ITEMS_PER_PAGE);
  const paginatedConstructions = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return constructions.slice(start, end);
  }, [constructions, page]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  return (
    <Stack direction={'column'} spacing={2}>
      <TextField
        size="small"
        value={isEditMode ? localName : contractor.name}
        fullWidth
        label={'Nazwa'}
        disabled={isLoading || !isEditMode}
        onChange={(e) => setLocalName(e.target.value)}
      />

      <Stack direction={'row'} spacing={1} justifyContent={'space-between'}>
        <Stack direction={'row'} spacing={1}>

          {isEditMode ? (
            [
              <Button key='save' onClick={handleSave} variant="contained" size="small" disabled={isLoading}>
                Zapisz
              </Button>,
              <Button key='cancel' onClick={handleCancel} color='inherit' variant="outlined" size="small" disabled={isLoading}>
                Anuluj
              </Button>

            ]
          ) : (
            <Button key='edit' color="primary" variant="outlined" size="small" onClick={() => setIsEditMode(true)}>
              Edytuj nazwę
            </Button>
          )}
        </Stack>

        <Button key='delete' color="error" variant="outlined" size="small" onClick={() => onDelete(contractor)} disabled={isLoading}>
          Usuń wykonawcę
        </Button>
      </Stack>

      <Box pt={2} pb={2}>
        <Typography fontWeight={'600'} fontSize={'1.2rem'}>Lista budów:</Typography>
        {(!constructions || constructions?.length === 0) ? (
          <Typography>Brak budów</Typography>
        ) : (
          <>
            <List dense>
              {paginatedConstructions.map((c, index) => {
                const realIndex = (page - 1) * ITEMS_PER_PAGE + index + 1;

                return (
                  <ListItem key={c.id} divider={index !== paginatedConstructions.length - 1}>
                    <Link
                      to={`/constructions/${c.id}`}
                      style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}
                    >
                      <Typography
                        sx={{
                          textDecoration: c.status ? 'none' : 'line-through',
                          color: c.status ? 'text.primary' : 'text.disabled',
                          '&:hover': { color: 'primary.main' }
                        }}
                      >
                        {`${realIndex}. ${c.name}`}
                      </Typography>
                    </Link>
                  </ListItem>
                );
              })}
            </List>

            {count > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination
                  count={count}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  size="small"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}
      </Box>

      <Note
        content={contractor.note ?? ''}
        onSave={(note) => onSaveNote(contractor.id, note)}
      />

    </Stack>
  );
};






interface ContractorsDialogProps {
  open: boolean;
  onClose: () => void;
  constructions: Construction[] | undefined
}
export const ContractorsDialog = ({
  open,
  onClose,
  constructions
}: ContractorsDialogProps) => {
  const [activeNoteContractor, setActiveNoteContractor] = useState<string | null>(null);

  const hook =
    useContractors();
  const activeContractor = useMemo(() => {
    return hook.contractors?.find(c => c.id === activeNoteContractor)
  }, [activeNoteContractor, hook.contractors])

  const handleDelete = async (contractor: Contractor) => {
    const result = await hook.handleDelete(contractor)
    if (result) {
      setActiveNoteContractor(null)
    }
  }

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={'Wykonawcy'}
      showCancel={false}
      maxWidth={'md'}
      contentSx={{
        p: 0,
        position: 'relative',
        overflowY: activeContractor ? 'hidden' : 'auto'
      }}
    >
      {activeContractor && (
        <Box
          sx={(theme) => ({
            position: 'absolute',
            zIndex: 10,
            backgroundColor: theme.palette.background.paper,
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
          })}
        >
          <Stack
            direction={'row'}
            alignItems={'center'}
            gap={1}
            sx={(theme) => ({
              borderBottom: `1px solid ${theme.palette.divider}`,
              background: theme.palette.background.default,
              px: 1,
              flexShrink: 0,
            })}
          >
            <IconButton onClick={() => setActiveNoteContractor(null)}>
              <ArrowBack />
            </IconButton>
            <Typography>
              Szczegóły:
            </Typography>
            <Typography fontWeight="bold">
              {activeContractor.name}
            </Typography>
          </Stack>


          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              p: 2,
              minHeight: 0,
            }}
          >
            <ContractorDetails
              contractor={activeContractor}
              onDelete={handleDelete}
              onEdit={hook.handleEdit}
              onSaveNote={hook.handleSaveNote}
              isLoading={hook.isLoading}
              constructions={constructions}
            />
          </Box>
        </Box>
      )}
      <ContractorsList
        setOpenNote={setActiveNoteContractor}
        {...hook}
      />
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

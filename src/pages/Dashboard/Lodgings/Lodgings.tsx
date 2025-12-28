import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  IconButton,
  TextField,
  Stack,
  Autocomplete,
  Chip,
  Divider,
  FormControl,
  Checkbox,
} from '@mui/material';
import {
  Add,
  Edit,
  LocationOn,
  DateRange,
  Hotel,
  People,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { plPL } from '@mui/x-date-pickers/locales';

import PageContainer from '../../../components/PageContainer';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import { useDialogs } from '../../../hooks/useDialogs/useDialogs';
import { getEmployeeList } from '../../../services/employees';
import {
  getLodgings,
  createLodging,
  updateLodging,
  deleteLodging,
} from '../../../services/lodgings';
import type { Lodging, Employee } from '../../../types';
import Loading from '../../../components/Loading';
import BaseDialog from '../../../components/BaseDialog';
import { openGoogleMaps } from '../../../utils';
import { useNavigate } from 'react-router-dom';

dayjs.extend(isBetween);

interface LodgingFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Lodging>) => void;
  onDelete: (id: string) => void;
  initialData?: Lodging;
  loading: boolean;
  allEmployees: Employee[];
}

const LodgingFormDialog: React.FC<LodgingFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
  allEmployees,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs().add(1, 'week'));
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  React.useEffect(() => {
    if (open) {
      setName(initialData?.name || '');
      setAddress(initialData?.address || '');
      setDescription(initialData?.description || '');
      setStartDate(initialData ? dayjs(initialData.startDate) : dayjs());
      setEndDate(
        initialData ? dayjs(initialData.endDate) : dayjs().add(1, 'week')
      );
      setSelectedEmployeeIds(initialData?.employeeIds || []);
    }
  }, [open, initialData]);

  const handleSubmit = () => {
    if (!name || !startDate || !endDate) return;
    onSubmit({
      name,
      address,
      description,
      startDate: startDate.toDate(),
      endDate: endDate.toDate(),
      employeeIds: selectedEmployeeIds,
    });
  };

  const handleDelete = () => {
    if (initialData) {
      onClose();
      onDelete(initialData.id);
    }
  };

  const activeEmployees = useMemo(
    () => allEmployees.filter((e) => e.status),
    [allEmployees]
  );

  const selectedEmployeeObjects = useMemo(
    () => activeEmployees.filter((e) => selectedEmployeeIds.includes(e.id)),
    [activeEmployees, selectedEmployeeIds]
  );

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={initialData ? 'Edytuj nocleg' : 'Nowy nocleg'}
      actions={
        <Stack
          direction={'row'}
          justifyContent={initialData ? 'space-between' : 'flex-end'}
          sx={{ flex: 1 }}
        >
          {initialData && (
            <Button onClick={handleDelete} color="error" variant="outlined">
              Usuń
            </Button>
          )}
          <Stack direction={'row'} spacing={1}>
            <Button onClick={onClose} color="inherit" variant="outlined">
              Anuluj
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading || !name || !startDate || !endDate}
            >
              Zapisz
            </Button>
          </Stack>
        </Stack>
      }
    >
      <Stack spacing={2} mt={1}>
        <TextField
          label="Nazwa"
          size="small"
          fullWidth
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Adres"
          size="small"
          fullWidth
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <TextField
          label="Opis / Uwagi"
          size="small"
          fullWidth
          multiline
          minRows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          slotProps={{
            input: {
              spellCheck: false,
            },
          }}
        />

        <LocalizationProvider
          dateAdapter={AdapterDayjs}
          adapterLocale="pl"
          localeText={
            plPL.components.MuiLocalizationProvider.defaultProps.localeText
          }
        >
          <Stack direction="row" spacing={2}>
            <DatePicker
              label="Od"
              value={startDate}
              onChange={setStartDate}
              slotProps={{
                textField: { fullWidth: true, required: true, size: 'small' },
              }}
            />
            <DatePicker
              label="Do"
              value={endDate}
              onChange={setEndDate}
              slotProps={{
                textField: { fullWidth: true, required: true, size: 'small' },
              }}
              minDate={startDate || undefined}
            />
          </Stack>
        </LocalizationProvider>

        <FormControl sx={{ width: '100%', maxWidth: '100%' }}>
          <Autocomplete
            size="small"
            multiple
            disabled={loading}
            disableCloseOnSelect
            options={activeEmployees}
            getOptionLabel={(option) => option.name}
            value={selectedEmployeeObjects}
            onChange={(_, newValue) => {
              setSelectedEmployeeIds(newValue.map((e) => e.id));
            }}
            isOptionEqualToValue={(option, value) => option.id === value?.id}
            renderOption={(props, option, { selected }) => {
              const { key, ...optionProps } = props;
              return (
                <li key={key} {...optionProps}>
                  <Checkbox checked={selected} />
                  {option.name}
                  {!option.status && (
                    <Chip
                      label="Nieaktywny"
                      size="small"
                      color="default"
                      variant="outlined"
                      sx={{ ml: 1, height: 20 }}
                    />
                  )}
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Przypisani pracownicy"
                size="small"
              />
            )}
          />
        </FormControl>
      </Stack>
    </BaseDialog>
  );
};

interface LodgingCardProps {
  lodging: Lodging;
  employees: Employee[];
  onEdit: (l: Lodging) => void;
  onEmployeeClick: (id: string) => void;
}

const LodgingCard: React.FC<LodgingCardProps> = ({
  lodging,
  employees,
  onEdit,
  onEmployeeClick,
}) => {
  const assignedEmployees = useMemo(
    () => employees.filter((e) => lodging.employeeIds.includes(e.id)),
    [employees, lodging.employeeIds]
  );

  const isActive = dayjs().isBetween(
    lodging.startDate,
    lodging.endDate,
    'day',
    '[]'
  );

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: '0.3s',
        '&:hover': {
          borderColor: 'primary.main',
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box pr={2}>
            <Typography
              variant="h6"
              component="div"
              gutterBottom
              fontWeight={isActive ? 600 : 400}
              sx={{ lineHeight: 1.2 }}
            >
              {lodging.name}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
              <DateRange fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {dayjs(lodging.startDate).format('DD.MM')} -{' '}
                {dayjs(lodging.endDate).format('DD.MM.YYYY')}
              </Typography>
              {isActive && (
                <Chip
                  label="Aktywny"
                  color="success"
                  size="small"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              )}
            </Stack>
            {lodging.address && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Stack
                  spacing={1}
                  direction={'row'}
                  sx={{
                    cursor: 'pointer',
                  }}
                  onClick={() => openGoogleMaps(lodging.address)}
                >
                  <LocationOn fontSize="small" sx={{ color: 'navy' }} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      color: 'navy',
                    }}
                  >
                    {lodging.address}
                  </Typography>
                </Stack>
              </Stack>
            )}
          </Box>
          <Box>
            <IconButton size="small" onClick={() => onEdit(lodging)}>
              <Edit fontSize="small" />
            </IconButton>
          </Box>
        </Stack>

        {lodging.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {lodging.description}
          </Typography>
        )}

        <Divider sx={{ my: 1.5 }} />

        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <People fontSize="small" color="action" />
          <Typography variant="caption" fontWeight={600} color="text.secondary">
            ZAKWATEROWANI ({assignedEmployees.length}):
          </Typography>
        </Stack>

        <Box display="flex" flexWrap="wrap" gap={0.5}>
          {assignedEmployees.length > 0 ? (
            assignedEmployees.map((emp) => (
              <Chip
                onClick={() => onEmployeeClick(emp.id)}
                key={emp.id}
                label={emp.name}
                size="small"
                variant="outlined"
                sx={{
                  cursor: 'pointer',
                  transform: 'scale 0.5s ease',
                  ':hover': {
                    scale: '1.05',
                  },
                }}
              />
            ))
          ) : (
            <Typography
              variant="caption"
              color="text.disabled"
              fontStyle="italic"
            >
              Brak przypisanych pracowników
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

const LodgingsManager = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLodging, setEditingLodging] = useState<Lodging | undefined>(
    undefined
  );

  const navigate = useNavigate();
  const notifications = useNotifications();
  const dialogs = useDialogs();
  const queryClient = useQueryClient();

  const { data: lodgings = [], isLoading: loadingLodgings } = useQuery({
    queryKey: ['lodgings'],
    queryFn: getLodgings,
  });

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployeeList(),
  });

  const createMutation = useMutation({
    mutationFn: createLodging,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lodgings'] });
      notifications.show('Dodano nocleg', { severity: 'success' });
      setIsDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; data: Partial<Lodging> }) =>
      updateLodging(vars.id, vars.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lodgings'] });
      notifications.show('Zaktualizowano nocleg', { severity: 'success' });
      setIsDialogOpen(false);
      setEditingLodging(undefined);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLodging,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lodgings'] });
      notifications.show('Usunięto nocleg', { severity: 'info' });
    },
  });

  const handleOpenAdd = () => {
    setEditingLodging(undefined);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (lodging: Lodging) => {
    setEditingLodging(lodging);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await dialogs.confirm(
      'Czy na pewno chcesz usunąć ten nocleg?',
      {
        okText: 'Usuń',
        cancelText: 'Anuluj',
        title: 'Usuwanie noclegu',
      }
    );
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormSubmit = (data: Partial<Lodging>) => {
    if (editingLodging) {
      updateMutation.mutate({ id: editingLodging.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEmployeeClick = (id: string) => {
    navigate(`/employees/${id}`);
  };

  const stats = useMemo(() => {
    const today = dayjs();

    const activeLodgings = lodgings.filter((l) =>
      today.isBetween(dayjs(l.startDate), dayjs(l.endDate), 'day', '[]')
    );

    const allActiveEmployeeIds = activeLodgings.flatMap((l) => l.employeeIds);

    const uniqueAccommodatedCount = new Set(allActiveEmployeeIds).size;

    return {
      activeLodgingsCount: activeLodgings.length,
      accommodatedEmployees: uniqueAccommodatedCount,
      totalEmployees: employees.filter((e) => e.status).length,
      totalLodgings: lodgings.length,
    };
  }, [lodgings, employees]);

  const isLoading = loadingLodgings || loadingEmployees;

  if (isLoading)
    return (
      <PageContainer fixedHeight breadcrumbs={[{ title: 'Noclegi' }]}>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Loading />
        </Box>
      </PageContainer>
    );

  return (
    <PageContainer
      fixedHeight
      breadcrumbs={[{ title: 'Noclegi' }]}
      actions={
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenAdd}
          size="small"
        >
          Dodaj nocleg
        </Button>
      }
      renderBottomToolbar={
        <Box
          sx={(theme) => ({
            flexShrink: 0,
            background: theme.palette.background.paper,
            borderTop: `1px solid ${theme.palette.divider}`,
          })}
        >
          <Stack
            direction={'row'}
            alignItems={'center'}
            className="px-3"
            columnGap={2}
            rowGap={0.5}
            py={1}
          >
            <Stack
              direction={'row'}
              spacing={2}
              alignItems={'center'}
              flexWrap={'wrap'}
              divider={
                <Box
                  sx={(theme) => ({
                    borderRight: `1px solid ${theme.palette.divider}`,
                    height: '15px',
                  })}
                />
              }
            >
              <Typography
                variant="overline"
                className="font-medium text-gray-500"
                sx={{
                  lineHeight: 1,
                }}
              >
                {`Zakwaterowani dziś: ${stats.accommodatedEmployees}/${stats.totalEmployees}`}
              </Typography>
              <Typography
                variant="overline"
                className="font-medium text-gray-500"
                sx={{
                  lineHeight: 1,
                }}
              >
                {`Noclegi: ${stats.activeLodgingsCount}/${stats.totalLodgings}`}
              </Typography>
            </Stack>
          </Stack>
        </Box>
      }
    >
      <Box p={{ xs: 1, sm: 3 }} sx={{ height: '100%', overflowY: 'auto' }}>
        {lodgings.length === 0 ? (
          <Box textAlign="center" py={5}>
            <Hotel sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Brak zaplanowanych noclegów
            </Typography>
            <Button sx={{ mt: 2 }} onClick={handleOpenAdd}>
              Dodaj pierwszy nocleg
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {lodgings.map((lodging) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={lodging.id}>
                <LodgingCard
                  onEmployeeClick={handleEmployeeClick}
                  lodging={lodging}
                  employees={employees}
                  onEdit={handleOpenEdit}
                />
              </Grid>
            ))}
          </Grid>
        )}

        <LodgingFormDialog
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onDelete={handleDelete}
          onSubmit={handleFormSubmit}
          initialData={editingLodging}
          loading={createMutation.isPending || updateMutation.isPending}
          allEmployees={employees}
        />
      </Box>
    </PageContainer>
  );
};

export default LodgingsManager;

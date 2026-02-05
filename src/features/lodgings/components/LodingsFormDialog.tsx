import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  TextField,
  Stack,
  Autocomplete,
  Chip,
  Divider,
  FormControl,
  Tooltip,
} from '@mui/material';
import {
  Close,
  PersonAdd,
} from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/pl';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import type { Employee } from '../../../types';
import BaseDialog from '../../../shared/ui/BaseDialog';
import type { Construction } from '../../../entities/constructions';

interface LocalAssignment {
  employeeId: string;
  startDate: Dayjs;
  endDate: Dayjs;
}

interface LodgingFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  onDelete: (id: string) => void;
  initialData?: any;
  loading: boolean;
  allEmployees: Employee[];
  sites: Construction[];
}

const LodgingFormDialog: React.FC<LodgingFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
  allEmployees,
  onDelete,
  sites,
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs().add(1, 'week'));

  const [selectedSite, setSelectedSite] = useState<Construction | null>(null);

  const [assignments, setAssignments] = useState<LocalAssignment[]>([]);
  const [employeeToAdd, setEmployeeToAdd] = useState<Employee | null>(null);

  React.useEffect(() => {
    if (open) {
      setName(initialData?.name || '');
      setAddress(initialData?.address || '');
      setDescription(initialData?.description || '');

      const sDate = initialData ? dayjs(initialData.startDate) : dayjs();
      const eDate = initialData
        ? dayjs(initialData.endDate)
        : dayjs().add(1, 'week');
      setStartDate(sDate);
      setEndDate(eDate);

      const foundSite = initialData?.constructionSiteId
        ? sites.find((s) => s.id === initialData.constructionSiteId)
        : null;
      setSelectedSite(foundSite || null);

      if (initialData?.assignments) {
        setAssignments(
          initialData.assignments.map((a: any) => ({
            employeeId: a.employeeId,
            startDate: dayjs(a.startDate),
            endDate: dayjs(a.endDate),
          }))
        );
      } else {
        setAssignments([]);
      }
      setEmployeeToAdd(null);
    }
  }, [open, initialData, sites]);

  const handleSubmit = () => {
    if (!startDate || !endDate) return;

    const assignmentsPayload = assignments.map((a) => ({
      employeeId: a.employeeId,
      startDate: a.startDate.toDate(),
      endDate: a.endDate.toDate(),
    }));

    const employeeIds = assignments.map((a) => a.employeeId);

    onSubmit({
      name,
      address,
      description,
      startDate: startDate.toDate(),
      endDate: endDate.toDate(),
      employeeIds,
      assignments: assignmentsPayload,
      constructionSiteId: selectedSite?.id || null,
    });
  };

  const handleDelete = () => {
    if (initialData) {
      onClose();
      onDelete(initialData.id);
    }
  };

  const handleAddEmployee = () => {
    if (!employeeToAdd || !startDate || !endDate) return;

    if (assignments.some((a) => a.employeeId === employeeToAdd.id)) {
      return;
    }

    const newAssignment: LocalAssignment = {
      employeeId: employeeToAdd.id,
      startDate: startDate,
      endDate: endDate,
    };

    setAssignments([...assignments, newAssignment]);
    setEmployeeToAdd(null);
  };

  const handleRemoveAssignment = (empId: string) => {
    setAssignments(assignments.filter((a) => a.employeeId !== empId));
  };

  const handleAssignmentDateChange = (
    empId: string,
    field: 'startDate' | 'endDate',
    value: Dayjs | null
  ) => {
    if (!value) return;
    setAssignments(
      assignments.map((a) => {
        if (a.employeeId === empId) {
          return { ...a, [field]: value };
        }
        return a;
      })
    );
  };

  const activeEmployees = useMemo(
    () => allEmployees.filter((e) => e.status),
    [allEmployees]
  );

  const availableEmployees = useMemo(
    () =>
      activeEmployees.filter(
        (e) => !assignments.some((a) => a.employeeId === e.id)
      ),
    [activeEmployees, assignments]
  );

  const sortedSites = useMemo(() => {
    return [...sites]
      .sort((a, b) => (a.status === b.status ? 0 : a.status ? -1 : 1))
      .filter((c) => c.status);
  }, [sites]);

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={initialData ? 'Edytuj nocleg' : 'Nowy nocleg'}
      maxWidth="md"
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
              disabled={loading || !startDate || !endDate}
            >
              Zapisz
            </Button>
          </Stack>
        </Stack>
      }
    >
      <Stack spacing={2} mt={1}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Box flex={1}>
            <Autocomplete
              options={sortedSites}
              getOptionLabel={(option) => option.name}
              value={selectedSite}
              onChange={(_, newValue) => setSelectedSite(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Budowa" size="small" />
              )}
            />
          </Box>
          <Box flex={1}>
            <TextField
              label="Tytuł"
              size="small"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Box>
        </Stack>

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
          minRows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
          <Stack direction="row" spacing={2} alignItems="center">
            <DatePicker
              label="Od *"
              value={startDate}
              onChange={setStartDate}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
            <Typography>-</Typography>
            <DatePicker
              label="Do *"
              value={endDate}
              onChange={setEndDate}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Stack>
        </LocalizationProvider>

        <Divider sx={{ pt: 2 }} />

        <Typography fontWeight={500}>Lista zakwaterowanych</Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          alignItems="center"
        >
          <FormControl fullWidth size="small">
            <Autocomplete
              size="small"
              options={availableEmployees}
              getOptionLabel={(option) => option.name}
              value={employeeToAdd}
              onChange={(_, newValue) => setEmployeeToAdd(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Pracownik"
                  placeholder="Wyszukaj..."
                />
              )}
            />
          </FormControl>
          <Button
            variant="contained"
            size="medium"
            startIcon={<PersonAdd />}
            onClick={handleAddEmployee}
            disabled={!employeeToAdd}
            sx={{ minWidth: 120, width: { xs: '100%', sm: 'auto' } }}
          >
            Dodaj
          </Button>
        </Stack>

        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          {assignments.length === 0 ? (
            <Box p={3} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Brak przypisanych pracowników
              </Typography>
            </Box>
          ) : (
            <Stack divider={<Divider />}>
              {assignments.map((assign) => {
                const employee = allEmployees.find(
                  (e) => e.id === assign.employeeId
                );
                if (!employee) return null;

                return (
                  <Stack
                    key={assign.employeeId}
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    p={1}
                    alignItems={{ xs: 'normal', sm: 'center' }}
                  >
                    <Box
                      flex={{ xs: 0, sm: 1 }}
                      minWidth={0}
                      sx={{
                        display: 'flex',
                        alignItemsItems: 'center',
                        direction: 'row',
                      }}
                    >
                      <Typography
                        noWrap
                        sx={{
                          textAlign: 'left',
                        }}
                      >
                        {employee.name}
                      </Typography>
                      {!employee.status && (
                        <Chip
                          label="Nieaktywny"
                          size="small"
                          color="default"
                          sx={{ height: 16, fontSize: '0.6rem' }}
                        />
                      )}
                      <Box
                        sx={{
                          display: { xs: 'block', sm: 'none' },
                          ml: 'auto',
                        }}
                      >
                        <Tooltip title="Usuń pracownika z noclegu">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleRemoveAssignment(assign.employeeId)
                            }
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <DatePicker
                        value={assign.startDate}
                        onChange={(val) =>
                          handleAssignmentDateChange(
                            assign.employeeId,
                            'startDate',
                            val
                          )
                        }
                        slotProps={{
                          textField: {
                            size: 'small',
                            sx: { width: 140 },
                            variant: 'standard',
                          },
                        }}
                      />
                      <Typography variant="caption">-</Typography>
                      <DatePicker
                        value={assign.endDate}
                        onChange={(val) =>
                          handleAssignmentDateChange(
                            assign.employeeId,
                            'endDate',
                            val
                          )
                        }
                        slotProps={{
                          textField: {
                            size: 'small',
                            sx: { width: 140 },
                            variant: 'standard',
                          },
                          actionBar: { actions: [] },
                        }}
                      />
                    </Stack>
                    <Box
                      sx={{
                        display: { xs: 'none', sm: 'block' },
                      }}
                    >
                      <Tooltip title="Usuń pracownika z noclegu">
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleRemoveAssignment(assign.employeeId)
                          }
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Box>
      </Stack>
    </BaseDialog>
  );
};

export default LodgingFormDialog
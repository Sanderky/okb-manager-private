import React, { useMemo, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  TextField,
  Checkbox,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Autocomplete,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import FilterListIcon from '@mui/icons-material/FilterList';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import CloseIcon from '@mui/icons-material/Close';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/pl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getEmployeeList, updateEmployee } from '../../../api/employees';
import type { Construction, Employee } from '../../../types';
import { getConstructionList } from '../../../api/constructions';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import { positions } from '@mui/system';

dayjs.locale('pl');

const weekStart = (d: Dayjs) => d.startOf('week');
const weekEnd = (d: Dayjs) => d.endOf('week');

const formatWeekLabel = (d: Dayjs) =>
  `${weekStart(d).format('DD.MM')}–${weekEnd(d).format('DD.MM')}`;

const Schedule: React.FC = () => {
  // Zakres tygodni (domyślnie: bieżący tydzień + 3 kolejne)
  const [fromWeek, setFromWeek] = useState<Dayjs>(weekStart(dayjs()));

  const [toWeek, setToWeek] = useState<Dayjs>(
    weekStart(dayjs()).add(1, 'week')
  );

  // Filtrowanie pracowników
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);

  // const [values, setValues] = useState<
  //   Record<string, Record<string, Construction | null>>
  // >({});

  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery<
    Employee[]
  >({
    queryKey: ['employees'],
    queryFn: getEmployeeList,
    select: (data) => data.filter((e) => e.status),
  });

  const { data: constructions, isLoading: isLoadingConstructions } = useQuery<
    Construction[]
  >({
    queryKey: ['constructions'],
    queryFn: getConstructionList,
  });

  // Lista tygodni między from–to (włącznie)
  const weeks = useMemo(() => {
    let start = weekStart(fromWeek);
    let end = weekStart(toWeek);
    if (start.isAfter(end)) {
      const tmp = start;
      start = end;
      end = tmp;
    }
    const arr: Dayjs[] = [];
    let cur = start;
    while (cur.isSame(end, 'week') || cur.isBefore(end, 'week')) {
      arr.push(cur);
      cur = cur.add(1, 'week');
    }
    return arr;
  }, [fromWeek, toWeek]);

  // Filtrowanie pracowników
  const filteredEmployees = useMemo(() => {
    let tEmployees = employees.filter((e) => e.contractEndDate !== null);
    console.log(tEmployees);
    if (!selectedEmployees.length) return employees;
    const ids = new Set(selectedEmployees.map((e) => e.id));
    return employees.filter((e) => ids.has(e.id));
  }, [employees, selectedEmployees]);

  // const filteredEmployees = useMemo(() => {
  //   if (!selectedEmployees.length) return Array(15).fill(employees).flat();

  //   const ids = new Set(selectedEmployees.map((e) => e.id));
  //   const base = employees.filter((e) => ids.has(e.id));
  //   return Array(15).fill(base).flat();
  // }, [employees, selectedEmployees]);

  // const constructionsById = useMemo(() => {
  //   const map: Record<string, Construction> = {};
  //   constructions?.forEach((c) => {
  //     map[c.id] = c;
  //   });
  //   return map;
  // }, [constructions]);

  const notifications = useNotifications();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (
      updates: { id: string; constructionId: string }[]
    ): Promise<void> => {
      await Promise.all(
        updates.map(
          (u) => <></>
          // updateEmployee(u.id, { constructionId: u.constructionId })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      notifications.show('Przydziały zapisane.', {
        severity: 'success',
        autoHideDuration: 3000,
      });
      // Po zapisie możesz wyczyścić bufor zmian, jeśli chcesz:
      // setValues({});
    },
    onError: (error: Error) => {
      notifications.show(`Błąd zapisu: ${error.message}`, {
        severity: 'error',
        autoHideDuration: 3000,
      });
    },
  });

  const handleSave = () => {
    // console.log('form values', values);
    // // Zapisujemy tylko te zmiany, które faktycznie zmieniają constructionId
    // const updates = Object.entries(values).flatMap(([empId, construction]) => {
    //   if (!construction?.id) return [];
    //   const emp = employees.find((e) => e.id === empId);
    //   if (!emp) return [];
    //   if (emp.constructionId === construction.id) return [];
    //   return [{ id: empId, constructionId: construction.id }];
    // });
    // if (updates.length === 0) {
    //   notifications.show('Brak zmian do zapisania.', {
    //     severity: 'info',
    //     autoHideDuration: 2000,
    //   });
    //   return;
    // }
    // saveMutation.mutate(updates);
  };

  // 🔑 Obsługa zmiany wartości
  const handleCellChange = (
    empId: string,
    week: Dayjs,
    value: Construction | null
  ) => {
    const weekKey = week.format('YYYY-MM-DD');
    // setValues((prev) => ({
    //   ...prev,
    //   [empId]: {
    //     ...(prev[empId] || {}),
    //     [weekKey]: value,
    //   },
    // }));
  };

  if (isLoadingConstructions || isLoadingEmployees) {
    return (
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Typography>Ładowanie...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, overflow: 'hidden' }}>
      {/* Nagłówek i filtry */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
            <DatePicker
              label="Od tygodnia"
              value={fromWeek}
              onChange={(val) => val && setFromWeek(weekStart(val))}
              slotProps={{ textField: { size: 'small' } }}
            />
            <DatePicker
              label="Do tygodnia"
              value={toWeek}
              onChange={(val) => val && setToWeek(weekStart(val))}
              slotProps={{ textField: { size: 'small' } }}
              sx={{ ml: { xs: 0, sm: 1 } }}
            />
          </LocalizationProvider>

          <Button
            variant="outlined"
            size="small"
            startIcon={<FilterListIcon />}
            onClick={() => setIsFilterOpen(true)}
            sx={{ ml: { xs: 0, sm: 1 } }}
          >
            Filtr pracowników
          </Button>
          <IconButton
            size="small"
            onClick={() => setSelectedEmployees([])}
            title="Wyczyść filtr"
          >
            <FilterListOffIcon />
          </IconButton>
          <Button
            variant="contained"
            size="small"
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Zapisywanie...' : 'Zapisz'}
          </Button>
        </Stack>

        <Typography
          variant="h6"
          sx={{ textAlign: { xs: 'center', sm: 'right' } }}
        >
          Zakres: {formatWeekLabel(fromWeek)} – {formatWeekLabel(toWeek)}
        </Typography>
      </Stack>

      <TableContainer
        component={Box}
        sx={{
          maxHeight: 1000,
          overflow: 'auto',
        }}
        className="border-lightGray rounded-lg border"
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                  bgcolor: 'background.paper',
                }}
                className="border-r-lightGray border-r"
              >
                <Typography className="text-center font-bold">
                  Pracownik
                </Typography>
              </TableCell>
              {weeks.map((w, index) => (
                <TableCell
                  key={index}
                  className="border-r-lightGray border-r last:border-r-0"
                >
                  <Typography className="text-center font-bold">
                    {formatWeekLabel(w)}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredEmployees.map((emp) => (
              <TableRow
                key={emp.id}
                sx={{
                  '&:last-child td, &:last-child th': { border: 0 },
                }}
              >
                <TableCell
                  sx={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 2,
                    bgcolor: 'background.paper',
                    maxWidth: { xs: 170, sm: 250 },
                    width: { xs: 170, sm: 250 },
                    overflow: 'hidden',
                  }}
                  className="border-r-lightGray border-r"
                >
                  <Typography noWrap className="font-semibold">
                    {emp.name}
                  </Typography>
                </TableCell>

                {weeks.map((w) => {
                  // const currentValue =
                  //   values[emp.id] ??
                  //   (emp.constructionId
                  //     ? (constructionsById[emp.constructionId] ?? null)
                  //     : null);

                  // console.log('w', w);
                  const weekKey = w.format('YYYY-MM-DD');
                  // const currentValue = values[emp.id]?.[weekKey] ?? null;

                  return (
                    <TableCell
                      key={weekKey}
                      sx={{}}
                      className="border-r-lightGray border-r last:border-r-0"
                    >
                      {/* <Autocomplete
                        size="small"
                        fullWidth
                        disableClearable
                        options={[...(constructions ?? [])]}
                        getOptionLabel={(option) => option?.name ?? 'Brak'}
                        value={currentValue}
                        onChange={(_, newVal) =>
                          handleCellChange(emp.id, w, newVal)
                        }
                        isOptionEqualToValue={(option, value) =>
                          option?.id === value?.id
                        }
                        renderInput={(params) => (
                          <TextField {...params} placeholder="Wybierz..." />
                        )}
                      /> */}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h6">Filtr pracowników</Typography>
            <IconButton onClick={() => setIsFilterOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth>
            <Autocomplete<Employee, true, false, false>
              multiple
              disableCloseOnSelect
              options={employees}
              getOptionLabel={(o) => o.name}
              value={selectedEmployees}
              onChange={(_, newVal) => setSelectedEmployees(newVal)}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              renderOption={(props, option, { selected }) => {
                const { key, ...rest } = props;
                return (
                  <li key={key} {...rest}>
                    <Checkbox checked={selected} sx={{ mr: 1 }} />
                    {option.name}
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Pracownicy"
                  placeholder="Wybierz..."
                />
              )}
              limitTags={2}
            />
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedEmployees([])}>Wyczyść</Button>
          <Button variant="contained" onClick={() => setIsFilterOpen(false)}>
            Zastosuj
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Schedule;

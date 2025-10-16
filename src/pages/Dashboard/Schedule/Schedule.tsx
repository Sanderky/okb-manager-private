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
  CircularProgress,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import CloseIcon from '@mui/icons-material/Close';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/pl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getEmployeeList } from '../../../api/employees';
import type { Construction, Employee } from '../../../types';
import { getConstructionList } from '../../../api/constructions';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import WeekSelector from '../../../components/WeekSelector';

import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';

dayjs.locale('pl');

// const weekStart = (d: Dayjs) => d.startOf('week');
// const weekEnd = (d: Dayjs) => d.endOf('week');

// const formatWeekLabel = (d: Dayjs) =>
//   `${weekStart(d).format('DD.MM')}–${weekEnd(d).format('DD.MM')}`;

const Schedule: React.FC = () => {
  // Zakres tygodni (domyślnie: bieżący tydzień + 3 kolejne)
  const [fromWeek, setFromWeek] = useState<Date>(
    dayjs().startOf('week').toDate()
  );

  const [toWeek, setToWeek] = useState<Date>(dayjs().startOf('week').toDate());

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
    let start = dayjs(fromWeek);
    let end = dayjs(toWeek);
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

  return (
    <Box
      sx={{ p: { xs: 1, sm: 2, md: 3 }, overflow: 'hidden' }}
      className="relative"
    >
      {(isLoadingConstructions || isLoadingEmployees) && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            zIndex: 100,
            borderRadius: 'inherit',
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* Nagłówek i filtry */}
      <Stack
        alignItems={'center'}
        direction={'row'}
        flexWrap={'wrap'}
        justifyContent={'flex-start'}
        gap={2}
        mb={1}
        width={'100%'}
        className={
          'border-lightGray rounded-lg border bg-gray-100/40 px-3 py-4 md:py-3'
        }
      >
        <WeekSelector
          value={fromWeek}
          onChange={(val) => {
            if (!val) return;

            if (toWeek && dayjs(val).isAfter(toWeek, 'week')) {
              return;
            }

            setFromWeek(val);
          }}
        />

        <WeekSelector
          value={toWeek}
          onChange={(val) => {
            if (!val) return;

            if (fromWeek && dayjs(val).isBefore(fromWeek, 'week')) {
              return;
            }

            setToWeek(val);
          }}
        />
        <IconButton
          sx={{
            color: 'royalblue',
          }}
          size="small"
          onClick={() => setIsFilterOpen(true)}
          title="Wyczyść filtr"
        >
          <FilterListIcon />
        </IconButton>
        <Button
          variant="contained"
          size="small"
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Zapisywanie...' : 'Zapisz'}
        </Button>

        <Typography
          variant="h6"
          sx={{ textAlign: { xs: 'center', sm: 'right' } }}
        >
          {/* Zakres: {formatWeekLabel(fromWeek)} – {formatWeekLabel(toWeek)} */}
        </Typography>
      </Stack>

      <TableContainer
        component={Box}
        sx={{
          maxHeight: 1000,
          overflow: 'auto',
        }}
        className="border-dark rounded-lg border"
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                  background: 'white',
                  // background: '#ffebaf',
                }}
                className="border-r-dark border-b-dark border-r border-b p-2 md:p-3"
              >
                {/* <Typography className="text-center font-bold">
                  Pracownik
                </Typography> */}
              </TableCell>
              {weeks.map((w, index) => {
                console.log('w', w);
                return (
                  <TableCell
                    key={index}
                    className="border-r-dark border-b-dark relative border-r border-b bg-gray-100 p-2 last:border-r-0 md:p-3"
                    sx={{
                      '&:hover button': {
                        opacity: 1,
                        pointerEvents: 'all',
                      },
                    }}
                  >
                    <Typography className="text-center font-bold">
                      {w.format('DD.MM')}
                    </Typography>
                    <IconButton
                      sx={{
                        top: '50%',
                        transform: 'translateY(-50%)',
                        right: 10,
                        opacity: 0,
                        pointerEvents: 'none',
                        transition: '.5s',
                      }}
                      className="absolute text-gray-600"
                    >
                      <CalendarViewWeekIcon />
                    </IconButton>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredEmployees.map((emp) => (
              <TableRow
                key={emp.id}
                sx={{
                  '&:last-child td, &:last-child  th': {
                    borderBottom: '0 !important',
                  },
                }}
              >
                <TableCell
                  sx={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 2,
                    maxWidth: { xs: 170, sm: 250 },
                    width: { xs: 170, sm: 250 },
                    overflow: 'hidden',
                    background: 'white',
                    // background: '#FFFCF1',
                  }}
                  className="border-r-dark border-b-dark border-r border-b p-2 md:p-3"
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
                      sx={{
                        '&:hover': {
                          background: 'ghostwhite',
                        },
                      }}
                      className="border-r-dark border-b-dark cursor-pointer border-r border-b p-2 text-center last:border-r-0 md:p-3"
                    >
                      {weekKey + ' - ' + emp.name}
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
          <Button onClick={() => setSelectedEmployees([])}>Resetuj</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Schedule;

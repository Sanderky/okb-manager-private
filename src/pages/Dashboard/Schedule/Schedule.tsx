import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Alert,
  CircularProgress,
  Menu,
  Autocomplete,
  TextField,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
} from '@mui/material';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/pl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getEmployeeList } from '../../../api/employees';
import type {
  Construction,
  Employee,
  Vacation,
  Schedule,
} from '../../../types';
import { getConstructionList } from '../../../api/constructions';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import { getVacationList } from '../../../api/vacations';
import { getScheduleList, updateSchedule } from '../../../api/schedules';
import { Timestamp } from 'firebase/firestore';
import {
  daysToRanges,
  getScheduleByEmployeeAndWeek,
  type ICell,
} from './ScheduleHelpers';
import { TableControls } from './ScheduleTableControls';
import { EmployeeRow } from './ScheduleEmployeeRow';
import { FilterDialog } from './ScheduleFilterDialog';

dayjs.locale('pl');

const Schedule: React.FC = () => {
  const [fromWeek, setFromWeek] = useState<Date>(() => {
    const saved = localStorage.getItem('scheduleFromWeek');
    return saved ? new Date(saved) : dayjs().startOf('week').toDate();
  });
  const [toWeek, setToWeek] = useState<Date>(() => {
    const saved = localStorage.getItem('scheduleToWeek');
    return saved
      ? new Date(saved)
      : dayjs().add(2, 'week').startOf('week').toDate();
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [activeTable, setActiveTable] = useState<{
    type: number;
    week: Dayjs;
  }>({
    type: 0,
    week: dayjs().startOf('week'),
  });
  const [cellAnchorEl, setCellAnchorEl] = useState<null | HTMLElement>(null);
  const [activeCell, setActiveCell] = useState<ICell | null>(null);
  const [showVacations, setShowVacations] = useState(true);
  const [showDates, setShowDates] = useState(true);

  const notifications = useNotifications();
  const queryClient = useQueryClient();

  useEffect(() => {
    localStorage.setItem('scheduleFromWeek', fromWeek.toISOString());
  }, [fromWeek]);

  useEffect(() => {
    localStorage.setItem('scheduleToWeek', toWeek.toISOString());
  }, [toWeek]);

  const {
    data: employees = [],
    isLoading: isLoadingEmployees,
    isError: isErrorEmployees,
  } = useQuery<Employee[], Error>({
    queryKey: ['employees'],
    queryFn: () => getEmployeeList(true),
  });

  const {
    data: constructions = [],
    isLoading: isLoadingConstructions,
    isError: isErrorConstructions,
  } = useQuery<Construction[], Error>({
    queryKey: ['constructions'],
    queryFn: () => getConstructionList(),
  });

  const {
    data: vacations = [],
    isLoading: isLoadingVacations,
    isError: isErrorVacations,
  } = useQuery<Vacation[], Error>({
    queryKey: ['vacations'],
    queryFn: getVacationList,
  });

  const {
    data: schedules = [],
    isLoading: isLoadingSchedules,
    isError: isErrorSchedules,
  } = useQuery<Schedule[], Error>({
    queryKey: ['schedules'],
    queryFn: getScheduleList,
  });

  const weeks = useMemo(() => {
    const start = dayjs(fromWeek);
    const end = dayjs(toWeek);
    const arr: Dayjs[] = [];
    let cur = start;
    while (cur.isSame(end, 'week') || cur.isBefore(end, 'week')) {
      arr.push(cur);
      cur = cur.add(1, 'week');
    }
    return arr;
  }, [fromWeek, toWeek]);

  const filteredEmployees = useMemo(() => {
    if (!selectedEmployees.length) return employees;
    const ids = new Set(selectedEmployees.map((e) => e.id));
    return employees.filter((e) => ids.has(e.id));
  }, [employees, selectedEmployees]);

  const updateScheduleMutation = useMutation({
    mutationFn: updateSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      notifications.show('Harmonogram zaktualizowany.', {
        severity: 'success',
        autoHideDuration: 3000,
      });
    },
    onError: (error: Error) => {
      notifications.show(`Błąd zapisu harmonogramu: ${error.message}`, {
        severity: 'error',
        autoHideDuration: 3000,
      });
    },
  });

  const saveScheduleToDatabase = useCallback(
    async (
      empId: string,
      weekStart: Date,
      constructionIds: (string | null)[]
    ) => {
      try {
        const existing = getScheduleByEmployeeAndWeek(
          schedules,
          empId,
          weekStart
        );

        const scheduleData: Omit<Schedule, 'id'> & { id?: string } = {
          employeeId: empId,
          constructions: constructionIds,
          weekStart: weekStart,
          id: existing?.id,
        };

        await updateScheduleMutation.mutateAsync(scheduleData);
      } catch (err) {
        console.error('❌ Błąd zapisu harmonogramu:', err);
        notifications.show('Błąd podczas zapisu harmonogramu.', {
          severity: 'error',
          autoHideDuration: 3000,
        });
      }
    },
    [schedules, updateScheduleMutation, notifications]
  );

  const handleCellChange = useCallback(
    async (
      empId: string,
      date: Dayjs,
      value: Construction | null,
      isWeek: boolean
    ) => {
      const startOfWeek = date.startOf('week');
      const weekStartDate = startOfWeek.toDate();

      const existingSchedule = schedules.find(
        (s) =>
          s.employeeId === empId &&
          dayjs(s.weekStart).isSame(startOfWeek, 'week')
      );

      let newConstructions: (string | null)[];

      if (isWeek) {
        newConstructions = Array.from({ length: 7 }, (_, i) => {
          const day = startOfWeek.add(i, 'day');
          const isVacation = vacations?.some(
            (v) => v.employeeId === empId && day.isSame(dayjs(v.date), 'day')
          );

          if (i === 6) return null;

          return isVacation ? null : (value?.id ?? null);
        });
      } else {
        const existing = existingSchedule?.constructions ?? Array(7).fill(null);
        newConstructions = [...existing];
        const index = date.diff(startOfWeek, 'day');

        const isVacation = vacations?.some(
          (v) => v.employeeId === empId && date.isSame(dayjs(v.date), 'day')
        );

        newConstructions[index] = isVacation ? null : (value?.id ?? null);
      }

      await saveScheduleToDatabase(empId, weekStartDate, newConstructions);
    },
    [schedules, vacations, saveScheduleToDatabase]
  );

  const handleShowInputConstruction = useCallback(
    (event: React.MouseEvent<HTMLElement>, cell: ICell) => {
      event.stopPropagation();

      const hasVacation = vacations?.some(
        (v) =>
          v.employeeId === cell.empId && cell.date.isSame(dayjs(v.date), 'day')
      );

      if (!cell.isWeek && hasVacation) {
        return;
      }

      const target = event.currentTarget as HTMLElement;
      target.style.backgroundColor = '#ffd85f80';

      setCellAnchorEl(target);
      setActiveCell(cell);
    },
    [vacations]
  );

  const handleCellMenuClose = () => {
    if (cellAnchorEl) {
      cellAnchorEl.style = '';
    }
    setCellAnchorEl(null);
    setActiveCell(null);
  };

  const openCellMenu = Boolean(cellAnchorEl);

  const cellText = useCallback(
    ({ empId, weekKey, date, isWeek }: ICell) => {
      const weekStart = dayjs(weekKey);

      const schedule = schedules.find(
        (s) =>
          s.employeeId === empId && dayjs(s.weekStart).isSame(weekStart, 'week')
      );

      const weekConstructions =
        Array.from({ length: 7 }, (_, i) => {
          const day = weekStart.add(i, 'day');
          const cid = schedule?.constructions?.[i] ?? null;
          const construction =
            cid !== null
              ? (constructions.find((c) => c.id === cid) ?? null)
              : null;
          const isVacation = vacations?.some(
            (v) => v.employeeId === empId && day.isSame(dayjs(v.date), 'day')
          );
          return { day, name: construction?.name ?? null, isVacation };
        }) ?? [];

      // === widok tygodniowy ===
      if (isWeek) {
        const constructionsMap: Record<string, dayjs.Dayjs[]> = {};
        const vacationDays: dayjs.Dayjs[] = [];

        weekConstructions.forEach((w) => {
          if (w.isVacation) vacationDays.push(w.day);
          else if (w.name) {
            if (!constructionsMap[w.name]) constructionsMap[w.name] = [];
            constructionsMap[w.name].push(w.day);
          }
        });

        const hasNullDay = weekConstructions.some(
          (w) => !w.name && !w.isVacation
        );

        const parts: string[] = [];

        // === Urlop ===
        if (showVacations && vacationDays.length > 0) {
          const ranges = daysToRanges(vacationDays);
          const label = showDates ? `Urlop (${ranges.join(', ')})` : `Urlop`;
          parts.push(label);
        }

        // === Budowy ===
        const allConstructions = Object.entries(constructionsMap);
        const shouldShowRanges =
          allConstructions.length > 1 || vacationDays.length > 0 || hasNullDay;

        allConstructions.forEach(([name, days]) => {
          if (!shouldShowRanges || !showDates) {
            parts.push(name);
          } else {
            const ranges = daysToRanges(days);
            parts.push(`${name} (${ranges.join(', ')})`);
          }
        });

        return (
          <Typography className="font-medium" variant="body2">
            {parts.join(' / ') || '-'}
          </Typography>
        );
      }

      // === widok dzienny ===
      const dayData = weekConstructions.find((w) => w.day.isSame(date, 'day'));
      if (dayData?.isVacation) {
        return (
          <Typography className="font-medium text-amber-700" variant="body2">
            Urlop
          </Typography>
        );
      }
      return (
        <Typography className="font-medium" variant="body2">
          {dayData?.name || '-'}
        </Typography>
      );
    },
    [schedules, vacations, constructions, showVacations, showDates]
  );

  const isLoading =
    isLoadingConstructions ||
    isLoadingEmployees ||
    isLoadingVacations ||
    isLoadingSchedules;

  const error =
    isErrorConstructions ||
    isErrorEmployees ||
    isErrorVacations ||
    isErrorSchedules;

  if (error) {
    return (
      <Box
        sx={{ p: { xs: 1, sm: 2, md: 3 }, overflow: 'hidden' }}
        className="relative"
      >
        <Alert severity="error">Nastąpił błąd przy wczytywaniu danych.</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{ p: { xs: 1, sm: 2, md: 3 }, overflow: 'hidden' }}
      className="relative"
    >
      {isLoading && (
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

      <Alert
        severity="info"
        sx={{
          mb: 1,
        }}
      >
        Zmiany są zapisywane od razu w bazie danych. / Kliknij w datę tygodnia w
        nagłówku tabeli, aby wyświetlić szczegółowy widok tego tygodnia.
      </Alert>

      {/* Kontrolki tabeli */}
      <TableControls
        fromWeek={fromWeek}
        toWeek={toWeek}
        setFromWeek={setFromWeek}
        setToWeek={setToWeek}
        selectedEmployees={selectedEmployees}
        setIsFilterOpen={setIsFilterOpen}
        showVacations={showVacations}
        setShowVacations={setShowVacations}
        showDates={showDates}
        setShowDates={setShowDates}
        activeTable={activeTable}
      />

      {/* Tabela */}
      {activeTable.type === 0 ? (
        <TableContainer
          component={Box}
          className="rounded-lg border border-gray-500"
          sx={{
            overflowX: 'auto',
            width: '100%',
          }}
        >
          <Table
            stickyHeader
            sx={{
              tableLayout: 'fixed',
              minWidth: {
                xs: '100%',
                sm: `${40 + (60 / 2) * weeks.length}%`,
                md: `${30 + (70 / 3) * weeks.length}%`,
                lg: `${20 + (80 / 4) * weeks.length}%`,
                xl: `${20 + (80 / 7) * weeks.length}%`,
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 3,
                    color: 'white',
                    width: {
                      xs: '45%',
                      sm: '40%',
                      md: '30%',
                      lg: '20%',
                    },
                  }}
                  className="border-b border-b-gray-500 bg-blue-500 px-3 py-2 text-center"
                >
                  <Typography className="font-semibold" variant="body2">
                    Pracownik
                  </Typography>
                </TableCell>

                {weeks.map((w, index) => {
                  const isBefor = w.isBefore(dayjs(), 'week');
                  const isAfter = w.isAfter(dayjs(), 'week');

                  return (
                    <TableCell
                      key={index}
                      className={`relative cursor-pointer border-b border-l border-b-gray-500 border-l-gray-500 px-3 py-2 ${
                        isBefor
                          ? 'bg-red-300'
                          : isAfter
                            ? 'bg-gray-100'
                            : 'bg-green-300'
                      }`}
                      sx={{
                        '&:hover svg, &:active svg, &:focus-within svg': {
                          opacity: 1,
                        },
                        display: {
                          xs: index === 0 ? 'table-cell' : 'none',
                          sm: 'table-cell',
                        },
                        width: {
                          xs: '55%',
                          sm: `${60 / Math.min(weeks.length, 2)}%`,
                          md: `${70 / Math.min(weeks.length, 3)}%`,
                          lg: `${80 / Math.min(weeks.length, 4)}%`,
                          xl: `${80 / Math.min(weeks.length, 7)}%`,
                        },
                      }}
                      onClick={() => setActiveTable({ type: 1, week: w })}
                    >
                      <Typography
                        className="text-center font-semibold"
                        variant="body2"
                      >
                        {w.format('DD.MM')} - {w.add(6, 'day').format('DD.MM')}
                      </Typography>
                      <CalendarViewWeekIcon
                        sx={{
                          fontSize: '1rem',
                          fontWeight: '300',
                          position: 'absolute',
                          top: '50%',
                          right: 10,
                          transform: 'translateY(-50%)',
                          opacity: 0,
                          transition: '0.3s',
                        }}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredEmployees.map((emp) => (
                <EmployeeRow
                  key={emp.id}
                  employee={emp}
                  weeks={weeks}
                  onCellClick={handleShowInputConstruction}
                  cellText={cellText}
                  activeTable={activeTable}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <TableContainer
          component={Box}
          className="rounded-lg border border-gray-500"
        >
          <Table
            stickyHeader
            sx={{
              tableLayout: 'fixed',
              minWidth: 800,
              width: '100%',
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 3,
                    color: 'white',
                    width: {
                      xs: '135px',
                      md: '200px',
                    },
                  }}
                  className="cursor-pointer border-b border-b-gray-500 bg-blue-500 px-3 py-2 text-center"
                  onClick={() =>
                    setActiveTable((prev) => ({ ...prev, type: 0 }))
                  }
                >
                  <CalendarViewMonthIcon />
                </TableCell>
                {Array.from({ length: 7 }).map((_, i) => {
                  const day = activeTable.week.add(i, 'day');
                  return (
                    <TableCell
                      key={i}
                      sx={{
                        minWidth: '150px',
                      }}
                      className="border-b border-l border-gray-500 bg-gray-100 px-3 py-2"
                    >
                      <Typography
                        className="text-center font-semibold"
                        variant="body2"
                      >
                        {day.format('DD.MM')}
                      </Typography>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmployees.map((emp) => (
                <EmployeeRow
                  key={emp.id}
                  employee={emp}
                  weeks={weeks}
                  onCellClick={handleShowInputConstruction}
                  cellText={cellText}
                  activeTable={activeTable}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Menu komórki */}
      <Menu
        anchorEl={cellAnchorEl}
        open={openCellMenu}
        onClose={handleCellMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            sx: {
              width: cellAnchorEl ? cellAnchorEl.clientWidth - 2 : 'auto',
              maxWidth: '100%',
              minWidth: '220px',
              boxShadow: 'rgba(0, 0, 0, 0.3) 0px 0px 2px 1px',
              px: 1,
            },
          },
        }}
      >
        {activeCell && (
          <Autocomplete
            size="small"
            options={[{ id: null, name: '— Brak —' }, ...constructions]}
            getOptionLabel={(opt) => opt?.name || ''}
            isOptionEqualToValue={(opt, val) => opt.id === val?.id}
            value={(() => {
              const weekStart = dayjs(activeCell.weekKey);
              const schedule = schedules.find(
                (s) =>
                  s.employeeId === activeCell.empId &&
                  dayjs(s.weekStart).isSame(weekStart, 'week')
              );

              if (activeCell.isWeek) {
                const firstConstruction = schedule?.constructions?.find(
                  (id) => id !== null
                );
                return (
                  constructions.find((c) => c.id === firstConstruction) ?? {
                    id: null,
                    name: '— Brak —',
                  }
                );
              } else {
                const index = dayjs(activeCell.date).diff(weekStart, 'day');
                const cid = schedule?.constructions?.[index] ?? null;
                return (
                  constructions.find((c) => c.id === cid) ?? {
                    id: null,
                    name: '— Brak —',
                  }
                );
              }
            })()}
            onChange={(_, newValue) => {
              const valueToPass =
                newValue && newValue.id === null ? null : newValue;

              handleCellChange(
                activeCell.empId,
                activeCell.date,
                valueToPass,
                activeCell.isWeek
              );
              handleCellMenuClose();
            }}
            renderOption={(props, option) => {
              const { key, ...optionProps } = props;
              return (
                <li
                  key={key}
                  {...optionProps}
                  style={
                    option.id === null
                      ? {
                          opacity: '.5',
                        }
                      : {}
                  }
                >
                  {option.name}
                </li>
              );
            }}
            renderInput={(params) => <TextField {...params} label="Budowa" />}
          />
        )}
      </Menu>

      <FilterDialog
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        employees={employees}
        selectedEmployees={selectedEmployees}
        setSelectedEmployees={setSelectedEmployees}
      />
    </Box>
  );
};

export default Schedule;

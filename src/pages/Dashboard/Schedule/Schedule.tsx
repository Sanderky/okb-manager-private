import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Paper,
  createTheme,
  Tooltip,
  Menu,
  MenuItem,
  Alert,
  Divider,
  Switch,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import CloseIcon from '@mui/icons-material/Close';
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
import WeekSelector from '../../../components/WeekSelector';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import { getVacationList } from '../../../api/vacations';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

import {
  getScheduleByEmployeeAndWeek,
  getScheduleList,
  updateSchedule,
} from '../../../api/schedules';
import { Timestamp } from 'firebase/firestore';

import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';

dayjs.locale('pl');

// const weekStart = (d: Dayjs) => d.startOf('week');
// const weekEnd = (d: Dayjs) => d.endOf('week');

// const formatWeekLabel = (d: Dayjs) =>
//   `${weekStart(d).format('DD.MM')}–${weekEnd(d).format('DD.MM')}`;

type ActiveDialog = { type: 'none' } | { type: 'edit' };

interface ICell {
  date: Dayjs;
  weekKey: string;
  empId: string;
  isWeek: boolean;
}

const Schedule: React.FC = () => {
  const [fromWeek, setFromWeek] = useState<Date>(
    dayjs().startOf('week').toDate()
  );
  const [toWeek, setToWeek] = useState<Date>(
    dayjs().add(2, 'week').startOf('week').toDate()
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>({
    type: 'none',
  });
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [activeTable, setActiveTable] = useState<{
    type: number;
    week: Dayjs;
  }>({
    type: 0,
    week: dayjs().startOf('week'),
  });
  const notifications = useNotifications();
  const queryClient = useQueryClient();

  // const [tableValues, setTableValues] = useState<
  //   Record<
  //     string,
  //     Record<string, { day: Dayjs; construction: Construction | null }[] | null>
  //   >
  // >({});

  const [cellAnchorEl, setCellAnchorEl] = useState<null | HTMLElement>(null);
  const [activeCell, setActiveCell] = useState<ICell | null>(null);
  const [showVacations, setShowVacations] = useState(true);
  const [showDates, setShowDates] = useState(true);

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

  // Lista tygodni między from–to (włącznie)
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

  // Filtrowanie pracowników
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
        const existing = await getScheduleByEmployeeAndWeek(empId, weekStart);

        // const validIds = Array.from(
        //   new Set(constructionIds.filter((id): id is string => !!id))
        // );

        const scheduleData: Omit<Schedule, 'id'> & { id?: string } = {
          employeeId: empId,
          constructions: constructionIds,
          weekStart: Timestamp.fromDate(weekStart),
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
    [updateScheduleMutation, notifications]
  );

  // const handleCellChange = useCallback(
  //   async (
  //     empId: string,
  //     date: Dayjs,
  //     value: Construction | null,
  //     isWeek: boolean
  //   ) => {
  //     const startOfWeek = date.startOf('week');
  //     const weekStartDate = startOfWeek.toDate();

  //     const existingSchedule = schedules.find(
  //       (s) =>
  //         s.employeeId === empId &&
  //         dayjs(s.weekStart.toDate()).isSame(startOfWeek, 'week')
  //     );

  //     let newConstructions: (string | null)[];

  //     if (isWeek) {
  //       newConstructions = Array(7).fill(value?.id ?? null);
  //     } else {
  //       const existing = existingSchedule?.constructions ?? Array(7).fill(null);
  //       newConstructions = [...existing];
  //       const index = date.diff(startOfWeek, 'day');
  //       newConstructions[index] = value?.id ?? null;
  //     }

  //     await saveScheduleToDatabase(empId, weekStartDate, newConstructions);
  //   },
  //   [schedules, saveScheduleToDatabase]
  // );

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
          dayjs(s.weekStart.toDate()).isSame(startOfWeek, 'week')
      );

      let newConstructions: (string | null)[];

      if (isWeek) {
        newConstructions = Array.from({ length: 7 }, (_, i) => {
          const day = startOfWeek.add(i, 'day');
          const isVacation = vacations?.some(
            (v) =>
              v.employeeId === empId &&
              day.isSame(dayjs(v.date.toDate()), 'day')
          );
          return isVacation ? null : (value?.id ?? null);
        });
      } else {
        const existing = existingSchedule?.constructions ?? Array(7).fill(null);
        newConstructions = [...existing];
        const index = date.diff(startOfWeek, 'day');

        const isVacation = vacations?.some(
          (v) =>
            v.employeeId === empId && date.isSame(dayjs(v.date.toDate()), 'day')
        );
        newConstructions[index] = isVacation ? null : (value?.id ?? null);
      }

      await saveScheduleToDatabase(empId, weekStartDate, newConstructions);
    },
    [schedules, vacations, saveScheduleToDatabase]
  );

  const handleShowInputConstruction = useCallback(
    (
      event: React.MouseEvent<HTMLElement>,
      date: Dayjs,
      empId: string,
      isWeek: boolean
    ) => {
      const weekKey = date.startOf('week').format('YYYY-MM-DD');
      setCellAnchorEl(event.currentTarget);
      setActiveCell({ date, weekKey, empId, isWeek });
    },
    []
  );

  const handleCellMenuClose = () => {
    if (cellAnchorEl) {
      cellAnchorEl.style.backgroundColor = 'white';
    }
    setCellAnchorEl(null);
    setActiveCell(null);
  };

  const openCellMenu = Boolean(cellAnchorEl);

  // const cellText = useCallback(
  //   ({ empId, weekKey, date, isWeek }: ICell) => {
  //     const weekStart = dayjs(weekKey);

  //     const schedule = schedules.find(
  //       (s) =>
  //         s.employeeId === empId &&
  //         dayjs(s.weekStart.toDate()).isSame(weekStart, 'week')
  //     );

  //     const weekConstructions =
  //       Array.from({ length: 7 }, (_, i) => {
  //         const day = weekStart.add(i, 'day');
  //         const cid = schedule?.constructions?.[i] ?? null;
  //         const construction =
  //           cid !== null
  //             ? (constructions.find((c) => c.id === cid) ?? null)
  //             : null;
  //         return { day, construction };
  //       }) ?? [];

  //     const hasVacation = vacations?.some(
  //       (v) =>
  //         v.employeeId === empId && date.isSame(dayjs(v.date.toDate()), 'day')
  //     );

  //     if (isWeek) {
  //       const uniqueNames = [
  //         ...new Set(
  //           weekConstructions.map((w) => w.construction?.name).filter(Boolean)
  //         ),
  //       ];

  //       return (
  //         <Typography className="relative font-medium" variant="body2">
  //           {uniqueNames.length > 0 && hasVacation && 'Urlop / '}
  //           {uniqueNames.length > 0 ? uniqueNames.join(' / ') : '-'}
  //         </Typography>
  //       );
  //     } else {
  //       const dayConstruction = weekConstructions.find((w) =>
  //         w.day.isSame(date, 'day')
  //       );

  //       if (hasVacation) {
  //         return (
  //           <Typography className="font-medium text-amber-700" variant="body2">
  //             Urlop
  //           </Typography>
  //         );
  //       }

  //       return (
  //         <Typography className="font-medium" variant="body2">
  //           {dayConstruction?.construction?.name || '-'}
  //         </Typography>
  //       );
  //     }
  //   },
  //   [schedules, vacations, constructions]
  // );

  // const cellText = useCallback(
  //   ({ empId, weekKey, date, isWeek }: ICell) => {
  //     const weekStart = dayjs(weekKey);

  //     const schedule = schedules.find(
  //       (s) =>
  //         s.employeeId === empId &&
  //         dayjs(s.weekStart.toDate()).isSame(weekStart, 'week')
  //     );

  //     const weekConstructions =
  //       Array.from({ length: 7 }, (_, i) => {
  //         const day = weekStart.add(i, 'day');
  //         const cid = schedule?.constructions?.[i] ?? null;
  //         const construction =
  //           cid !== null
  //             ? (constructions.find((c) => c.id === cid) ?? null)
  //             : null;
  //         return { day, name: construction?.name ?? null };
  //       }) ?? [];

  //     const weekVacations = weekConstructions
  //       .filter((w) =>
  //         vacations?.some(
  //           (v) =>
  //             v.employeeId === empId &&
  //             w.day.isSame(dayjs(v.date.toDate()), 'day')
  //         )
  //       )
  //       .map((w) => w.day);

  //     const hasNullDay = weekConstructions.some(
  //       (w) => !w.name && !weekVacations.some((d) => d.isSame(w.day, 'day'))
  //     );

  //     const daysToRanges = (days: dayjs.Dayjs[]) => {
  //       if (days.length === 0) return [];
  //       const sorted = days.sort((a, b) => a.date() - b.date());
  //       const ranges: string[] = [];
  //       let start = sorted[0];
  //       let end = sorted[0];
  //       for (let i = 1; i < sorted.length; i++) {
  //         if (sorted[i].diff(end, 'day') === 1) {
  //           end = sorted[i];
  //         } else {
  //           ranges.push(
  //             start.isSame(end, 'day')
  //               ? start.format('DD.MM')
  //               : `${start.format('DD.MM')}-${end.format('DD.MM')}`
  //           );
  //           start = sorted[i];
  //           end = sorted[i];
  //         }
  //       }
  //       ranges.push(
  //         start.isSame(end, 'day')
  //           ? start.format('DD.MM')
  //           : `${start.format('DD.MM')}-${end.format('DD.MM')}`
  //       );
  //       return ranges;
  //     };

  //     if (isWeek) {
  //       const constructionsMap: Record<string, dayjs.Dayjs[]> = {};

  //       weekConstructions.forEach((w) => {
  //         if (w.name) {
  //           if (!constructionsMap[w.name]) constructionsMap[w.name] = [];
  //           constructionsMap[w.name].push(w.day);
  //         }
  //       });

  //       const parts: string[] = [];

  //       // Urlop
  //       if (showVacations && weekVacations.length > 0) {
  //         const vacationRanges = daysToRanges(weekVacations);
  //         parts.push(`Urlop (${vacationRanges.join(' / ')})`);
  //       }

  //       // Budowy
  //       Object.entries(constructionsMap).forEach(([name, days]) => {
  //         const showRanges =
  //           weekVacations.length > 0 ||
  //           hasNullDay ||
  //           Object.keys(constructionsMap).length > 1;

  //         if (!showRanges) {
  //           parts.push(name);
  //         } else {
  //           const ranges = daysToRanges(days);
  //           parts.push(`${name} (${ranges.join(' / ')})`);
  //         }
  //       });

  //       return (
  //         <Typography className="relative font-medium" variant="body2">
  //           {parts.join(' / ') || '-'}
  //         </Typography>
  //       );
  //     } else {
  //       const dayConstruction = weekConstructions.find((w) =>
  //         w.day.isSame(date, 'day')
  //       );

  //       const isVacation = weekVacations.some((d) => d.isSame(date, 'day'));

  //       if (isVacation) {
  //         return (
  //           <Typography className="font-medium text-amber-700" variant="body2">
  //             Urlop
  //           </Typography>
  //         );
  //       }

  //       return (
  //         <Typography className="font-medium" variant="body2">
  //           {dayConstruction?.name || '-'}
  //         </Typography>
  //       );
  //     }
  //   },
  //   [schedules, vacations, constructions, showVacations]
  // );

  const cellText = useCallback(
    ({ empId, weekKey, date, isWeek }: ICell) => {
      const weekStart = dayjs(weekKey);

      const schedule = schedules.find(
        (s) =>
          s.employeeId === empId &&
          dayjs(s.weekStart.toDate()).isSame(weekStart, 'week')
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
            (v) =>
              v.employeeId === empId &&
              day.isSame(dayjs(v.date.toDate()), 'day')
          );
          return { day, name: construction?.name ?? null, isVacation };
        }) ?? [];

      // === funkcje pomocnicze ===
      const formatRange = (start: dayjs.Dayjs, end: dayjs.Dayjs) => {
        const sameDay = start.isSame(end, 'day');
        const sameMonth = start.month() === end.month();

        if (sameDay) return start.format('DD.MM');
        if (sameMonth) return `${start.format('DD')}-${end.format('DD.MM')}`;
        return `${start.format('DD.MM')}-${end.format('DD.MM')}`;
      };

      const daysToRanges = (days: dayjs.Dayjs[]) => {
        if (days.length === 0) return [];
        const sorted = [...days].sort((a, b) => a.valueOf() - b.valueOf());
        const ranges: string[] = [];
        let start = sorted[0];
        let end = sorted[0];

        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i].diff(end, 'day') === 1) {
            end = sorted[i];
          } else {
            ranges.push(formatRange(start, end));
            start = sorted[i];
            end = sorted[i];
          }
        }
        ranges.push(formatRange(start, end));
        return ranges;
      };

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
          'border-lightGray rounded-lg border bg-gray-100/40 px-3 py-3 md:py-2'
        }
      >
        <Stack
          alignItems={'center'}
          direction={'row'}
          flexWrap={'wrap'}
          gap={2}
          sx={{
            display: {
              xs: 'none',
              sm: 'flex',
            },
          }}
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
          <Typography>-</Typography>
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
        </Stack>
        <IconButton
          size="small"
          className="rounded-lg border text-blue-500"
          onClick={() => setIsFilterOpen(true)}
        >
          <FilterListIcon />
        </IconButton>
        <Stack direction={'row'} spacing={1}>
          <Stack direction="column" alignItems="center" justifyContent="center">
            <Switch
              size="small"
              checked={showVacations}
              onChange={() => setShowVacations((prev) => !prev)}
              color="primary"
            />
            <Typography variant="caption" sx={{ textAlign: 'center' }}>
              Urlopy
            </Typography>
          </Stack>
          <Stack direction="column" alignItems="center" justifyContent="center">
            <Switch
              size="small"
              checked={showDates}
              onChange={() => setShowDates((prev) => !prev)}
              color="primary"
            />
            <Typography variant="caption" sx={{ textAlign: 'center' }}>
              Daty
            </Typography>
          </Stack>
        </Stack>
        <Stack
          sx={{ flexGrow: 1 }}
          alignItems={'center'}
          direction={'row'}
          flexWrap={'wrap'}
          justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
        >
          <Typography
            className="rounded-full border border-gray-700 px-3 py-1 font-semibold"
            sx={{
              display: {
                xs: 'block',
                sm: 'none',
              },
              ml: 'auto',
            }}
          >
            {dayjs(fromWeek).format('DD.MM.YYYY')} r.
          </Typography>
          <Typography
            className="rounded-full border border-gray-700 px-3 py-1 font-semibold"
            sx={{
              display: {
                xs: 'none',
                sm: 'block',
              },
            }}
          >
            {dayjs(fromWeek).format('DD.MM.YY')} -{' '}
            {dayjs(toWeek).add(6, 'day').format('DD.MM.YY')}
          </Typography>
        </Stack>
      </Stack>

      {activeTable.type === 0 && (
        <Stack
          direction={'row'}
          sx={{
            mb: 1,
            display: {
              xs: 'flex',
              sm: 'none',
            },
          }}
        >
          <IconButton
            size="small"
            className="rounded-l-lg rounded-r-none border text-blue-600"
            onClick={() =>
              setFromWeek((prev) => {
                const next = dayjs(prev).subtract(1, 'week').startOf('week');
                return toWeek && next.isAfter(dayjs(toWeek))
                  ? prev
                  : next.toDate();
              })
            }
          >
            <ChevronLeft />
          </IconButton>
          <Button
            variant="outlined"
            className="rounded-none border-x-0 border-blue-600 text-blue-600"
            sx={{
              flexGrow: 1,
            }}
            onClick={() => {
              const currentWeek = dayjs().startOf('week').toDate();
              setFromWeek(currentWeek);
              if (dayjs(currentWeek).isAfter(dayjs(toWeek))) {
                setToWeek(currentWeek);
              }
            }}
          >
            Bierzący tydzień
          </Button>
          <IconButton
            size="small"
            className="rounded-l-none rounded-r-lg border text-blue-600"
            onClick={() =>
              setFromWeek((prev) => {
                const next = dayjs(prev).add(1, 'week').startOf('week');
                if (dayjs(next).isAfter(dayjs(toWeek))) {
                  setToWeek(next.toDate());
                }
                return next.toDate();
              })
            }
          >
            <ChevronRight />
          </IconButton>
        </Stack>
      )}

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
                      // xl: '300px',
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
                        // '&:hover button, &:active button, &:focus-within button':
                        //   {
                        //     opacity: 1,
                        //     pointerEvents: 'all',
                        //   },
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
                <TableRow
                  key={emp.id}
                  sx={{
                    '&:last-child td, &:last-child th': {
                      borderBottom: '0 !important',
                    },
                  }}
                >
                  <TableCell
                    sx={{
                      position: 'sticky',
                      left: 0,
                      zIndex: 3,
                    }}
                    className="border-b border-b-gray-500 bg-gray-100 px-3 py-1.5 text-center"
                  >
                    <Typography
                      noWrap
                      className="font-semibold"
                      variant="body2"
                    >
                      {emp.name}
                    </Typography>
                  </TableCell>

                  {weeks.map((w, index) => {
                    const weekKey = w.format('YYYY-MM-DD');
                    return (
                      <TableCell
                        key={weekKey}
                        sx={{
                          '&:hover': { background: 'ghostwhite' },
                          display: {
                            xs: index === 0 ? 'table-cell' : 'none',
                            sm: 'table-cell',
                          },
                          backgroundColor: 'white',
                          transition: '0.3s',
                        }}
                        className="cursor-pointer border-b border-l border-b-gray-500 border-l-gray-500 px-3 py-1.5 text-center"
                        onClick={(e) => {
                          handleShowInputConstruction(e, w, emp.id, true);
                          e.currentTarget.style.backgroundColor = '#ffd85f80';
                        }}
                      >
                        {cellText({
                          empId: emp.id,
                          weekKey,
                          date: w,
                          isWeek: true,
                        })}
                      </TableCell>
                    );
                  })}
                </TableRow>
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
                <TableRow
                  key={emp.id}
                  sx={{
                    '&:last-child td, &:last-child th': {
                      borderBottom: '0 !important',
                    },
                  }}
                >
                  <TableCell
                    sx={{
                      position: 'sticky',
                      left: 0,
                      zIndex: 3,
                    }}
                    className="border-b border-b-gray-500 bg-gray-100 px-3 py-1.5 text-center"
                  >
                    <Tooltip
                      arrow
                      placement="top"
                      title={emp.name}
                      slotProps={{
                        popper: {
                          modifiers: [
                            {
                              name: 'offset',
                              options: {
                                offset: [0, -5],
                              },
                            },
                          ],
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: {
                            xs: '.75rem',
                            md: '.85rem',
                          },
                        }}
                        className="font-semibold"
                        noWrap
                        variant="body2"
                      >
                        {emp.name}
                      </Typography>
                    </Tooltip>
                  </TableCell>

                  {Array.from({ length: 7 }).map((_, i) => {
                    const day = activeTable.week.add(i, 'day');
                    return (
                      <TableCell
                        key={i}
                        sx={{
                          '&:hover': { background: 'ghostwhite' },
                        }}
                        className="cursor-pointer border-b border-l border-b-gray-500 border-l-gray-500 px-3 py-1.5 text-center"
                        onClick={(e) => {
                          if (e.currentTarget.textContent.includes('Urlop')) {
                            return;
                          }
                          handleShowInputConstruction(e, day, emp.id, false);
                          e.currentTarget.style.backgroundColor = '#ffd85f80';
                        }}
                      >
                        {cellText({
                          empId: emp.id,
                          weekKey: activeTable.week.format('YYYY-MM-DD'),
                          date: day,
                          isWeek: false,
                        })}

                        {/* {tableValues[emp.id]?.[
                            activeTable.week.format('YYYY-MM-DD')
                          ]?.find((d) => d.day.isSame(day, 'day'))?.construction
                            ?.name ?? '-'} */}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

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
            // value={
            //   tableValues[activeCell.empId]?.[activeCell.weekKey]?.find((d) =>
            //     d.day.isSame(activeCell.date, 'day')
            //   )?.construction ?? null
            // }
            value={(() => {
              const weekStart = dayjs(activeCell.weekKey);
              const schedule = schedules.find(
                (s) =>
                  s.employeeId === activeCell.empId &&
                  dayjs(s.weekStart.toDate()).isSame(weekStart, 'week')
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

      <Dialog
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ px: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent={'space-between'}
          >
            <Typography variant="h6" component="div">
              Filtr pracowników
            </Typography>
            <IconButton onClick={() => setIsFilterOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            // minHeight: 130,
            px: 2,
          }}
        >
          <FormControl sx={{ width: '100%', maxWidth: '100%' }}>
            <Autocomplete
              size="small"
              multiple
              id="checkboxes-tags-demo"
              options={employees}
              disableCloseOnSelect
              getOptionLabel={(opt) => opt.name}
              value={selectedEmployees}
              onChange={(_, newValue) => setSelectedEmployees(newValue)}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              renderOption={(props, option, { selected }) => {
                const { key, ...optionProps } = props;
                return (
                  <li key={key} {...optionProps}>
                    <Checkbox checked={selected} />
                    {option.name}
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField {...params} label="Pracownicy" />
              )}
            />
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 2 }}>
          <Button onClick={() => setSelectedEmployees([])}>Wyczyść</Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={activeDialog.type === 'edit'}
        onClose={() => setActiveDialog({ type: 'none' })}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ px: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Edytuj
            </Typography>
            <IconButton onClick={() => setActiveDialog({ type: 'none' })}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ maxWidth: '100%', px: 2 }}>
          content
        </DialogContent>
        <DialogActions sx={{ px: 2 }}>asd</DialogActions>
      </Dialog>
    </Box>
  );
};

export default Schedule;

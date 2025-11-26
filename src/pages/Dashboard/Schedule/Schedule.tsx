import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  Button,
  Tooltip,
  Stack,
} from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
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
import { getVacationListForMonths } from '../../../api/vacations';
import {
  getScheduleListForDateRange,
  updateSchedule,
} from '../../../api/schedules';
import {
  daysToRanges,
  getScheduleByEmployeeAndWeek,
  WEEK_DAYS,
  type ICell,
} from './ScheduleHelpers';
import { TableControls } from './ScheduleTableControls';
import { EmployeeRow } from './ScheduleEmployeeRow';
import { FilterDialog } from './ScheduleDialogs';
import { useReactToPrint } from 'react-to-print';
import { PrintableSchedule } from './SchedulePrint';
import usePrintShortcut from '../../../hooks/usePrintShortcut';
import { Print } from '@mui/icons-material';
import PageContainer from '../../../components/PageContainer';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';

import useContainerBreakpoint from '../../../hooks/useContainerWidth';
import { formatWeeksString } from '../Hours/HoursHelpers';

dayjs.extend(weekOfYear);

type SchedulePayload = Omit<Schedule, 'id'> & {
  id?: string;
};

const SCHEDULE_FILTERS_STORAGE_KEY = 'scheduleFilters';

interface StoredFilters {
  selectedEmployeeIds: string[];
  showInactive: boolean;
}

const ScheduleComponent = () => {
  const [containerRef, width] = useContainerBreakpoint();

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
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>(() => {
    const saved = localStorage.getItem(SCHEDULE_FILTERS_STORAGE_KEY);
    if (!saved) return [];
    const parsed: StoredFilters = JSON.parse(saved);
    return parsed.selectedEmployeeIds;
  });
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
  const [loadingCells, setLoadingCells] = useState<Set<string>>(new Set());
  const [showInactive, setShowInactive] = useState<boolean>(() => {
    const saved = localStorage.getItem(SCHEDULE_FILTERS_STORAGE_KEY);
    if (!saved) return false;
    const parsed: StoredFilters = JSON.parse(saved);
    return parsed.showInactive;
  });

  const notifications = useNotifications();
  const queryClient = useQueryClient();

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Harmonogram_pracowników',
    pageStyle: `
    @page {
      margin: 10mm;
    }`,
  });

  usePrintShortcut(handlePrint);

  useEffect(() => {
    localStorage.setItem('scheduleFromWeek', fromWeek.toISOString());
    localStorage.setItem('scheduleToWeek', toWeek.toISOString());
  }, [fromWeek, toWeek]);

  const months = useMemo(() => {
    const start = dayjs(fromWeek);
    const end = dayjs(toWeek);
    const monthsSet = new Set<string>();

    let current = start.startOf('month');
    while (current.isBefore(end) || current.isSame(end, 'month')) {
      monthsSet.add(current.format('YYYY-MM'));
      current = current.add(1, 'month');
    }

    return Array.from(monthsSet);
  }, [fromWeek, toWeek]);

  const scheduleDateRange = useMemo(() => {
    const start = dayjs(fromWeek).startOf('week');
    const end = dayjs(toWeek).endOf('week');
    return { start: start.toDate(), end: end.toDate() };
  }, [fromWeek, toWeek]);

  const {
    data: employees = [],
    isLoading: isLoadingEmployees,
    isError: isErrorEmployees,
  } = useQuery<Employee[], Error>({
    queryKey: ['employees'],
    queryFn: () => getEmployeeList(),
  });

  useEffect(() => {
    const filtersToStore: StoredFilters = {
      selectedEmployeeIds: selectedEmployees,
      showInactive: showInactive,
    };
    localStorage.setItem(
      SCHEDULE_FILTERS_STORAGE_KEY,
      JSON.stringify(filtersToStore)
    );
  }, [selectedEmployees, showInactive]);

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
    queryKey: ['vacations', months],
    queryFn: () => getVacationListForMonths(months),
    enabled: months.length > 0,
  });

  const {
    data: schedules = [],
    isLoading: isLoadingSchedules,
    isError: isErrorSchedules,
  } = useQuery<Schedule[], Error>({
    queryKey: ['schedules', scheduleDateRange],
    queryFn: () =>
      getScheduleListForDateRange(
        scheduleDateRange.start,
        scheduleDateRange.end
      ),
  });

  const getCellKey = useCallback((cell: ICell): string => {
    return `${cell.empId}-${cell.weekKey}-${cell.date.format('YYYY-MM-DD')}-${cell.isWeek}`;
  }, []);

  const updateScheduleMutation = useMutation({
    mutationFn: updateSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      notifications.show('Harmonogram został zaktualizowany.', {
        severity: 'success',
        autoHideDuration: 5000,
      });
    },
    onError: (error: Error) => {
      console.error('Update schedule error:', error);
      notifications.show('Wystąpił błąd podczas zapisywania harmonogramu.', {
        severity: 'error',
        autoHideDuration: 5000,
      });
    },
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
    if (!selectedEmployees.length) {
      return showInactive ? employees : employees.filter((emp) => emp.status);
    }
    const filtered = employees.filter((e) => selectedEmployees.includes(e.id));
    return showInactive ? filtered : filtered.filter((emp) => emp.status);
  }, [employees, selectedEmployees, showInactive]);

  const saveScheduleToDatabase = useCallback(
    async (
      empId: string,
      weekStart: Date,
      constructionIds: (string | null)[],
      existing: Schedule | null,
      cellKey: string
    ) => {
      setLoadingCells((prev) => new Set(prev).add(cellKey));

      try {
        const scheduleData: SchedulePayload = {
          employeeId: empId,
          constructions: constructionIds,
          weekStart: weekStart,
          id: existing?.id,
        };

        await updateScheduleMutation.mutateAsync(scheduleData);
      } catch (error) {
        console.error('Error saving schedule:', error);
        throw error;
      } finally {
        setLoadingCells((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cellKey);
          return newSet;
        });
      }
    },
    [updateScheduleMutation]
  );

  const handleCellChange = useCallback(
    async (
      empId: string,
      date: Dayjs,
      value: Construction | null,
      isWeek: boolean,
      cell: ICell
    ) => {
      const cellKey = getCellKey(cell);
      const startOfWeek = date.startOf('week');
      const weekStartDate = startOfWeek.toDate();

      const existingSchedule = getScheduleByEmployeeAndWeek(
        schedules,
        empId,
        startOfWeek
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
        const existingIds =
          existingSchedule?.constructions ?? Array(7).fill(null);

        newConstructions = [...existingIds];

        const dayOfWeek = date.day();
        const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        const isVacation = vacations?.some(
          (v) => v.employeeId === empId && date.isSame(dayjs(v.date), 'day')
        );

        newConstructions[index] = isVacation ? null : (value?.id ?? null);
      }

      await saveScheduleToDatabase(
        empId,
        weekStartDate,
        newConstructions,
        existingSchedule,
        cellKey
      );
    },
    [schedules, vacations, saveScheduleToDatabase, getCellKey]
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

      const row = target.closest('tr');
      if (row) {
        row.style.backgroundColor = '#eff6ff';
        const firstCell = row.querySelector('td:first-child') as HTMLElement;
        if (firstCell) {
          firstCell.style.backgroundColor = '#eff6ff';
        }
      }

      target.style.backgroundColor = '#dbeafe';

      setCellAnchorEl(target);
      setActiveCell(cell);
    },
    [vacations]
  );

  const handleCellMenuClose = useCallback(() => {
    const row = cellAnchorEl?.closest('tr');
    if (row) {
      row.style.backgroundColor = '';
      const firstCell = row.querySelector('td:first-child') as HTMLElement;
      if (firstCell) {
        firstCell.style.backgroundColor = '';
      }
    }

    if (cellAnchorEl) {
      cellAnchorEl.style.backgroundColor = '';
    }
    setCellAnchorEl(null);
    setActiveCell(null);
  }, [cellAnchorEl]);

  const openCellMenu = Boolean(cellAnchorEl);

  const cellText = useCallback(
    (
      { empId, weekKey, date, isWeek }: ICell,
      renderEmptyCellIndicator = true
    ) => {
      const weekStart = dayjs(weekKey);

      const schedule = schedules.find(
        (s) =>
          s.employeeId === empId && dayjs(s.weekStart).isSame(weekStart, 'week')
      );

      if (!isWeek) {
        const dayIndex = date.diff(weekStart, 'day');
        const constructionId = schedule?.constructions?.[dayIndex];
        const isVacation = vacations?.some(
          (v) => v.employeeId === empId && date.isSame(dayjs(v.date), 'day')
        );

        if (isVacation) {
          return (
            <Typography className="font-medium text-amber-700" variant="body2">
              Urlop
            </Typography>
          );
        }

        const construction = constructionId
          ? constructions.find((c) => c.id === constructionId)
          : null;

        return (
          <Typography className="font-medium" variant="body2">
            {construction?.name ?? (renderEmptyCellIndicator && '')}
          </Typography>
        );
      }

      const weekData = Array.from({ length: 7 }, (_, i) => {
        const day = weekStart.add(i, 'day');
        const constructionId = schedule?.constructions?.[i];
        const isVacation = vacations?.some(
          (v) => v.employeeId === empId && day.isSame(dayjs(v.date), 'day')
        );

        return {
          day,
          name: constructionId
            ? constructions.find((c) => c.id === constructionId)?.name
            : null,
          isVacation,
        };
      });

      const constructionsMap = new Map<string, dayjs.Dayjs[]>();
      const vacationDays: dayjs.Dayjs[] = [];
      let hasEmptyDays = false;

      weekData.forEach(({ day, name, isVacation }) => {
        if (isVacation) {
          vacationDays.push(day);
        } else if (name) {
          if (!constructionsMap.has(name)) {
            constructionsMap.set(name, []);
          }
          constructionsMap.get(name)!.push(day);
        } else {
          hasEmptyDays = true;
        }
      });

      const vacationParts: string[] = [];
      const constructionParts: string[] = [];

      if (showVacations && vacationDays.length > 0) {
        const vacationText = showDates
          ? `Urlop (${daysToRanges(vacationDays).join(', ')})`
          : 'Urlop';
        vacationParts.push(vacationText);
      }

      const shouldShowRanges =
        constructionsMap.size > 1 || vacationDays.length > 0 || hasEmptyDays;

      constructionsMap.forEach((days, name) => {
        const isFullWeekConstruction =
          days.length >= 6 && constructionsMap.size === 1;

        if (!shouldShowRanges || !showDates || isFullWeekConstruction) {
          constructionParts.push(name);
        } else {
          constructionParts.push(`${name} (${daysToRanges(days).join(', ')})`);
        }
      });

      const allParts = [...vacationParts, ...constructionParts];
      const content = allParts.join(' / ') || (renderEmptyCellIndicator && '');

      if (vacationParts.length > 0 && constructionParts.length > 0) {
        return (
          <Typography className="font-medium" variant="body2">
            <span className="text-amber-700">{vacationParts.join(' / ')}</span>
            {' / '}
            {constructionParts.join(' / ')}
          </Typography>
        );
      }

      return (
        <Typography
          className={`font-medium ${vacationParts.length > 0 ? 'text-amber-700' : ''}`}
          variant="body2"
        >
          {content}
        </Typography>
      );
    },
    [schedules, vacations, constructions, showVacations, showDates]
  );

  const error =
    isErrorConstructions ||
    isErrorEmployees ||
    isErrorVacations ||
    isErrorSchedules;

  const loading =
    isLoadingConstructions ||
    isLoadingEmployees ||
    isLoadingVacations ||
    isLoadingSchedules;

  if (error) {
    return (
      <PageContainer breadcrumbs={[{ title: 'Harmonogram pracowników' }]}>
        <Box className="relative">
          <Alert severity="error">
            Wystąpił błąd podczas ładowania danych.
          </Alert>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      breadcrumbs={[{ title: 'Harmonogram pracowników' }]}
      actions={
        <Button
          size="small"
          onClick={handlePrint}
          variant="contained"
          startIcon={<Print />}
          disabled={loading}
        >
          Drukuj
        </Button>
      }
    >
      <Box
        ref={containerRef}
        sx={{
          overflow: 'hidden',
        }}
        className="relative"
      >
        {loading && (
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

        <TableControls
          containerWidth={width}
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
        <Box className="overflow-hidden rounded-lg border border-gray-300 bg-white">
          {activeTable.type === 0 ? (
            <TableContainer
              component={Box}
              sx={{
                overflowX: 'auto',
                width: '100%',
                maxHeight: '65vh',
              }}
            >
              <Table
                stickyHeader
                sx={{
                  tableLayout: 'fixed',
                  minWidth: {
                    xs: `${50 + (50 / 1) * weeks.length}%`,
                    sm: `${40 + (60 / 2) * weeks.length}%`,
                    md: `${30 + (70 / 3) * weeks.length}%`,
                    lg: `${20 + (80 / 4) * weeks.length}%`,
                    xl: `${18 + (82 / 7) * weeks.length}%`,
                  },
                }}
              >
                <TableHead
                  sx={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 4,
                    top: 0,
                  }}
                >
                  <TableRow>
                    <TableCell
                      sx={{
                        position: 'sticky',
                        left: 0,
                        zIndex: 4,
                        width: {
                          xs: '50%',
                          sm: '40%',
                          md: '30%',
                          lg: '18%',
                        },
                      }}
                      className="bg-blue-200 px-3 py-2 text-center"
                    >
                      <Typography variant="overline" className="font-medium">
                        Pracownicy: {filteredEmployees.length}
                      </Typography>
                    </TableCell>

                    {weeks.map((w, index) => {
                      const isBefor = w.isBefore(dayjs(), 'week');
                      const isAfter = w.isAfter(dayjs(), 'week');
                      const weekIndex = w.week();

                      return (
                        <TableCell
                          key={index}
                          className={`relative cursor-pointer border-l border-l-gray-300 px-3 py-2 ${
                            isBefor
                              ? 'bg-red-200'
                              : isAfter
                                ? 'bg-gray-100'
                                : 'bg-green-200'
                          }`}
                          sx={{
                            '&:hover svg, &:active svg, &:focus-within svg': {
                              opacity: 1,
                            },
                            // display: {
                            //   xs: index === 0 ? 'table-cell' : 'none',
                            //   sm: 'table-cell',
                            // },
                            width: {
                              xs: `${50 / Math.min(weeks.length, 1)}%`,
                              sm: `${60 / Math.min(weeks.length, 2)}%`,
                              md: `${70 / Math.min(weeks.length, 3)}%`,
                              lg: `${80 / Math.min(weeks.length, 4)}%`,
                              xl: `${82 / Math.min(weeks.length, 7)}%`,
                            },
                          }}
                          onClick={() => setActiveTable({ type: 1, week: w })}
                        >
                          <Typography
                            className="block text-center font-semibold text-gray-700/50"
                            variant="caption"
                          >
                            [{weekIndex}]
                          </Typography>
                          <Typography
                            className="text-center font-semibold"
                            variant="body2"
                          >
                            {w.format('DD.MM')} -{' '}
                            {w.add(6, 'day').format('DD.MM')}
                          </Typography>
                          <UnfoldMoreIcon
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
                      loadingCells={loadingCells}
                      getCellKey={getCellKey}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <TableContainer
              component={Box}
              sx={{
                maxHeight: '65vh',
              }}
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
                        zIndex: 4,
                        width: {
                          xs: '150px',
                          md: '200px',
                        },
                      }}
                      className="cursor-pointer bg-blue-200 px-3 py-2 text-center"
                      onClick={() =>
                        setActiveTable((prev) => ({ ...prev, type: 0 }))
                      }
                    >
                      <KeyboardReturnIcon />
                    </TableCell>
                    {Array.from({ length: 7 }).map((_, i) => {
                      const day = activeTable.week.add(i, 'day');
                      const isToday = day.isSame(dayjs(), 'day');
                      return (
                        <TableCell
                          key={i}
                          sx={{
                            width: '150px',
                          }}
                          className={`border-l border-l-gray-300 bg-gray-100 px-3 py-2 ${isToday && 'bg-green-100'}`}
                        >
                          <Typography
                            className="block text-center font-semibold"
                            variant="caption"
                          >
                            {WEEK_DAYS[i]}
                          </Typography>
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
                      loadingCells={loadingCells}
                      getCellKey={getCellKey}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <Box>
            {filteredEmployees.length === 0 && (
              <Stack
                direction={'column'}
                justifyContent={'center'}
                alignItems={'center'}
                sx={{ py: 5 }}
                className="border-b border-gray-300"
              >
                <Typography
                  variant="body1"
                  align="center"
                  className="px-4 font-normal text-gray-500"
                >
                  Nie znaleziono pracowników
                </Typography>
              </Stack>
            )}
            <Stack
              direction={'row'}
              justifyContent={'space-between'}
              spacing={2}
              alignItems={'center'}
              className="border-t border-t-gray-300 px-3 py-2"
            >
              {activeTable.type === 0 ? (
                <>
                  <Typography
                    variant="overline"
                    className="font-medium text-gray-500"
                  >
                    {`${weeks.length} ${formatWeeksString(weeks.length, 'pl-PL')}`}
                  </Typography>
                  <Typography
                    variant="body2"
                    className="font-medium text-gray-500"
                  >
                    <Typography component={'span'} variant="inherit">
                      {'Zakres: '}
                    </Typography>
                    {dayjs(fromWeek).format('DD.MM.YYYY')}
                    <Typography
                      component={'span'}
                      variant="inherit"
                      // sx={{
                      //   display: {
                      //     xs: 'none',
                      //     sm: 'inline',
                      //   },
                      // }}
                    >
                      {' - '}
                      {dayjs(toWeek).add(6, 'day').format('DD.MM.YYYY')}
                    </Typography>
                  </Typography>
                </>
              ) : (
                <>
                  <Typography
                    variant="overline"
                    className="font-medium text-gray-500"
                  >
                    {activeTable.week.week()} Tydzień
                  </Typography>
                  <Typography
                    variant="body2"
                    className="font-medium text-gray-500"
                  >
                    {activeTable.week.format('DD.MM.YYYY')}
                    {' - '}
                    {activeTable.week.add(6, 'day').format('DD.MM.YYYY')}
                  </Typography>
                </>
              )}
            </Stack>
          </Box>
        </Box>
        <Menu
          anchorEl={cellAnchorEl}
          open={openCellMenu}
          onClose={handleCellMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
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
              options={[
                { id: null, name: '— Brak —' },
                ...constructions.filter((c) => c.status),
              ]}
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
                  const firstId =
                    schedule?.constructions?.find((id) => id !== null) ?? null;
                  return (
                    constructions.find((c) => c.id === firstId) ?? {
                      id: null,
                      name: '— Brak —',
                    }
                  );
                } else {
                  const index = dayjs(activeCell.date).diff(weekStart, 'day');
                  const constructionId =
                    schedule?.constructions?.[index] ?? null;
                  return (
                    constructions.find((c) => c.id === constructionId) ?? {
                      id: null,
                      name: '— Brak —',
                    }
                  );
                }
              })()}
              onChange={(_, newValue) => {
                const valueToPass =
                  newValue && (newValue as Construction).id === null
                    ? null
                    : newValue;

                handleCellChange(
                  activeCell.empId,
                  activeCell.date,
                  valueToPass as Construction | null,
                  activeCell.isWeek,
                  activeCell
                );
                handleCellMenuClose();
              }}
              loading={loadingCells.has(getCellKey(activeCell))}
              disabled={loadingCells.has(getCellKey(activeCell))}
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
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Budowa"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingCells.has(getCellKey(activeCell)) ? (
                          <CircularProgress size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          )}
        </Menu>

        <FilterDialog
          isFilterOpen={isFilterOpen}
          setIsFilterOpen={setIsFilterOpen}
          employees={employees}
          selectedEmployees={selectedEmployees}
          setSelectedEmployees={setSelectedEmployees}
          showInactive={showInactive}
          setShowInactive={setShowInactive}
        />

        <div style={{ display: 'none' }}>
          <div ref={printRef}>
            <PrintableSchedule
              activeTable={activeTable}
              weeks={weeks}
              filteredEmployees={filteredEmployees}
              cellText={cellText}
            />
          </div>
        </div>
      </Box>
    </PageContainer>
  );
};

export default ScheduleComponent;

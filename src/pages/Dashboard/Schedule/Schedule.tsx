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
  Stack,
  useTheme,
} from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/pl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getEmployeeList } from '../../../services/employees';
import { getConstructionList } from '../../../services/constructions';
import { getVacationListForMonths } from '../../../services/vacations';
import {
  getScheduleListForDateRange,
  saveScheduleList,
} from '../../../services/schedules';

import type { Construction, Employee } from '../../../types';

import useNotifications from '../../../hooks/useNotifications/useNotifications';
import {
  createScheduleMap,
  daysToRanges,
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
import { useNavigate } from 'react-router-dom';

dayjs.extend(weekOfYear);
dayjs.extend(isBetween);

const SCHEDULE_FILTERS_STORAGE_KEY = 'scheduleFilters';

interface StoredFilters {
  selectedEmployeeIds: string[];
  showInactive: boolean;
  selectedConstructionIds?: string[];
  showInactiveConstructions?: boolean;
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

  const [activeTable, setActiveTable] = useState<{
    type: number;
    week: Dayjs;
  }>({
    type: 0,
    week: dayjs().startOf('week'),
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [cellAnchorEl, setCellAnchorEl] = useState<null | HTMLElement>(null);
  const [activeCell, setActiveCell] = useState<ICell | null>(null);
  const [showVacations, setShowVacations] = useState(true);
  const [showDates, setShowDates] = useState(true);
  const [loadingCells, setLoadingCells] = useState<Set<string>>(new Set());

  const theme = useTheme();

  const [selectedEmployees, setSelectedEmployees] = useState<string[]>(() => {
    const saved = localStorage.getItem(SCHEDULE_FILTERS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved).selectedEmployeeIds ?? [];
      } catch {
        console.error('Errow while loading fron local storage');
      }
    }
    return [];
  });

  const [showInactive, setShowInactive] = useState<boolean>(() => {
    const saved = localStorage.getItem(SCHEDULE_FILTERS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved).showInactive ?? false;
      } catch {
        console.error('Errow while loading fron local storage');
      }
    }
    return false;
  });

  const [selectedConstructions, setSelectedConstructions] = useState<string[]>(
    () => {
      const saved = localStorage.getItem(SCHEDULE_FILTERS_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved).selectedConstructionIds ?? [];
        } catch {
          console.error('Errow while loading fron local storage');
        }
      }
      return [];
    }
  );

  const [showInactiveConstructions, setShowInactiveConstructions] =
    useState<boolean>(() => {
      const saved = localStorage.getItem(SCHEDULE_FILTERS_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved).showInactiveConstructions ?? false;
        } catch {
          console.error('Errow while loading fron local storage');
        }
      }
      return false;
    });

  const notifications = useNotifications();
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Harmonogram_pracowników',
    pageStyle: `@page { margin: 10mm; }`,
  });

  usePrintShortcut(handlePrint);

  useEffect(() => {
    localStorage.setItem('scheduleFromWeek', fromWeek.toISOString());
    localStorage.setItem('scheduleToWeek', toWeek.toISOString());
  }, [fromWeek, toWeek]);

  useEffect(() => {
    const filtersToStore: StoredFilters = {
      selectedEmployeeIds: selectedEmployees,
      showInactive: showInactive,
      selectedConstructionIds: selectedConstructions,
      showInactiveConstructions: showInactiveConstructions,
    };
    localStorage.setItem(
      SCHEDULE_FILTERS_STORAGE_KEY,
      JSON.stringify(filtersToStore)
    );
  }, [
    selectedEmployees,
    showInactive,
    selectedConstructions,
    showInactiveConstructions,
  ]);

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
    return {
      start: dayjs(fromWeek).startOf('week').toDate(),
      end: dayjs(toWeek).endOf('week').toDate(),
    };
  }, [fromWeek, toWeek]);

  const {
    data: employees = [],
    isLoading: isLoadingEmployees,
    isError: isErrorEmployees,
  } = useQuery<Employee[], Error>({
    queryKey: ['employees'],
    queryFn: () => getEmployeeList(),
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
  } = useQuery({
    queryKey: ['vacations', months],
    queryFn: () => getVacationListForMonths(months),
    enabled: months.length > 0,
  });

  const {
    data: schedules = [],
    isLoading: isLoadingSchedules,
    isError: isErrorSchedules,
  } = useQuery({
    queryKey: ['schedules', scheduleDateRange],
    queryFn: () =>
      getScheduleListForDateRange(
        scheduleDateRange.start,
        scheduleDateRange.end
      ),
  });

  const scheduleMap = useMemo(() => createScheduleMap(schedules), [schedules]);

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

  const employeesCount = useMemo(() => {
    if (showInactive) return employees.length;
    return employees.filter((emp) => emp.status).length;
  }, [employees, showInactive]);

  const filteredEmployees = useMemo(() => {
    let result = employees;

    if (!showInactive) {
      result = result.filter((emp) => emp.status);
    }

    if (selectedEmployees.length > 0) {
      result = result.filter((e) => selectedEmployees.includes(e.id));
    }

    if (selectedConstructions.length > 0) {
      const activeEmployeeIds = new Set<string>();
      schedules.forEach((entry) => {
        if (selectedConstructions.includes(entry.constructionId)) {
          activeEmployeeIds.add(entry.employeeId);
        }
      });
      result = result.filter((e) => activeEmployeeIds.has(e.id));
    }

    return result;
  }, [
    employees,
    selectedEmployees,
    showInactive,
    selectedConstructions,
    schedules,
  ]);

  const checkIsVacation = useCallback(
    (empId: string, date: Dayjs) => {
      return vacations?.some(
        (v) =>
          v.employeeId === empId &&
          date.isBetween(dayjs(v.startDate), dayjs(v.endDate), 'day', '[]')
      );
    },
    [vacations]
  );

  const getCellKey = useCallback((cell: ICell): string => {
    return `${cell.empId}-${cell.weekKey}-${cell.date.format('YYYY-MM-DD')}-${cell.isWeek}`;
  }, []);

  const updateScheduleMutation = useMutation({
    mutationFn: saveScheduleList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
    onError: () => notifications.show('Błąd zapisu', { severity: 'error' }),
  });

  const handleCellChange = useCallback(
    async (
      empId: string,
      date: Dayjs,
      value: Construction | null,
      isWeek: boolean,
      cell: ICell
    ) => {
      const cellKey = getCellKey(cell);
      setLoadingCells((prev) => new Set(prev).add(cellKey));

      const entriesToSave: {
        employeeId: string;
        date: Date;
        constructionId: string | null;
      }[] = [];
      const startOfWeek = date.startOf('week');

      if (isWeek) {
        const notSavedDays: string[] = [];

        for (let i = 0; i < 7; i++) {
          const day = startOfWeek.add(i, 'day');
          const hasVacation = checkIsVacation(empId, day);

          if (!hasVacation && i !== 6) {
            entriesToSave.push({
              employeeId: empId,
              date: day.toDate(),
              constructionId: value?.id ?? null,
            });
          } else if (hasVacation && i !== 6) {
            notSavedDays.push(day.format('DD.MM.YYYY'));
          }
        }

        if (notSavedDays.length > 0) {
          notifications.show(
            `Nie zapisano ${notSavedDays.length} ${notSavedDays.length === 1 ? 'dnia' : 'dni'} (urlop)`,
            {
              severity: 'info',
              autoHideDuration: 5000,
            }
          );
        }
      } else {
        entriesToSave.push({
          employeeId: empId,
          date: date.toDate(),
          constructionId: value?.id ?? null,
        });
      }

      try {
        await updateScheduleMutation.mutateAsync(entriesToSave);
      } finally {
        setLoadingCells((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cellKey);
          return newSet;
        });
      }
    },
    [checkIsVacation, updateScheduleMutation, getCellKey, notifications]
  );

  const handleShowInputConstruction = useCallback(
    (event: React.MouseEvent<HTMLElement>, cell: ICell) => {
      event.stopPropagation();
      const hasVacation = checkIsVacation(cell.empId, cell.date);
      if (!cell.isWeek && hasVacation) return;

      const target = event.currentTarget as HTMLElement;
      const row = target.closest('tr');
      if (row) {
        row.style.backgroundColor = theme.palette.schedule.accent;
        (
          row.querySelector('td:first-child') as HTMLElement
        ).style.backgroundColor = theme.palette.schedule.accent;
      }
      target.style.backgroundColor = theme.palette.schedule.hoverCell;

      setCellAnchorEl(target);
      setActiveCell(cell);
    },
    [checkIsVacation, theme]
  );

  const handleCellMenuClose = useCallback(() => {
    const row = cellAnchorEl?.closest('tr');
    if (row) {
      row.style.backgroundColor = '';
      (
        row.querySelector('td:first-child') as HTMLElement
      ).style.backgroundColor = '';
    }
    if (cellAnchorEl) cellAnchorEl.style.backgroundColor = '';
    setCellAnchorEl(null);
    setActiveCell(null);
  }, [cellAnchorEl]);

  const cellText = useCallback(
    (
      { empId, weekKey, date, isWeek }: ICell,
      renderEmptyCellIndicator = true
    ) => {
      const hasVacation = checkIsVacation(empId, date);
      const entry = scheduleMap.get(empId)?.get(date.format('YYYY-MM-DD'));

      if (!isWeek) {
        if (hasVacation) {
          return (
            <Typography
              color="vacation"
              className="font-medium"
              variant="body2"
            >
              Urlop
            </Typography>
          );
        }

        let cName = entry?.constructionName;
        let cActive = entry?.constructionActive;

        if (!cName && entry?.constructionId) {
          const def = constructions.find((c) => c.id === entry?.constructionId);
          cName = def?.name;
          cActive = def?.status;
        }

        if (!cName && entry?.constructionId) cName = 'Nieznana';

        const isActive = cActive ?? true;

        return (
          <Typography
            className="font-medium"
            variant="body2"
            sx={{
              textDecoration: !isActive ? 'line-through' : 'none',
              color: !isActive ? 'text.disabled' : 'text.primary',
            }}
          >
            {cName ?? (renderEmptyCellIndicator && '')}
          </Typography>
        );
      }

      const weekStart = dayjs(weekKey);
      const items: React.ReactNode[] = [];
      const vacationDays: Dayjs[] = [];
      const cDataMap = new Map<string, { days: Dayjs[]; active: boolean }>();
      let hasEmptyDays = false;

      for (let i = 0; i < 7; i++) {
        const day = weekStart.add(i, 'day');
        const isVac = checkIsVacation(empId, day);
        const dayEntry = scheduleMap.get(empId)?.get(day.format('YYYY-MM-DD'));

        if (isVac) {
          vacationDays.push(day);
        } else if (dayEntry) {
          let cName = dayEntry.constructionName;
          let cActive = dayEntry.constructionActive;

          if (!cName && dayEntry.constructionId) {
            const def = constructions.find(
              (c) => c.id === dayEntry.constructionId
            );
            cName = def?.name || '?';
            cActive = def?.status;
          }

          if (cName) {
            if (!cDataMap.has(cName)) {
              cDataMap.set(cName, { days: [], active: cActive ?? true });
            }
            cDataMap.get(cName)!.days.push(day);
          } else {
            const unknown = 'Nieznana budowa';
            if (!cDataMap.has(unknown))
              cDataMap.set(unknown, { days: [], active: true });
            cDataMap.get(unknown)!.days.push(day);
          }
        } else {
          hasEmptyDays = true;
        }
      }

      if (showVacations && vacationDays.length > 0) {
        const text = showDates
          ? `Urlop (${daysToRanges(vacationDays).join(', ')})`
          : 'Urlop';
        items.push(
          <Box
            component="div"
            key="vac"
            sx={{
              color: 'vacation',
              fontSize: '0.75rem',
              fontWeight: 500,
              lineHeight: 1.3,
            }}
          >
            {text}
          </Box>
        );
      }

      const shouldShowRanges =
        cDataMap.size > 1 || vacationDays.length > 0 || hasEmptyDays;

      cDataMap.forEach((data, name) => {
        const isFull = data.days.length >= 6 && cDataMap.size === 1;
        const text =
          !shouldShowRanges || !showDates || isFull
            ? name
            : `${name} (${daysToRanges(data.days).join(', ')})`;

        items.push(
          <Box
            component="div"
            key={name}
            sx={{
              textDecoration: !data.active ? 'line-through' : 'none',
              color: !data.active ? 'text.disabled' : 'inherit',
              fontSize: '0.75rem',
              fontWeight: 500,
              lineHeight: 1.3,

              // whiteSpace: 'nowrap',
              // overflow: 'hidden',
              // textOverflow: 'ellipsis',
              // maxWidth: '100%'
            }}
          >
            {text}
          </Box>
        );
      });

      // if (items.length === 0) return renderEmptyCellIndicator && '';
      if (items.length === 0) return <></>;

      return (
        <Stack
          direction="column"
          spacing={0.5}
          justifyContent="center"
          sx={{ width: '100%', py: 0.5 }}
        >
          {items}
        </Stack>
      );
    },
    [scheduleMap, checkIsVacation, constructions, showVacations, showDates]
  );
  const navigate = useNavigate();

  const handleOnEmployeeClick = useCallback(
    (id: string) => {
      navigate('/employees/' + id);
    },
    [navigate]
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

  if (error)
    return (
      <PageContainer
        fixedHeight={true}
        breadcrumbs={[{ title: 'Harmonogram' }]}
      >
        <Alert severity="error">Błąd danych.</Alert>
      </PageContainer>
    );

  return (
    <PageContainer
      fixedHeight={true}
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
      renderBottomToolbar={
        <Box
          sx={(theme) => ({
            flexShrink: 0,
            background: theme.palette.background.paper,
            borderTop: `1px solid ${theme.palette.divider}`,
          })}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent={'space-between'}
            alignItems={'center'}
            className="px-3"
            columnGap={2}
            rowGap={0.5}
            py={1}
          >
            {activeTable.type === 0 ? (
              <>
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
                    className="font-medium"
                    color="textSecondary"
                    sx={{
                      lineHeight: 1,
                    }}
                  >
                    Pracownicy:{' '}
                    {selectedEmployees.length > 0
                      ? `${selectedEmployees.length} / ${employeesCount}`
                      : filteredEmployees.length}
                  </Typography>
                  <Typography
                    variant="overline"
                    color="textSecondary"
                    className="font-medium"
                    sx={{
                      lineHeight: 1,
                    }}
                  >
                    {weeks.length} {formatWeeksString(weeks.length, 'pl-PL')}
                  </Typography>
                </Stack>
                <Typography
                  variant="overline"
                  color="textSecondary"
                  className="font-medium"
                  sx={{
                    lineHeight: 1,
                  }}
                >
                  <Typography
                    component={'span'}
                    variant="inherit"
                    sx={{
                      lineHeight: 1,
                    }}
                  >
                    Zakres:{' '}
                  </Typography>
                  {dayjs(fromWeek).format('DD.MM.YYYY')} -{' '}
                  {dayjs(toWeek).add(6, 'day').format('DD.MM.YYYY')}
                </Typography>
              </>
            ) : (
              <>
                <Stack
                  direction={'row'}
                  spacing={2}
                  alignItems={'center'}
                  divider={
                    <Box
                      sx={(theme) => ({
                        borderRight: `1px solid ${theme.palette.divider}`,
                        height: '15px',
                      })}
                    />
                  }
                  flexWrap={'wrap'}
                >
                  <Typography
                    variant="overline"
                    color="textSecondary"
                    className="font-medium"
                    sx={{
                      lineHeight: 1,
                    }}
                  >
                    Pracownicy:{' '}
                    {selectedEmployees.length > 0
                      ? `${selectedEmployees.length} / ${employeesCount}`
                      : filteredEmployees.length}
                  </Typography>
                  <Typography
                    variant="overline"
                    color="textSecondary"
                    className="font-medium"
                    sx={{
                      lineHeight: 1,
                    }}
                  >
                    {activeTable.week.week()} Tydzień
                  </Typography>
                </Stack>
                <Typography
                  variant="overline"
                  color="textSecondary"
                  className="font-medium"
                  sx={{
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                >
                  {activeTable.week.format('DD.MM.YYYY')} -{' '}
                  {activeTable.week.add(6, 'day').format('DD.MM.YYYY')}
                </Typography>
              </>
            )}
          </Stack>
        </Box>
      }
    >
      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {loading && (
          <Box
            sx={(theme) => ({
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: theme.palette.loadingOverlay,
              zIndex: 100,
              borderRadius: 'inherit',
            })}
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
          showFilterBadge={
            selectedEmployees.length + selectedConstructions.length > 0 ||
            showInactive
          }
          setIsFilterOpen={setIsFilterOpen}
          showVacations={showVacations}
          setShowVacations={setShowVacations}
          showDates={showDates}
          setShowDates={setShowDates}
          activeTable={activeTable}
        />

        <Box
          className="overflow-hidden"
          sx={(theme) => ({
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            background: theme.palette.background.paper,
          })}
        >
          {activeTable.type === 0 ? (
            <TableContainer
              component={Box}
              sx={(theme) => ({
                flex: 1,
                overflow: 'auto',
                width: '100%',
                background: theme.palette.background.default,
              })}
            >
              <Table
                stickyHeader
                sx={{
                  tableLayout: 'fixed',
                  minWidth: {
                    xs: `${50 + (50 / 1) * weeks.length}%`,
                    sm: `${30 + (70 / 2) * weeks.length}%`,
                    md: `${25 + (75 / 3) * weeks.length}%`,
                    lg: `${15 + (85 / 4) * weeks.length}%`,
                    xl: `${15 + (85 / 7) * weeks.length}%`,
                  },
                  // minWidth: {
                  //   xs: `${50 + 50 * weeks.length}%`,
                  //   md: `${20 + (80 * weeks.length) / 4}%`,
                  // },
                }}
              >
                <TableHead
                  sx={{ position: 'sticky', left: 0, zIndex: 4, top: 0 }}
                >
                  <TableRow>
                    <TableCell
                      sx={(theme) => ({
                        position: 'sticky',
                        left: 0,
                        zIndex: 4,
                        // width: { xs: '150px', sm: '200px' },
                        background: theme.palette.schedule.accent,
                        width: {
                          xs: '50%',
                          sm: '30%',
                          md: '25%',
                          lg: '15%',
                        },
                      })}
                      className="px-3 py-2 text-center"
                    ></TableCell>
                    {weeks.map((w, index) => {
                      const isBefore = w.isBefore(dayjs(), 'week');
                      const isAfter = w.isAfter(dayjs(), 'week');
                      return (
                        <TableCell
                          key={index}
                          sx={(theme) => ({
                            background: isBefore
                              ? theme.palette.schedule.past
                              : isAfter
                                ? theme.palette.background.default
                                : theme.palette.schedule.current,
                            borderLeft: `1px solid ${theme.palette.divider}`,
                            width: {
                              xs: `${50 / Math.min(weeks.length, 1)}%`,
                              sm: `${70 / Math.min(weeks.length, 2)}%`,
                              md: `${75 / Math.min(weeks.length, 3)}%`,
                              lg: `${85 / Math.min(weeks.length, 4)}%`,
                              xl: `${85 / Math.min(weeks.length, 7)}%`,
                            },
                          })}
                          className={`group relative cursor-pointer px-3 py-2`}
                          onClick={() => setActiveTable({ type: 1, week: w })}
                        >
                          <Typography
                            className="block text-center font-semibold"
                            variant="caption"
                            color="textDisabled"
                          >
                            [{w.week()}]
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
                              transform: 'translateY(-50%) rotate(90deg)',
                              opacity: 0,
                              transition: '0.3s',
                              '.group:hover &': { opacity: 1 },
                            }}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEmployees.map((emp, index) => (
                    <EmployeeRow
                      key={emp.id}
                      employee={emp}
                      weeks={weeks}
                      onCellClick={handleShowInputConstruction}
                      cellText={cellText}
                      activeTable={activeTable}
                      loadingCells={loadingCells}
                      getCellKey={getCellKey}
                      index={index}
                      onEmployeeClick={handleOnEmployeeClick}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <TableContainer
              component={Box}
              sx={(theme) => ({
                flex: 1,
                overflow: 'auto',
                width: '100%',
                background: theme.palette.background.default,
              })}
            >
              <Table stickyHeader sx={{ tableLayout: 'fixed', minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={(theme) => ({
                        position: 'sticky',
                        left: 0,
                        zIndex: 4,
                        width: { xs: '150px', sm: '200px' },
                        background: theme.palette.schedule.accent,
                      })}
                      className="cursor-pointer px-3 py-2 text-center"
                      onClick={() => setActiveTable((p) => ({ ...p, type: 0 }))}
                    >
                      <KeyboardReturnIcon />
                    </TableCell>
                    {Array.from({ length: 7 }).map((_, i) => {
                      const day = activeTable.week.add(i, 'day');
                      const isToday = day.isSame(dayjs(), 'day');
                      return (
                        <TableCell
                          key={i}
                          sx={(theme) => ({
                            width: '150px',
                            background: isToday
                              ? theme.palette.schedule.current
                              : theme.palette.background.default,
                            borderLeft: `1px solid ${theme.palette.divider}`,
                          })}
                          className={`px-3 py-2`}
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
                  {filteredEmployees.map((emp, index) => (
                    <EmployeeRow
                      onEmployeeClick={handleOnEmployeeClick}
                      key={emp.id}
                      employee={emp}
                      weeks={weeks}
                      onCellClick={handleShowInputConstruction}
                      cellText={cellText}
                      activeTable={activeTable}
                      loadingCells={loadingCells}
                      getCellKey={getCellKey}
                      index={index}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        <Menu
          anchorEl={cellAnchorEl}
          open={Boolean(cellAnchorEl)}
          onClose={handleCellMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{
            paper: {
              sx: {
                width: cellAnchorEl ? cellAnchorEl.clientWidth - 2 : 'auto',
                minWidth: '220px',
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
                const dateToCheck = activeCell.isWeek
                  ? dayjs(activeCell.weekKey)
                  : activeCell.date;
                const entry = scheduleMap
                  .get(activeCell.empId)
                  ?.get(dateToCheck.format('YYYY-MM-DD'));
                return (
                  constructions.find((c) => c.id === entry?.constructionId) ?? {
                    id: null,
                    name: '— Brak —',
                  }
                );
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
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Budowa"
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingCells.has(getCellKey(activeCell)) ? (
                            <CircularProgress size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    },
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
          constructions={constructions}
          selectedConstructions={selectedConstructions}
          setSelectedConstructions={setSelectedConstructions}
          showInactiveConstructions={showInactiveConstructions}
          setShowInactiveConstructions={setShowInactiveConstructions}
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

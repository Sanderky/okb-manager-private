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
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';

// dayjs.locale('pl');

type ScheduleConstruction = {
  constructionId: string;
  constructionName: string;
} | null;

type SchedulePayload = Omit<Schedule, 'id' | 'constructions'> & {
  id?: string;
  constructions: ScheduleConstruction[];
};

const ScheduleComponent = () => {
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
  const [loadingCells, setLoadingCells] = useState<Set<string>>(new Set());

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
  }, [fromWeek]);

  useEffect(() => {
    localStorage.setItem('scheduleToWeek', toWeek.toISOString());
  }, [toWeek]);

  const {
    data: employees = [],
    isLoading: isLoadingEmployees,
    isError: isErrorEmployees,
  } = useQuery<Employee[], Error>({
    queryKey: ['employees', { status: true }],
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

  // Funkcja do generowania unikalnego klucza dla komórki
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
    if (!selectedEmployees.length) return employees;
    const ids = new Set(selectedEmployees.map((e) => e.id));
    return employees.filter((e) => ids.has(e.id));
  }, [employees, selectedEmployees]);

  type NormalizedEntry = {
    constructionId: string | null;
    constructionName: string | null;
  } | null;

  const normalizeEntry = useCallback(
    (
      raw:
        | string
        | {
            constructionId?: string;
            constructionName?: string;
            id?: string;
            name?: string;
          }
        | null
        | undefined
    ): NormalizedEntry => {
      if (raw == null) return null;
      if (typeof raw === 'string') {
        return { constructionId: raw, constructionName: null };
      }
      if (typeof raw === 'object') {
        return {
          constructionId: raw.constructionId ?? raw.id ?? null,
          constructionName: raw.constructionName ?? raw.name ?? null,
        };
      }
      return null;
    },
    []
  );

  const resolveEntryName = useCallback(
    (entryNormalized: NormalizedEntry) => {
      if (!entryNormalized) return { name: null, notFound: false };
      const cid = entryNormalized.constructionId;
      if (!cid) return { name: null, notFound: false };
      const found = constructions.find((c) => c.id === cid);
      if (found) return { name: found.name, notFound: false };
      return { name: entryNormalized.constructionName ?? null, notFound: true };
    },
    [constructions]
  );

  const saveScheduleToDatabase = useCallback(
    async (
      empId: string,
      weekStart: Date,
      constructionIds: (string | null)[],
      existing: Schedule | null,
      cellKey: string
    ) => {
      // Ustaw ładowanie dla konkretnej komórki
      setLoadingCells((prev) => new Set(prev).add(cellKey));

      try {
        const constructionsPayload: ScheduleConstruction[] =
          constructionIds.map((cid, idx) => {
            if (!cid) return null;
            const found = constructions.find((c) => c.id === cid);
            if (found) {
              return {
                constructionId: cid,
                constructionName: found.name ?? '',
              };
            }
            const existingEntryRaw = existing?.constructions?.[idx] ?? null;
            const normalizedExisting = normalizeEntry(existingEntryRaw);
            const existingName = normalizedExisting?.constructionName ?? '';
            return { constructionId: cid, constructionName: existingName };
          });

        const scheduleData: SchedulePayload = {
          employeeId: empId,
          employeeName:
            existing?.employeeName ??
            employees.find((e) => e.id === empId)?.name ??
            '',
          constructions: constructionsPayload,
          weekStart: weekStart,
          id: existing?.id,
        };

        await updateScheduleMutation.mutateAsync(scheduleData);
      } finally {
        // Zatrzymaj ładowanie dla konkretnej komórki
        setLoadingCells((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cellKey);
          return newSet;
        });
      }
    },
    [updateScheduleMutation, constructions, employees, normalizeEntry]
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
      const startOfWeek = date.isoWeekday(1);
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
        const existingRaw =
          existingSchedule?.constructions ?? Array(7).fill(null);

        const existingIds = existingRaw.map((entry) => {
          const normalized = normalizeEntry(entry);
          return normalized?.constructionId ?? null;
        });

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
    [schedules, vacations, saveScheduleToDatabase, normalizeEntry, getCellKey]
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
      target.style.backgroundColor = '#d2e1fc';

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
    (
      { empId, weekKey, date, isWeek }: ICell,
      renderEmptyCellIndicator = true
    ) => {
      const weekStart = dayjs(weekKey);

      const schedule = schedules.find(
        (s) =>
          s.employeeId === empId && dayjs(s.weekStart).isSame(weekStart, 'week')
      );

      const weekConstructions =
        Array.from({ length: 7 }, (_, i) => {
          const day = weekStart.add(i, 'day');

          const rawEntry = schedule?.constructions?.[i] ?? null;
          const normalized = normalizeEntry(rawEntry);
          const resolved = resolveEntryName(normalized);
          const isVacation = vacations?.some(
            (v) => v.employeeId === empId && day.isSame(dayjs(v.date), 'day')
          );

          return {
            day,
            name: resolved.name,
            isVacation,
            notFound: resolved.notFound,
          };
        }) ?? [];

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

        if (showVacations && vacationDays.length > 0) {
          const ranges = daysToRanges(vacationDays);
          const label = showDates ? `Urlop (${ranges.join(', ')})` : `Urlop`;
          parts.push(label);
        }

        const allConstructions = Object.entries(constructionsMap);

        // Sprawdzamy czy cały tydzień ma tę samą budowę (6 lub 7 dni)
        const hasSingleConstructionAllWeek =
          allConstructions.length === 1 &&
          (allConstructions[0][1].length === 6 ||
            allConstructions[0][1].length === 7);

        const shouldShowRanges =
          !hasSingleConstructionAllWeek &&
          (allConstructions.length > 1 ||
            vacationDays.length > 0 ||
            hasNullDay);

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
            {parts.join(' / ') || (renderEmptyCellIndicator && '')}
          </Typography>
        );
      }

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
          {dayData
            ? dayData.notFound
              ? `Archiwum: ${dayData.name ?? (renderEmptyCellIndicator && '')}`
              : (dayData.name ?? (renderEmptyCellIndicator && ''))
            : renderEmptyCellIndicator && ''}
        </Typography>
      );
    },
    [
      schedules,
      vacations,
      showVacations,
      showDates,
      normalizeEntry,
      resolveEntryName,
    ]
  );

  // Agregacja stanów ładowania i błędów
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
        <Box className="overflow-hidden rounded-lg border border-gray-300 bg-gray-50">
          {activeTable.type === 0 ? (
            <TableContainer
              component={Box}
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
                        width: {
                          xs: '45%',
                          sm: '40%',
                          md: '30%',
                          lg: '20%',
                        },
                      }}
                      className="bg-blue-200 px-3 py-2 text-center"
                    >
                      <Tooltip
                        title="Kliknij w datę tygodnia w nagłówku tabeli, aby wyświetlić szczegółowy widok tego tygodnia."
                        placement="top"
                        slotProps={{
                          popper: {
                            sx: {
                              cursor: 'pointer',
                            },
                            modifiers: [
                              {
                                name: 'offset',
                                options: {
                                  offset: [0, -14],
                                },
                              },
                            ],
                          },
                        }}
                      >
                        <InfoOutlineIcon color="primary" />
                      </Tooltip>
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
                              ? 'bg-red-600/20'
                              : isAfter
                                ? 'bg-gray-100'
                                : 'bg-green-200'
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
                      onCellChange={handleCellChange}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <TableContainer component={Box}>
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
                        width: {
                          xs: '135px',
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
                            minWidth: '150px',
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
                      onCellChange={handleCellChange}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <Box className="px-3 py-2">
            <Stack
              direction={'row'}
              justifyContent={'space-between'}
              spacing={2}
              alignItems={'center'}
            >
              {activeTable.type === 0 ? (
                <>
                  <Typography
                    variant="overline"
                    className="font-medium text-gray-500"
                  >
                    {weeks.length} Tygodni
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
                      sx={{
                        display: {
                          xs: 'none',
                          sm: 'inline',
                        },
                      }}
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
                  const firstRaw = schedule?.constructions?.find(
                    (
                      entry:
                        | string
                        | {
                            constructionId?: string;
                            constructionName?: string;
                            id?: string;
                            name?: string;
                          }
                        | null
                    ) => {
                      const norm = normalizeEntry(entry);
                      return !!norm?.constructionId;
                    }
                  );
                  const firstNorm = normalizeEntry(firstRaw ?? null);
                  const firstId = firstNorm?.constructionId ?? null;
                  return (
                    constructions.find((c) => c.id === firstId) ?? {
                      id: null,
                      name: '— Brak —',
                    }
                  );
                } else {
                  const index = dayjs(activeCell.date).diff(weekStart, 'day');
                  const rawEntry = schedule?.constructions?.[index] ?? null;
                  const norm = normalizeEntry(rawEntry);
                  const cid = norm?.constructionId ?? null;
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

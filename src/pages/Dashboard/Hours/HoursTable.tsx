import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Box,
  Typography,
  MenuItem,
  CircularProgress,
  IconButton,
  Alert,
  Snackbar,
  Switch,
  Stack,
  Tooltip,
  Collapse,
  Divider,
  Grid,
  Menu,
} from '@mui/material';
import {
  Add,
  Delete,
  ContentCopy,
  ChevronLeft,
  ChevronRight,
  CancelPresentation,
  Clear,
  ExpandLess,
  ExpandMore,
  ReportProblem,
  MoreHoriz,
} from '@mui/icons-material';
import type { Employee, WorkHours } from '../../../types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getEmployeeList } from '../../../api/employees';
import { getConstructionList } from '../../../api/constructions';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/pl';
import {
  getMonthKeysFromWeek,
  getNextWeek,
  getPreviousWeek,
  getStartOfWeek
} from './HoursHelpers';
import WeekSelector from '../../../components/WeekSelector';
import { getVacationListForMonths } from '../../../api/vacations';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useDialogs } from '../../../hooks/useDialogs/useDialogs';
import useNotifications from '../../../hooks/useNotifications/useNotifications';
import { getWorkHoursList, updateWorkHours, deleteWorkHours, deleteConstructionWorkHours, copyFromPreviousWeek } from '../../../api/hours';
import { AddConstructionWithEmployeeDialog, AddEmployeeDialog, CopyTableDialog } from './HoursTableDialogs';

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

const borderBold = '2px solid #333';
const numberCellMaxWidth = '200px';
const numberCellPadding = 0.5;
const constructionCellMaxWidth = '50px';
const constructionCellWidth = 'auto';
const employeeCellMaxWidth = '50px';
const employeeCellWidth = 'auto';
const constructionCellMinWidth = '200px';
const employeeCellMinWidth = '200px';
const vacationColor = 'none';
const sumColor = '#fff3cd';
const tableBorder = '1px solid rgba(0, 0, 0, 0.87)';

interface ConstructionsWithWorkHours {
  id: string;
  name: string;
  workHours: {
    id: string;
    employeeId: string;
    employeeName: string;
    hours: number[];
    total: number;
    isOnVacation: boolean[];
  }[];
  totalHours: number;
}

const getAvailableEmployeesForConstruction = (
  constructionWithWorkHours: ConstructionsWithWorkHours,
  employees: Employee[] | undefined
) => {
  if (!employees || !constructionWithWorkHours) return [];
  const existingEmployeeIds = constructionWithWorkHours.workHours.map(
    (workHour) => workHour.employeeId
  );

  const availableEmployees = employees.filter(
    (employee) => !existingEmployeeIds.includes(employee.id)
  );

  return availableEmployees;
};

interface TableRowsProps {
  constructionsWithWorkHours: ConstructionsWithWorkHours[];
  editMode: boolean;
  handleDeleteConstruction: (constructionId: string) => void;
  handleDeleteEmployee: (workHoursId: string) => void;
  handleHoursChange: (
    workHourId: string,
    dayIndex: number,
    value: string | number
  ) => void;
  handleOpenAddEmployeeDialog: (constructionId: string) => void;
  isLoading: boolean;
  error: Error | null;
  employees: Employee[] | undefined;
}

const TableRows = ({
  error,
  isLoading,
  constructionsWithWorkHours,
  editMode,
  employees,
  handleDeleteConstruction,
  handleDeleteEmployee,
  handleHoursChange,
  handleOpenAddEmployeeDialog,
}: TableRowsProps) => {
  if (error)
    return (
      <TableRow>
        <TableCell colSpan={10} sx={{ height: '300px' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ReportProblem sx={{ color: 'red', fontSize: 40 }} />
            <Typography color="textSecondary" variant="body2">
              Błąd podczas ładowania danych
            </Typography>
            <Typography color="textSecondary" variant="body2">
              {error.message}
            </Typography>
          </Box>
        </TableCell>
      </TableRow>
    );
  else if (isLoading)
    return (
      <TableRow>
        <TableCell colSpan={10} sx={{ height: '300px' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress />
          </Box>
        </TableCell>
      </TableRow>
    );
  else if (constructionsWithWorkHours.length > 0) {
    return constructionsWithWorkHours.map((construction) => {
      const activeEmployees =
        employees?.filter((employee) => employee.status) ?? [];
      const availableEmployees = getAvailableEmployeesForConstruction(
        construction,
        activeEmployees
      );
      return (
        <React.Fragment key={construction.id}>
          {construction.workHours.map((workHour, employeeIndex) => (
            <TableRow key={workHour.id}>
              {employeeIndex === 0 && (
                <TableCell
                  rowSpan={construction.workHours.length + 1}
                  sx={{
                    borderRight: tableBorder,
                    wordBreak: 'break-all',
                    fontWeight: 'bold',
                    verticalAlign: 'top',
                    borderBottom: borderBold,
                    background: '#fff',
                    width: constructionCellWidth,
                    maxWidth: constructionCellMaxWidth,
                    minWidth: constructionCellMinWidth,
                    '& .MuiIconButton-root': {
                      opacity: 0,
                      transition: 'opacity 0.3s ease-in-out',
                    },
                    '&:hover .MuiIconButton-root': {
                      opacity: 1,
                    },
                  }}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <span>{construction.name}</span>
                    <IconButton
                      size="small"
                      sx={{ visibility: editMode ? 'visible' : 'hidden' }}
                      onClick={() => handleDeleteConstruction(construction.id)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              )}

              <TableCell
                sx={{
                  p: numberCellPadding,
                  pl: 2,
                  width: employeeCellWidth,
                  fontWeight: 'bold',
                  wordBreak: 'break-all',
                  borderRight: tableBorder,
                  borderBottom: tableBorder,
                  maxWidth: employeeCellMaxWidth,
                  minWidth: employeeCellMinWidth,
                  '& .MuiIconButton-root': {
                    opacity: 0,
                    transition: 'opacity 0.3s ease-in-out',
                  },
                  '&:hover .MuiIconButton-root': {
                    opacity: 1,
                  },
                }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <span>{workHour.employeeName}</span>
                  <IconButton
                    size="small"
                    sx={{ visibility: editMode ? 'visible' : 'hidden' }}
                    onClick={() => handleDeleteEmployee(workHour.id)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </TableCell>

              {workHour.hours.map((hour, dayIndex) => {
                const isVacation = workHour.isOnVacation[dayIndex];
                return (
                  <TableCell
                    key={dayIndex}
                    align="center"
                    sx={{
                      width: numberCellMaxWidth,
                      borderBottom: tableBorder,
                      p: numberCellPadding,
                      borderRight: tableBorder,
                      backgroundColor: isVacation ? vacationColor : 'none',
                    }}
                  >
                    {isVacation ? (
                      <Typography variant="body2" color="textPrimary">
                        urlop
                      </Typography>
                    ) : editMode ? (
                      <TextField
                        type="number"
                        value={hour}
                        onChange={(e) =>
                          handleHoursChange(
                            workHour.id,
                            dayIndex,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        sx={{
                          '& .MuiInputBase-root:before, & .MuiInputBase-root:after':
                            {
                              borderBottom: 'none !important',
                            },
                          '& .MuiInputBase-input': {
                            textAlign: 'center',
                            padding: '0 !important',
                          },
                        }}
                        variant="standard"
                        size="small"
                        inputProps={{
                          min: 0,
                          max: 24,
                          step: 0.5,
                          style: {
                            textAlign: 'center',
                          },
                        }}
                      />
                    ) : (
                      <Typography>{hour}</Typography>
                    )}
                  </TableCell>
                );
              })}

              <TableCell
                align="center"
                sx={{
                  fontWeight: 'bold',
                  width: numberCellMaxWidth,
                  p: numberCellPadding,
                  borderBottom: tableBorder,
                }}
              >
                {workHour.total.toFixed(1)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell
              sx={{
                borderBottom: borderBold,
                p: 0.5,
                borderRight: tableBorder,
                background: '#fff',
              }}
              colSpan={8}
            >
              <Tooltip
                title={
                  availableEmployees.length === 0
                    ? 'Wszyscy pracownicy zostali już dodani'
                    : ''
                }
              >
                <span>
                  <Button
                    startIcon={<Add />}
                    disabled={availableEmployees.length === 0}
                    onClick={() => handleOpenAddEmployeeDialog(construction.id)}
                    size="small"
                    sx={{ visibility: editMode ? 'visible' : 'hidden' }}
                  >
                    Dodaj pracownika
                  </Button>
                </span>
              </Tooltip>
            </TableCell>
            <TableCell
              align="center"
              sx={{
                borderBottom: borderBold,
                p: 0.5,
                fontWeight: 'bold',
                padding: 0,
                backgroundColor: sumColor,
              }}
            >
              {construction.totalHours.toFixed(1)}
            </TableCell>
          </TableRow>
        </React.Fragment>
      );
    });
  } else
    return (
      <TableRow>
        <TableCell colSpan={10} sx={{ height: '300px' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CancelPresentation
              sx={{ color: 'text.secondary', fontSize: 40 }}
            />
            <Typography color="textSecondary" variant="body2">
              Brak danych dla danego tygodnia
            </Typography>
          </Box>
        </TableCell>
      </TableRow>
    );
};

interface HoursTableProps {
  readOnly?: boolean;
  onTableDelete?: () => void;
}

const HoursTable = ({ readOnly = true, onTableDelete }: HoursTableProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [currentWeek, setCurrentWeek] = useState<Date>(
    getStartOfWeek(new Date())
  );
  const [addConstructionDialogOpen, setAddConstructionDialogOpen] =
    useState(false);
  const [copyDataDialogOpen, setCopyDataDialogOpen] = useState(false);
  const dialogs = useDialogs();
  const notifications = useNotifications();

  useEffect(() => {
    if (currentWeek !== getStartOfWeek(new Date())) setEditMode(false);
  }, [currentWeek]);

  const [addEmployeeDialogOpen, setAddEmployeeDialogOpen] = useState(false);
  const [selectedConstructionForEmployee, setSelectedConstructionForEmployee] =
    useState<string>('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const {
    data: employees,
    isLoading: employeesLoading,
    error: employeesError,
  } = useQuery({
    queryKey: ['employees', false],
    queryFn: () => getEmployeeList(),
  });

  const {
    data: constructions,
    isLoading: constructionsLoading,
    error: constructionsError,
  } = useQuery({
    queryKey: ['constructions'],
    queryFn: getConstructionList,
  });

  const {
    data: workHours,
    isLoading: workHoursLoading,
    error: workHoursError,
  } = useQuery({
    queryKey: ['workHours', currentWeek.toISOString()],
    queryFn: () => getWorkHoursList(currentWeek),
  });

  const {
    data: vacations = [],
    isLoading: vacationsLoading,
    error: vacationsError,
  } = useQuery({
    queryKey: ['vacations', currentWeek.toISOString()],
    queryFn: () => getVacationListForMonths(getMonthKeysFromWeek(currentWeek)),
  });

  const vacationMap = useMemo(() => {
    const map = new Map<string, Set<string>>();

    vacations.forEach((vacation) => {
      if (!vacation.employeeId || !vacation.date) return;

      const dateObj = vacation.date.toDate();
      const dateString = dayjs(dateObj).format('YYYY-MM-DD');

      if (!map.has(vacation.employeeId)) {
        map.set(vacation.employeeId, new Set());
      }

      const employeeVacationSet = map.get(vacation.employeeId)!;
      employeeVacationSet.add(dateString);
    });

    return map;
  }, [vacations]);

  const queryClient = useQueryClient();

  const updateWorkHoursMutation = useMutation({
    mutationFn: updateWorkHours,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workHours', currentWeek.toISOString()],
      });
    },
  });

  const deleteWorkHoursMutation = useMutation({
    mutationFn: deleteWorkHours,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workHours', currentWeek.toISOString()],
      });
    },
  });

  const deleteConstructionMutation = useMutation({
    mutationFn: (constructionId: string) =>
      deleteConstructionWorkHours(constructionId, currentWeek),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workHours', currentWeek.toISOString()],
      });
    },
  });

  const copyFromPreviousWeekMutation = useMutation({
    mutationFn: (sourceWeek: Date) =>
      copyFromPreviousWeek(currentWeek, sourceWeek),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workHours', currentWeek.toISOString()],
      });
      notifications.show('Dane zostały skopiowane z wybranego tygodnia', {
        severity: 'success',
        autoHideDuration: 5000,
      });
    },
    onError: (error: Error) => {
      notifications.show('Błąd podczas kopiowania danych', {
        severity: 'error',
        autoHideDuration: 5000,
      });
      console.error('Data copy error:', error);
    },
  });

  const getWeekDates = () => {
    const start = new Date(currentWeek);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(
        new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
      );
    }
    return dates;
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleHoursChange = (
    workHourId: string,
    dayIndex: number,
    value: number | string
  ) => {
    if (!workHours) return;

    const existingRecord = workHours.find((wh) => wh.id === workHourId);
    if (!existingRecord) return;

    const newHours = [...existingRecord.hours];

    const numericValue =
      typeof value === 'string' ? parseFloat(value) || 0 : value;
    newHours[dayIndex] = numericValue;

    const updatedWorkHours: WorkHours = {
      ...existingRecord,
      hours: newHours,
    };

    updateWorkHoursMutation.mutate(updatedWorkHours);
  };

  const isEmployeeOnVacation = (employeeId: string, date: Date): boolean => {
    const employeeVacations = vacationMap.get(employeeId);
    if (!employeeVacations) {
      return false;
    }
    const dateString = dayjs(date).format('YYYY-MM-DD');
    return employeeVacations.has(dateString);
  };

  const handleDeleteEmployee = async (workHoursId: string) => {
    const confirmation = await dialogs.confirm(
      `Czy na pewno chcesz usunąć tego pracownika z budowy?`,
      {
        title: `Usuwanie pracownika`,
        severity: 'error',
        okText: 'Usuń',
        cancelText: 'Anuluj',
      }
    );
    if (confirmation) {
      deleteWorkHoursMutation.mutate(workHoursId);
    }
  };

  const handleDeleteConstruction = async (constructionId: string) => {
    const confirmation = await dialogs.confirm(
      `Czy na pewno chcesz usunąć tę budowę wraz ze wszystkimi pracownikami?`,
      {
        title: `Usuwanie budowy`,
        severity: 'error',
        okText: 'Usuń',
        cancelText: 'Anuluj',
      }
    );
    if (confirmation) {
      deleteConstructionMutation.mutate(constructionId);
    }
  };

  const handleOpenAddEmployeeDialog = (constructionId: string) => {
    setSelectedConstructionForEmployee(constructionId);
    setAddEmployeeDialogOpen(true);
  };

  const handleConstructionWithEmployeeAdded = () => {};

  const handleEmployeeAdded = () => {};

  const handleCopyFromSourceWeek = useCallback(
    (sourceWeek: Date) => {
      copyFromPreviousWeekMutation.mutate(sourceWeek);
    },
    [copyFromPreviousWeekMutation]
  );

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const totalHoursData = useMemo(() => {
    if (!workHours)
      return { dailyTotals: [0, 0, 0, 0, 0, 0, 0], grandTotal: 0 };

    const dailyTotals = [0, 0, 0, 0, 0, 0, 0];
    let grandTotal = 0;
    const weekDates = getWeekDates();

    workHours.forEach((workHour) => {
      workHour.hours.forEach((hours, dayIndex) => {
        const parsedHours = Number(hours);

        const numericHours = isNaN(parsedHours) ? 0 : parsedHours;

        const date = weekDates[dayIndex];

        if (!isEmployeeOnVacation(workHour.employeeId, date)) {
          dailyTotals[dayIndex] += numericHours;
          grandTotal += numericHours;
        }
      });
    });

    return { dailyTotals, grandTotal };
  }, [workHours, vacations]);

  const constructionsWithWorkHours = useMemo(() => {
    if (!workHours || !constructions || !employees) return [];

    const constructionMap = new Map<string, ConstructionsWithWorkHours>();

    const weekDates = getWeekDates();

    workHours.forEach((workHour) => {
      const construction = constructions.find(
        (c) => c.id === workHour.constructionId
      );
      const employee = employees.find((e) => e.id === workHour.employeeId);

      if (construction && employee) {
        if (!constructionMap.has(construction.id)) {
          constructionMap.set(construction.id, {
            id: construction.id,
            name: construction.name,
            workHours: [],
            totalHours: 0,
          });
        }

        const constructionData = constructionMap.get(construction.id)!;

        const numericHours = workHour.hours.map((h) =>
          typeof h === 'string' ? parseFloat(h as string) || 0 : h
        );

        const isOnVacation = weekDates.map((date) =>
          isEmployeeOnVacation(workHour.employeeId, date)
        );

        const employeeTotalHours = numericHours.reduce(
          (sum, current, index) => {
            return isOnVacation[index] ? sum : sum + current;
          },
          0
        );

        constructionData.workHours.push({
          id: workHour.id,
          employeeId: workHour.employeeId,
          employeeName: employee.name,
          hours: numericHours,
          total: employeeTotalHours,
          isOnVacation,
        });

        constructionData.totalHours += employeeTotalHours;
      }
    });

    return Array.from(constructionMap.values());
  }, [workHours, constructions, employees, vacations]);

  const existingConstructionIds = useMemo(() => {
    return constructionsWithWorkHours.map((construction) => construction.id);
  }, [constructionsWithWorkHours]);

  const getExistingEmployeeIdsForConstruction = useMemo(() => {
    const constructionMap = new Map<string, string[]>();

    constructionsWithWorkHours.forEach((construction) => {
      const employeeIds = construction.workHours.map(
        (workHour) => workHour.employeeId
      );
      constructionMap.set(construction.id, employeeIds);
    });

    return (constructionId: string) => {
      return constructionMap.get(constructionId) || [];
    };
  }, [constructionsWithWorkHours]);

  const isLoading =
    employeesLoading ||
    constructionsLoading ||
    workHoursLoading ||
    vacationsLoading;
  const loadingError =
    workHoursError || employeesError || vacationsError || constructionsError;

  const weekDates = getWeekDates();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const openMobileMenu = Boolean(anchorEl);
  const handleClickMobileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMobileMenu = () => {
    setAnchorEl(null);
  };

  return (
    <Box>
      <Stack
        spacing={1}
        direction={'row'}
        justifyContent={'space-between'}
        className="mb-1 rounded-lg border p-2"
        sx={{
          border: tableBorder,
          display: { xs: 'flex', sm: 'none' },
          alignItems: 'center',
        }}
      >
        <Stack
          alignItems="center"
          direction="row"
          spacing={1}
          sx={{ flexShrink: 0 }}
        >
          <Typography
            sx={{
              display: { xs: 'none', sm: 'none', md: 'none', lg: 'block' },
            }}
            variant="body2"
          >
            Wybrany tydzień:
          </Typography>
          <WeekSelector
            disabled={isLoading}
            value={currentWeek}
            onChange={setCurrentWeek}
          />
        </Stack>
        <IconButton onClick={handleClickMobileMenu}>
          <MoreHoriz />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={openMobileMenu}
          onClose={handleCloseMobileMenu}
        >
          <MenuItem disableRipple sx={{ fontWeight: 'bold' }}>
            Tydzień {dayjs(currentWeek).isoWeek()}
          </MenuItem>
          <Divider />

          <MenuItem
            onClick={() => {
              handleCloseMobileMenu();
              setCurrentWeek(getPreviousWeek(currentWeek));
            }}
            disableRipple
          >
            Poprzedni tydzień
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleCloseMobileMenu();
              setCurrentWeek(getStartOfWeek(new Date()));
            }}
            disableRipple
          >
            Obecny tydzień
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleCloseMobileMenu();
              setCurrentWeek(getNextWeek(currentWeek));
            }}
            disableRipple
          >
            Następny tydzień
          </MenuItem>
          <Divider />
          {!readOnly && [
            <MenuItem
              onClick={() => {
                handleCloseMobileMenu();
                setEditMode((prev) => !prev);
              }}
              disableRipple
            >
              {editMode ? 'Wyłącz edycję' : 'Włącz edycję'}
            </MenuItem>,
            <MenuItem
              onClick={() => {
                handleCloseMobileMenu();
                setCopyDataDialogOpen(true);
              }}
              disableRipple
            >
              Kopiuj z innego tygodnia
            </MenuItem>,
          ]}
          <MenuItem
            onClick={() => {
              handleCloseMobileMenu();
              handleToggleExpand();
            }}
            disableRipple
          >
            {isExpanded ? 'Zwiń tabelę' : 'Rozwiń tabelę'}
          </MenuItem>
          {readOnly && onTableDelete && (
            <MenuItem
              onClick={() => {
                handleCloseMobileMenu();
                onTableDelete();
              }}
              disableRipple
            >
              Zamknij tabelę
            </MenuItem>
          )}
        </Menu>
      </Stack>

      <Box
        className="border-lightGray mb-1 rounded-lg border p-2"
        sx={{
          display: { xs: 'none', sm: 'flex' },

          flexDirection: 'row',
          gap: 2,
        }}
      >
        <Grid
          container
          spacing={2}
          justifyContent="space-between"
          sx={{
            alignItems: 'center',
          }}
        >
          <Grid>
            <Stack direction={'row'}>
              <IconButton
                size="small"
                className="rounded-l-lg rounded-r-none border text-blue-300"
                onClick={() => setCurrentWeek(getPreviousWeek(currentWeek))}
              >
                <ChevronLeft />
              </IconButton>
              <Button
                variant="outlined"
                className="rounded-none border-x-0"
                onClick={() => setCurrentWeek(getStartOfWeek(new Date()))}
              >
                Dziś
              </Button>
              <IconButton
                size="small"
                className="rounded-l-none rounded-r-lg border text-blue-300"
                onClick={() => setCurrentWeek(getNextWeek(currentWeek))}
              >
                <ChevronRight />
              </IconButton>
            </Stack>
          </Grid>

          <Grid>
            <Stack
              alignItems="center"
              direction="row"
              spacing={1}
              sx={{ flexShrink: 0 }}
            >
              <Typography
                sx={{
                  display: { xs: 'none', sm: 'none', md: 'none', lg: 'block' },
                }}
                variant="body2"
              >
                Wybrany tydzień:
              </Typography>
              <WeekSelector
                disabled={isLoading}
                value={currentWeek}
                onChange={setCurrentWeek}
              />
            </Stack>
          </Grid>

          <Grid display={'flex'} alignItems="center" sx={{ pr: 1.5, pl: 1.5 }}>
            <Typography component={'div'} variant="body1">
              Tydzień {dayjs(currentWeek).isoWeek()}
            </Typography>
          </Grid>
        </Grid>
        <Stack direction={'row'} sx={{ marginLeft: 'auto', alignItems: 'top' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              height: 'min-content',
            }}
          >
            {!readOnly && (
              <>
                <Tooltip title="Tryb edycji">
                  <Switch
                    disabled={isLoading}
                    checked={editMode}
                    onChange={(e) => setEditMode(e.currentTarget.checked)}
                  />
                </Tooltip>
                <Tooltip title="Kopiuj z innego tygodnia">
                  <IconButton
                    disabled={isLoading}
                    onClick={() => setCopyDataDialogOpen(true)}
                    loading={copyFromPreviousWeekMutation.isPending}
                  >
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
              </>
            )}
            <Tooltip title={isExpanded ? 'Zwiń' : 'Rozwiń'}>
              <IconButton onClick={handleToggleExpand}>
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Tooltip>
            {readOnly && onTableDelete && (
              <Tooltip title="Usuń tabelę porównawczą">
                <IconButton disabled={isLoading} onClick={onTableDelete}>
                  <Clear />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Stack>
      </Box>

      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <TableContainer
          className="border-lightGray rounded-lg border bg-white"
          sx={{ maxHeight: 600 }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    borderRight: tableBorder,
                    borderBottom: borderBold,
                  }}
                >
                  Budowa
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    borderRight: tableBorder,
                    borderBottom: borderBold,
                  }}
                >
                  Pracownik
                </TableCell>
                {weekDates.map((date, index) => (
                  <TableCell
                    key={index}
                    align="center"
                    sx={{
                      fontWeight: 'bold',
                      borderRight: tableBorder,
                      borderBottom: borderBold,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {date.toLocaleDateString('pl-PL', { weekday: 'short' })}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {date.getDate().toString().padStart(2, '0')}.
                      {(date.getMonth() + 1).toString().padStart(2, '0')}.
                      {date.getFullYear()}
                    </Typography>
                  </TableCell>
                ))}
                <TableCell
                  align="center"
                  sx={{ fontWeight: 'bold', borderBottom: borderBold }}
                >
                  Suma
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRows
                employees={employees}
                isLoading={isLoading}
                handleDeleteConstruction={handleDeleteConstruction}
                handleDeleteEmployee={handleDeleteEmployee}
                handleHoursChange={handleHoursChange}
                handleOpenAddEmployeeDialog={handleOpenAddEmployeeDialog}
                constructionsWithWorkHours={constructionsWithWorkHours}
                editMode={editMode}
                error={loadingError}
              />

              <TableRow
                sx={{
                  borderTop: 'none',
                  borderBottom: 'none',
                  background: '#fff',
                }}
              >
                <TableCell
                  colSpan={7}
                  sx={{ borderTop: 'none', p: 0.5, borderBottom: 'none' }}
                >
                  <Box display="flex" justifyContent="flex-start">
                    <Tooltip
                      title={
                        existingConstructionIds.length ===
                        (constructions?.length || 0)
                          ? 'Wszystkie budowy zostały już dodane'
                          : ''
                      }
                    >
                      <span>
                        <Button
                          startIcon={<Add />}
                          sx={{ visibility: editMode ? 'visible' : 'hidden' }}
                          onClick={() => setAddConstructionDialogOpen(true)}
                          size="small"
                          variant="text"
                          color="primary"
                          disabled={
                            existingConstructionIds.length ===
                            (constructions?.length || 0)
                          }
                        >
                          Dodaj budowę
                        </Button>
                      </span>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell
                  sx={{ borderTop: 'none', p: 0.5, borderBottom: 'none' }}
                  colSpan={2}
                  align="right"
                >
                  Suma całkowita:
                </TableCell>
                <TableCell
                  sx={{ borderTop: 'none', p: 0.5, borderBottom: 'none' }}
                  align="center"
                >
                  {constructionsWithWorkHours.length > 0
                    ? totalHoursData.grandTotal.toFixed(1)
                    : '-'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Collapse>

      <AddConstructionWithEmployeeDialog
        open={addConstructionDialogOpen}
        onClose={() => setAddConstructionDialogOpen(false)}
        currentWeek={currentWeek}
        onSuccess={handleConstructionWithEmployeeAdded}
        existingConstructionIds={existingConstructionIds}
      />

      <CopyTableDialog
        open={copyDataDialogOpen}
        onClose={() => setCopyDataDialogOpen(false)}
        handleCopyFromSourceWeek={handleCopyFromSourceWeek}
        currentWeek={currentWeek}
      />

      <AddEmployeeDialog
        open={addEmployeeDialogOpen}
        onClose={() => setAddEmployeeDialogOpen(false)}
        constructionId={selectedConstructionForEmployee}
        currentWeek={currentWeek}
        onEmployeeAdded={handleEmployeeAdded}
        existingEmployeeIds={getExistingEmployeeIdsForConstruction(
          selectedConstructionForEmployee
        )}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HoursTable;

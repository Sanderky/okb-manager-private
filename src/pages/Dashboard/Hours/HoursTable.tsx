import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Typography,
  CircularProgress,
  Tooltip,
  Collapse,
  InputBase,
  Stack,
  TableFooter,
} from '@mui/material';
import {
  Add,
  AutoFixHigh,
  ContentCopy,
  ReportProblem,
} from '@mui/icons-material';
import type { Construction, Employee } from '../../../types';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/pl';
import isoWeek from 'dayjs/plugin/isoWeek';
import {
  AddConstructionWithEmployeeDialog,
  AddEmployeeDialog,
  CopyTableDialog,
  FiltersDialog,
} from './HoursTableDialogs';
import useHoursTable, {
  type ConstructionsWithWorkHours,
} from './useHoursTable';
import HoursTableControls from './HoursTableControls';
import { PrintableTable } from './PrintReport';
import {
  formatToPolishDecimal,
  sortConstructionsWithWorkHours,
} from './HoursHelpers';
import type { TableData } from './Hours';

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

const numberCellMaxWidth = '20px';
const numberCellPadding = 0.5;

const inputStyles = {
  textAlign: 'center',
  backgroundColor: 'transparent',
  padding: 0,
  height: '100%',
  flexGrow: 1,
} as const;

const areConstructionsEqual = (
  prev: ConstructionsWithWorkHours,
  next: ConstructionsWithWorkHours
) => {
  if (prev === next) return true;
  if (prev.id !== next.id) return false;
  if (prev.isActive !== next.isActive) return false;
  if (prev.totalHours !== next.totalHours) return false;
  if (prev.workHours.length !== next.workHours.length) return false;

  for (let i = 0; i < prev.workHours.length; i++) {
    const pWh = prev.workHours[i];
    const nWh = next.workHours[i];

    if (pWh.id !== nWh.id) return false;
    if (pWh.total !== nWh.total) return false;
    if (pWh.isActive !== nWh.isActive) return false;

    for (let j = 0; j < 7; j++) {
      if (pWh.hours[j] !== nWh.hours[j]) return false;
    }
  }

  return true;
};

interface EditableCellProps {
  value: number;
  id: string;
  dayIndex: number;
  onCommit: (id: string, dayIndex: number, val: number) => void;
  max?: number;
  isHoliday?: boolean;
  isActive: boolean;
}

const EditableCell = React.memo(
  ({
    value,
    id,
    dayIndex,
    onCommit,
    max = 24,
    isHoliday,
    isActive,
  }: EditableCellProps) => {
    const [localValue, setLocalValue] = useState<string>(
      value > 0 ? value.toString() : ''
    );

    useEffect(() => {
      setLocalValue(value > 0 ? value.toString() : '');
    }, [value]);

    const handleBlur = () => {
      let numVal = parseFloat(localValue.replace(',', '.'));
      if (isNaN(numVal)) numVal = 0;

      if (numVal !== value) {
        onCommit(id, dayIndex, numVal);
      } else {
        setLocalValue(numVal > 0 ? numVal.toString() : '');
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        (e.target as HTMLElement).blur();
      }
    };

    if (isHoliday) {
      return (
        <Typography color="vacation" variant="body2" className="font-medium">
          Urlop
        </Typography>
      );
    }

    return (
      <InputBase
        value={localValue}
        readOnly={!isActive}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        type="number"
        inputProps={{
          min: 0,
          max,
          step: 0.5,
          style: {
            ...inputStyles,
            caretColor: isActive ? 'auto' : 'transparent',
          },
        }}
        sx={(theme) => ({
          width: '100%',
          height: '100%',
          fontSize: '0.875rem',
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          '& .MuiInputBase-input': {
            height: '100% !important',
            color: isActive ? 'black' : 'inherit',
            '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
              WebkitAppearance: 'none',
              margin: 0,
            },
            '&[type=number]': { MozAppearance: 'textfield' },
            '&:focus': isActive
              ? {
                  boxShadow: `inset 0 0 0 2px ${theme.palette.primary.main}`,
                }
              : {},
          },
        })}
      />
    );
  },
  (prev, next) => {
    return (
      prev.value === next.value &&
      prev.isHoliday === next.isHoliday &&
      prev.isActive === next.isActive &&
      prev.id === next.id &&
      prev.dayIndex === next.dayIndex
    );
  }
);

interface ConstructionRowProps {
  construction: ConstructionsWithWorkHours;
  editMode: boolean;
  activeEmployees: Employee[];
  handleDeleteConstruction: (id: string, name: string) => void;
  handleDeleteEmployee: (id: string, empName: string, consName: string) => void;
  handleHoursChange: (id: string, dayIdx: number, val: number | string) => void;
  handleOpenAddEmployeeDialog: (id: string) => void;
}

const ConstructionRow = React.memo(
  ({
    construction,
    editMode,
    activeEmployees,
    handleDeleteConstruction,
    handleDeleteEmployee,
    handleHoursChange,
    handleOpenAddEmployeeDialog,
  }: ConstructionRowProps) => {
    const availableEmployeesForThisRow = useMemo(() => {
      const assignedIds = new Set(
        construction.workHours.map((wh) => wh.employeeId)
      );
      return activeEmployees.filter((e) => !assignedIds.has(e.id));
    }, [activeEmployees, construction.workHours]);

    return (
      <React.Fragment>
        {construction.workHours.map((workHour, employeeIndex) => (
          <TableRow key={workHour.id}>
            {employeeIndex === 0 && (
              <TableCell
                rowSpan={construction.workHours.length + 1}
                align="center"
                sx={(theme) => ({
                  borderRight: `1px solid ${theme.palette.divider}`,
                  fontWeight: 'bold',
                  verticalAlign: 'middle',
                  borderBottom: theme.hoursTable.borderBold,
                })}
              >
                <Typography
                  onClick={() =>
                    editMode &&
                    handleDeleteConstruction(construction.id, construction.name)
                  }
                  sx={{
                    textDecoration: !construction.isActive
                      ? 'line-through'
                      : 'none',
                    color: !construction.isActive
                      ? 'text.disabled'
                      : 'text.primary',
                    cursor: editMode ? 'pointer' : 'text',
                    fontSize: { xs: '0.75rem', md: '0.85rem' },
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: editMode
                        ? 'underline'
                        : !construction.isActive
                          ? 'line-through'
                          : 'none',
                    },
                  }}
                >
                  {construction.name}
                </Typography>
              </TableCell>
            )}

            <TableCell
              align="center"
              sx={(theme) => ({
                verticalAlign: 'middle',
                p: numberCellPadding,
                position: 'relative',
                borderRight: `1px solid ${theme.palette.divider}`,
                borderBottom: `1px solid ${theme.palette.divider}`,
              })}
            >
              <Typography
                onClick={() =>
                  editMode &&
                  handleDeleteEmployee(
                    workHour.id,
                    workHour.employeeName,
                    construction.name
                  )
                }
                sx={{
                  textDecoration: !workHour.isActive ? 'line-through' : 'none',
                  color: !workHour.isActive ? 'text.disabled' : 'text.primary',
                  cursor: editMode ? 'pointer' : 'text',
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', md: '0.85rem' },
                  '&:hover': {
                    textDecoration: editMode
                      ? 'underline'
                      : !workHour.isActive
                        ? 'line-through'
                        : 'none',
                  },
                }}
              >
                {workHour.employeeName}
              </Typography>
            </TableCell>

            {workHour.hours.map((hour, dayIndex) => {
              const isVacation = workHour.isOnVacation[dayIndex];
              return (
                <TableCell
                  key={`${workHour.id}-${dayIndex}`}
                  align="center"
                  sx={(theme) => ({
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    p: 0,
                    borderRight: `1px solid ${theme.palette.divider}`,
                    height: '33px',
                    background:
                      hour > 24
                        ? theme.palette.hours.error
                        : hour > 10
                          ? theme.palette.hours.warning
                          : '',
                  })}
                >
                  <EditableCell
                    value={hour}
                    id={workHour.id}
                    dayIndex={dayIndex}
                    isHoliday={isVacation}
                    isActive={editMode}
                    onCommit={handleHoursChange}
                  />
                </TableCell>
              );
            })}

            <TableCell
              align="center"
              sx={(theme) => ({
                width: numberCellMaxWidth,
                minWidth: '20px',
                p: numberCellPadding,
                borderBottom: `1px solid ${theme.palette.divider}`,
              })}
            >
              <Typography className="text-center font-semibold" variant="body2">
                {formatToPolishDecimal(workHour.total)}
              </Typography>
            </TableCell>
          </TableRow>
        ))}
        <TableRow>
          <TableCell
            sx={(theme) => ({
              borderBottom: theme.hoursTable.borderBold,
              p: 0,
              pl: 1,
              borderRight: `1px solid ${theme.palette.divider}`,
              background: theme.palette.background.paper,
            })}
            colSpan={8}
          >
            <Tooltip
              title={
                availableEmployeesForThisRow.length === 0
                  ? 'Wszyscy pracownicy zostali już dodani'
                  : ''
              }
            >
              <span>
                <Button
                  startIcon={<Add />}
                  disabled={availableEmployeesForThisRow.length === 0}
                  onClick={() => handleOpenAddEmployeeDialog(construction.id)}
                  size="small"
                  sx={{
                    visibility: editMode ? 'visible' : 'hidden',
                  }}
                >
                  Dodaj pracowników
                </Button>
              </span>
            </Tooltip>
          </TableCell>
          <TableCell
            align="center"
            sx={(theme) => ({
              borderBottom: theme.hoursTable.borderBold,
              p: 0.5,
              background: theme.palette.schedule.accent,
            })}
          >
            <Typography className="text-center font-semibold" variant="body2">
              {formatToPolishDecimal(construction.totalHours)}
            </Typography>
          </TableCell>
        </TableRow>
      </React.Fragment>
    );
  },
  (prev, next) => {
    const isStable =
      prev.editMode === next.editMode &&
      prev.activeEmployees === next.activeEmployees &&
      prev.handleDeleteConstruction === next.handleDeleteConstruction &&
      prev.handleHoursChange === next.handleHoursChange;

    if (!isStable) return false;

    return areConstructionsEqual(prev.construction, next.construction);
  }
);

interface TableRowsProps {
  constructionsWithWorkHours: ConstructionsWithWorkHours[];
  editMode: boolean;
  activeEmployees: Employee[];
  handleDeleteConstruction: (id: string, name: string) => void;
  handleDeleteEmployee: (id: string, empName: string, consName: string) => void;
  handleHoursChange: (
    id: string,
    dayIndex: number,
    value: string | number
  ) => void;
  handleOpenAddEmployeeDialog: (constructionId: string) => void;
}

const TableRows = React.memo(
  ({
    constructionsWithWorkHours,
    editMode,
    activeEmployees,
    handleDeleteConstruction,
    handleDeleteEmployee,
    handleHoursChange,
    handleOpenAddEmployeeDialog,
  }: TableRowsProps) => {
    return constructionsWithWorkHours.map((construction) => (
      <ConstructionRow
        key={construction.id}
        construction={construction}
        editMode={editMode}
        activeEmployees={activeEmployees}
        handleDeleteConstruction={handleDeleteConstruction}
        handleDeleteEmployee={handleDeleteEmployee}
        handleHoursChange={handleHoursChange}
        handleOpenAddEmployeeDialog={handleOpenAddEmployeeDialog}
      />
    ));
  },
  (prev, next) => {
    return (
      prev.constructionsWithWorkHours === next.constructionsWithWorkHours &&
      prev.editMode === next.editMode &&
      prev.activeEmployees === next.activeEmployees
    );
  }
);

interface NoTableProps {
  editMode: boolean;
  isLoading: boolean;
  error: Error | null;
  isFilling: boolean;
  handleFillWithSchedule: () => Promise<void>;
  handleCopyDataDialogOpen: () => void;
  availableConstructions: Construction[];
  handleAddConstruction: () => void;
}

const NoTable = ({
  error,
  isLoading,
  editMode,
  availableConstructions,
  handleCopyDataDialogOpen,
  handleFillWithSchedule,
  handleAddConstruction,
}: NoTableProps) => {
  const content = useMemo(() => {
    if (error) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ReportProblem sx={{ color: 'red', fontSize: 40 }} />
          <Typography color="error" variant="body1" sx={{ fontWeight: '400' }}>
            Błąd podczas ładowania danych
          </Typography>
          <Typography color="textSecondary" variant="body2">
            {error.message}
          </Typography>
        </Box>
      );
    }
    if (isLoading) {
      return <CircularProgress />;
    }
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          color="textSecondary"
          variant="body1"
          sx={{ fontWeight: '400' }}
        >
          Brak danych dla tego tygodnia
        </Typography>
        {editMode && (
          <>
            <Button
              onClick={handleFillWithSchedule}
              loading={isLoading}
              variant="outlined"
              startIcon={<AutoFixHigh />}
              sx={{ mt: 2 }}
            >
              Uzupełnij proponowane
            </Button>
            <Button
              onClick={handleCopyDataDialogOpen}
              loading={isLoading}
              variant="outlined"
              startIcon={<ContentCopy />}
              sx={{ mt: 2 }}
            >
              Kopiuj dane z innego tygodnia
            </Button>
            <Tooltip
              title={
                availableConstructions.length === 0
                  ? 'Wszystkie budowy zostały już dodane'
                  : ''
              }
            >
              <span>
                <Button
                  startIcon={<Add />}
                  sx={{ visibility: editMode ? 'visible' : 'hidden', mt: 2 }}
                  onClick={handleAddConstruction}
                  variant="contained"
                  color="primary"
                  disabled={availableConstructions.length === 0}
                >
                  Dodaj pierwszą budowę
                </Button>
              </span>
            </Tooltip>
          </>
        )}
      </Box>
    );
  }, [
    isLoading,
    error,
    editMode,
    handleCopyDataDialogOpen,
    handleFillWithSchedule,
    handleAddConstruction,
    availableConstructions,
  ]);

  return (
    <Box
      sx={(theme) => ({
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: `1px solid ${theme.palette.divider}`,
      })}
    >
      {content}
    </Box>
  );
};

interface HoursTableProps {
  containerWidth: number;
  readOnly?: boolean;
  onTableDelete?: () => void;
  onTableDataUpdate?: (data: TableData) => void;
  tableId?: string;
}

const HoursTable = ({
  containerWidth,
  readOnly = true,
  onTableDelete,
  onTableDataUpdate,
}: HoursTableProps) => {
  const [addConstructionDialogOpen, setAddConstructionDialogOpen] =
    useState(false);
  const [copyDataDialogOpen, setCopyDataDialogOpen] = useState(false);
  const [addEmployeeDialogOpen, setAddEmployeeDialogOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const {
    isLoading,
    currentWeek,
    onWeeekChange,
    handleWeekChange,
    handleToggleEditMode,
    editMode,
    isExpanded,
    handleToggleExpand,
    weekDates,
    handleDeleteConstruction,
    handleCopyFromSourceWeek,
    handleDeleteEmployee,
    handleEmployeesAdded,
    handleConstructionWithEmployeeAdded,
    handleHoursChange,
    totalHoursData,
    selectedConstructionForEmployee,
    loadingError,
    isCoping,
    constructionsWithWorkHours,
    onSelectedConstructionForEmployeeChange,
    selectedConstructions,
    onSelectedConstructionsChange,
    isFilling,
    handleFillWithSchedule,
    isSaving,
    handleCancelEdit,
    selectedEmployees,
    onSelectedEmployeesChange,
    getAvailableEmployeesForConstruction,
    getAvailableConstructions,
    getActiveEmployees,
    hasUnsavedChanges,
    setShowInactiveConstructions,
    setShowInactiveEmployees,
    showInactiveConstructions,
    showInactiveEmployees,
    employees,
    constructions,
  } = useHoursTable();

  const tableDataPayload = useMemo(
    () => ({
      weekStart: currentWeek,
      constructionsWithWorkHours,
      weekDates,
      totalHoursData,
    }),
    [currentWeek, constructionsWithWorkHours, weekDates, totalHoursData]
  );

  useEffect(() => {
    if (onTableDataUpdate && !isLoading && !loadingError) {
      onTableDataUpdate(tableDataPayload);
    }
  }, [tableDataPayload, isLoading, loadingError, onTableDataUpdate]);

  const dataSorted = useMemo(() => {
    return sortConstructionsWithWorkHours(constructionsWithWorkHours);
  }, [constructionsWithWorkHours]);

  const activeEmployees = useMemo(
    () => getActiveEmployees(),
    [getActiveEmployees]
  );

  const handleOpenAddEmployeeDialog = useCallback(
    (constructionId: string) => {
      onSelectedConstructionForEmployeeChange(constructionId);
      setAddEmployeeDialogOpen(true);
    },
    [onSelectedConstructionForEmployeeChange]
  );

  const handleCopyDataDialogOpen = useCallback(() => {
    setCopyDataDialogOpen(true);
  }, []);

  const handleAddConstructionClick = useCallback(() => {
    setAddConstructionDialogOpen(true);
  }, []);
  // ---------------------------------------------

  const printContentRef = useRef<HTMLDivElement>(null);
  const isTableLoading = isCoping || isFilling || isLoading;
  const availableConstructions = getAvailableConstructions();

  const employeesCount = useMemo(() => {
    return constructionsWithWorkHours.reduce((acc, construction) => {
      return acc + construction.workHours.length;
    }, 0);
  }, [constructionsWithWorkHours]);

  const tableHeaders = useMemo(
    () =>
      weekDates.map((date, index) => (
        <TableCell
          key={`${date.getTime()}-${index}`}
          align="center"
          sx={(theme) => ({
            borderRight: `1px solid ${theme.palette.divider}`,
            borderBottom: theme.hoursTable.borderBold,
            background: theme.palette.background.default,
          })}
        >
          <Typography
            className="block text-center font-semibold"
            variant="caption"
          >
            {date.toLocaleDateString('pl-PL', { weekday: 'short' })}
          </Typography>
          <Typography className="text-center font-semibold" variant="body2">
            {date.getDate().toString().padStart(2, '0')}.
            {(date.getMonth() + 1).toString().padStart(2, '0')}
          </Typography>
        </TableCell>
      )),
    [weekDates]
  );

  return (
    <Box>
      <Box sx={{ display: 'none' }}>
        <Box
          ref={printContentRef}
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <PrintableTable
            showVacation={true}
            constructionsWithWorkHours={dataSorted}
            weekDates={weekDates}
            totalHoursData={totalHoursData}
          />
        </Box>
      </Box>
      <HoursTableControls
        hasUnsavedChanges={hasUnsavedChanges}
        containerWidth={containerWidth}
        isLoading={isTableLoading || isSaving}
        currentWeek={currentWeek}
        handleWeekChange={handleWeekChange}
        onWeeekChange={onWeeekChange}
        handleToggleEditMode={handleToggleEditMode}
        readOnly={readOnly}
        handleCopyDataDialogOpen={handleCopyDataDialogOpen}
        handleToggleExpand={handleToggleExpand}
        editMode={editMode}
        isExpanded={isExpanded}
        isCoping={isCoping}
        onTableDelete={onTableDelete}
        contentRef={printContentRef}
        handleCancelEdit={handleCancelEdit}
        handleFillWithSchedule={handleFillWithSchedule}
        showFilterBadge={
          selectedConstructions.length + selectedEmployees.length > 0
        }
        setIsFilterOpen={setIsFilterOpen}
      />
      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        {!loadingError &&
        !isTableLoading &&
        constructionsWithWorkHours.length > 0 ? (
          <Box sx={{ position: 'relative' }}>
            {isSaving && (
              <Box
                sx={(theme) => ({
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: theme.palette.loadingOverlay,
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(2px)',
                  borderRadius: '8px',
                })}
              >
                <CircularProgress size={40} />
              </Box>
            )}
            <TableContainer
              sx={(theme) => ({
                background: theme.palette.background.paper,
                position: 'relative',
                maxHeight: `500px`,
              })}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={(theme) => ({
                        borderRight: `1px solid ${theme.palette.divider}`,
                        borderBottom: theme.hoursTable.borderBold,
                        background: theme.palette.background.default,
                      })}
                      align="center"
                    >
                      <Typography
                        className="text-center font-semibold"
                        variant="body2"
                      >
                        Budowa
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={(theme) => ({
                        borderRight: `1px solid ${theme.palette.divider}`,
                        borderBottom: theme.hoursTable.borderBold,
                        background: theme.palette.background.default,
                      })}
                      align="center"
                    >
                      <Typography
                        className="text-center font-semibold"
                        variant="body2"
                      >
                        Pracownik
                      </Typography>
                    </TableCell>
                    {tableHeaders}
                    <TableCell
                      align="center"
                      sx={(theme) => ({
                        borderBottom: theme.hoursTable.borderBold,
                        background: theme.palette.background.default,
                      })}
                    >
                      <Typography
                        className="text-center font-semibold"
                        variant="body2"
                      >
                        Suma
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRows
                    handleDeleteConstruction={handleDeleteConstruction}
                    handleDeleteEmployee={handleDeleteEmployee}
                    handleHoursChange={handleHoursChange}
                    handleOpenAddEmployeeDialog={handleOpenAddEmployeeDialog}
                    constructionsWithWorkHours={dataSorted}
                    editMode={editMode}
                    activeEmployees={activeEmployees}
                  />
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      sx={(theme) => ({
                        position: 'sticky',
                        bottom: -1,
                        zIndex: 2,
                        p: 0,
                        pl: 1,
                        borderTop: `1px solid ${theme.palette.divider}`,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        background: theme.palette.background.paper,
                      })}
                    >
                      <Stack
                        direction="row"
                        spacing={3}
                        alignItems="center"
                        justifyContent={'space-between'}
                        pl={1}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          columnGap={3}
                        >
                          <Tooltip
                            title={
                              availableConstructions.length === 0 && editMode
                                ? 'Wszystkie budowy zostały już dodane'
                                : ''
                            }
                          >
                            <Box
                              component="span"
                              sx={{
                                order: editMode ? 1 : 4,
                              }}
                            >
                              <Button
                                sx={{
                                  visibility: editMode ? 'visible' : 'hidden',
                                }}
                                startIcon={<Add />}
                                onClick={handleAddConstructionClick}
                                size="small"
                                variant="text"
                                color="primary"
                                disabled={availableConstructions.length === 0}
                              >
                                Dodaj budowę
                              </Button>
                            </Box>
                          </Tooltip>

                          {hasUnsavedChanges && (
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 500 }}
                              color="primary"
                              order={2}
                            >
                              Masz niezapisane zmiany*
                            </Typography>
                          )}

                          <Stack
                            direction="row"
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
                            sx={{ order: 3 }}
                          >
                            <Typography
                              variant="overline"
                              color="textSecondary"
                              className="font-medium"
                            >
                              Budowy: {constructionsWithWorkHours.length}
                            </Typography>
                            <Typography
                              variant="overline"
                              color="textSecondary"
                              className="font-medium"
                            >
                              Pracownicy: {employeesCount}
                            </Typography>
                          </Stack>
                        </Stack>

                        <Typography variant="overline" className="font-medium">
                          Suma całkowita:
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={(theme) => ({
                        position: 'sticky',
                        bottom: -1,
                        p: 0,
                        zIndex: 2,
                        background: theme.palette.background.paper,
                        borderTop: `1px solid ${theme.palette.divider}`,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      })}
                    >
                      <Typography variant="overline" className="font-medium">
                        {constructionsWithWorkHours.length > 0
                          ? formatToPolishDecimal(totalHoursData.grandTotal)
                          : '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
          </Box>
        ) : (
          <NoTable
            isFilling={isFilling}
            handleFillWithSchedule={handleFillWithSchedule}
            isLoading={isTableLoading}
            editMode={editMode}
            error={loadingError}
            handleCopyDataDialogOpen={handleCopyDataDialogOpen}
            handleAddConstruction={handleAddConstructionClick}
            availableConstructions={availableConstructions}
          />
        )}
      </Collapse>

      <AddConstructionWithEmployeeDialog
        open={addConstructionDialogOpen}
        onClose={() => setAddConstructionDialogOpen(false)}
        currentWeek={currentWeek}
        onSuccess={handleConstructionWithEmployeeAdded}
        activeEmployees={getActiveEmployees()}
        availableConstructions={getAvailableConstructions()}
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
        selectedConstruction={selectedConstructionForEmployee}
        currentWeek={currentWeek}
        onEmployeeAdded={handleEmployeesAdded}
        availableEmployees={getAvailableEmployeesForConstruction(
          selectedConstructionForEmployee?.id
        )}
      />

      <FiltersDialog
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onSelectedConstructionsChange={onSelectedConstructionsChange}
        selectedEmployees={selectedEmployees}
        onSelectedEmployeesChange={onSelectedEmployeesChange}
        selectedConstructions={selectedConstructions}
        employees={employees ?? []}
        constructions={constructions ?? []}
        showInactiveConstructions={showInactiveConstructions}
        showInactiveEmployees={showInactiveEmployees}
        handleShowInactiveConstructionsChange={setShowInactiveConstructions}
        handleShowInactiveEmployeesChange={setShowInactiveEmployees}
      />
    </Box>
  );
};

export default HoursTable;

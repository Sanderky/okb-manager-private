import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import { useLayout } from '../../../context/LayoutContext';

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

const borderBold = '1px solid #333';
const numberCellMaxWidth = '20px';
const numberCellPadding = 0.5;
const redAlert = 'bg-red-300';
const orangeAlert = 'bg-amber-300';
const tableBorder = '1px solid rgb(224, 224, 224)';

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
      }

      setLocalValue(numVal > 0 ? numVal.toString() : '');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        (e.target as HTMLElement).blur();
      }
    };
    useEffect(() => {
      setLocalValue(value > 0 ? value.toString() : '');
    }, [value]);

    if (isHoliday) {
      return (
        <Typography variant="body2" className="font-medium text-amber-700">
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
            textAlign: 'center',
            backgroundColor: 'transparent',
            padding: 0,
            caretColor: isActive ? 'auto' : 'transparent',
            height: '100%',
            flexGrow: 1,
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
      prev.isActive === next.isActive
    );
  }
);
interface TableRowsProps {
  constructionsWithWorkHours: ConstructionsWithWorkHours[];
  editMode: boolean;
  handleDeleteConstruction: (
    constructionId: string,
    constructionName: string
  ) => Promise<void>;
  handleDeleteEmployee: (
    workHoursId: string,
    employeeName: string,
    constructionName: string
  ) => void;
  handleHoursChange: (
    workHourId: string,
    dayIndex: number,
    value: string | number
  ) => void;
  handleOpenAddEmployeeDialog: (constructionId: string) => void;
  getAvailableEmployeesForConstruction: (constructionId: string) => Employee[];
}

const TableRows = React.memo(
  ({
    constructionsWithWorkHours,
    editMode,
    handleDeleteConstruction,
    handleDeleteEmployee,
    handleHoursChange,
    handleOpenAddEmployeeDialog,
    getAvailableEmployeesForConstruction,
  }: TableRowsProps) => {
    return constructionsWithWorkHours.map((construction) => {
      const availableEmployees = getAvailableEmployeesForConstruction(
        construction.id
      );
      return (
        <React.Fragment key={construction.id}>
          {construction.workHours.map((workHour, employeeIndex) => (
            <TableRow key={workHour.id}>
              {employeeIndex === 0 && (
                <TableCell
                  rowSpan={construction.workHours.length + 1}
                  align="center"
                  sx={{
                    borderRight: tableBorder,
                    fontWeight: 'bold',
                    verticalAlign: 'middle',
                    borderBottom: borderBold,
                  }}
                >
                  <Typography
                    onClick={() =>
                      editMode &&
                      handleDeleteConstruction(
                        construction.id,
                        construction.name
                      )
                    }
                    sx={{
                      textDecoration: !construction.isActive
                        ? 'line-through'
                        : 'none',
                      color: !construction.isActive
                        ? 'text.disabled'
                        : 'text.primary',
                      cursor: editMode ? 'pointer' : 'text',
                      fontSize: {
                        xs: '0.75rem',
                        md: '0.85rem',
                      },
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
                    {/* {`${constructionIndex + 1}. ${construction.name}`} */}
                    {construction.name}
                  </Typography>
                </TableCell>
              )}

              <TableCell
                align="center"
                sx={{
                  verticalAlign: 'middle',
                  p: numberCellPadding,
                  position: 'relative',
                  borderRight: tableBorder,
                  borderBottom: tableBorder,
                }}
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
                    textDecoration: !workHour.isActive
                      ? 'line-through'
                      : 'none',
                    color: !workHour.isActive
                      ? 'text.disabled'
                      : 'text.primary',
                    cursor: editMode ? 'pointer' : 'text',
                    fontWeight: 600,
                    fontSize: {
                      xs: '0.75rem',
                      md: '0.85rem',
                    },
                    '&:hover': {
                      textDecoration: editMode
                        ? 'underline'
                        : !workHour.isActive
                          ? 'line-through'
                          : 'none',
                    },
                  }}
                >
                  {/* {`${employeeIndex + 1}. ${workHour.employeeName}`} */}
                  {workHour.employeeName}
                </Typography>
              </TableCell>

              {workHour.hours.map((hour, dayIndex) => {
                const isVacation = workHour.isOnVacation[dayIndex];

                return (
                  <TableCell
                    key={`${workHour.id}-${dayIndex}`}
                    align="center"
                    className={
                      hour > 24 ? redAlert : hour > 10 ? orangeAlert : ''
                    }
                    sx={{
                      borderBottom: tableBorder,
                      p: 0,
                      borderRight: tableBorder,
                      height: '33px',
                    }}
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
                sx={{
                  width: numberCellMaxWidth,
                  minWidth: '20px',
                  p: numberCellPadding,
                  borderBottom: tableBorder,
                }}
              >
                <Typography
                  className="text-center font-semibold"
                  variant="body2"
                >
                  {formatToPolishDecimal(workHour.total)}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell
              sx={{
                borderBottom: borderBold,
                p: 0,
                pl: 1,
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
              className="bg-blue-200"
              sx={{ borderBottom: borderBold, p: 0.5 }}
            >
              <Typography className="text-center font-semibold" variant="body2">
                {formatToPolishDecimal(construction.totalHours)}
              </Typography>
            </TableCell>
          </TableRow>
        </React.Fragment>
      );
    });
  },
  (prev, next) => {
    return (
      prev.constructionsWithWorkHours === next.constructionsWithWorkHours &&
      prev.editMode === next.editMode
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
                  Dodaj budowę
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
      className="border-lightGray rounded-lg border bg-gray-50"
      sx={(theme) => ({
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        outline: editMode
          ? `2px solid ${theme.palette.primary.main} !important`
          : '',
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

  const [toolbarHeight, setToolbarHeight] = useState(0);
  const { headerHeight, topBarHeight } = useLayout();

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

  useEffect(() => {
    if (onTableDataUpdate && !isLoading && !loadingError) {
      onTableDataUpdate({
        weekStart: currentWeek,
        constructionsWithWorkHours,
        weekDates,
        totalHoursData,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentWeek,
    constructionsWithWorkHours,
    isLoading,
    loadingError,
    totalHoursData,
    weekDates,
  ]);

  const dataSorted = useMemo(() => {
    return sortConstructionsWithWorkHours(constructionsWithWorkHours);
  }, [constructionsWithWorkHours]);

  const handleOpenAddEmployeeDialog = (constructionId: string) => {
    onSelectedConstructionForEmployeeChange(constructionId);
    setAddEmployeeDialogOpen(true);
  };

  const handleCopyDataDialogOpen = () => {
    setCopyDataDialogOpen(true);
  };

  const printContentRef = useRef<HTMLDivElement>(null);
  const isTableLoading = isCoping || isFilling || isLoading;
  const availableConstructions = getAvailableConstructions();

  const employeesCount = useMemo(() => {
    return constructionsWithWorkHours.reduce((acc, construction) => {
      return acc + construction.workHours.length;
    }, 0);
  }, [constructionsWithWorkHours]);

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
            printTitle={true}
            showVacation={true}
            constructionsWithWorkHours={dataSorted}
            weekDates={weekDates}
            totalHoursData={totalHoursData}
          />
        </Box>
      </Box>
      <HoursTableControls
        hasUnsavedChanges={hasUnsavedChanges}
        setToolbarHeight={setToolbarHeight}
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
        tableBorder={tableBorder}
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
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(2px)',
                  borderRadius: '8px',
                }}
              >
                <CircularProgress size={40} />
              </Box>
            )}
            <TableContainer
              className="border-lightGray rounded-lg border bg-white"
              sx={(theme) => ({
                position: 'relative',
                outline: editMode
                  ? `2px solid ${theme.palette.primary.main} !important`
                  : '',
                maxHeight: `calc(100vh - ${headerHeight + topBarHeight + toolbarHeight}px)`,
              })}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell
                      className="bg-gray-100"
                      sx={{
                        borderRight: tableBorder,
                        borderBottom: borderBold,
                      }}
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
                      className="bg-gray-100"
                      sx={{
                        borderRight: tableBorder,
                        borderBottom: borderBold,
                      }}
                      align="center"
                    >
                      <Typography
                        className="text-center font-semibold"
                        variant="body2"
                      >
                        Pracownik
                      </Typography>
                    </TableCell>
                    {weekDates.map((date, index) => (
                      <TableCell
                        className="bg-gray-100"
                        key={`${date.getTime()}-${index}`}
                        align="center"
                        sx={{
                          borderRight: tableBorder,
                          borderBottom: borderBold,
                        }}
                      >
                        <Typography
                          className="block text-center font-semibold"
                          variant="caption"
                        >
                          {date.toLocaleDateString('pl-PL', {
                            weekday: 'short',
                          })}
                        </Typography>
                        <Typography
                          className="text-center font-semibold"
                          variant="body2"
                        >
                          {date.getDate().toString().padStart(2, '0')}.
                          {(date.getMonth() + 1).toString().padStart(2, '0')}
                        </Typography>
                      </TableCell>
                    ))}
                    <TableCell
                      className="bg-gray-100"
                      align="center"
                      sx={{ borderBottom: borderBold }}
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
                    getAvailableEmployeesForConstruction={
                      getAvailableEmployeesForConstruction
                    }
                  />
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell
                      className="border-lightGray border-t border-b bg-white"
                      colSpan={9}
                      sx={{
                        position: 'sticky',
                        bottom: -1,
                        zIndex: 2,
                        p: 0,
                        pl: 1,
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={3}
                        alignItems="center"
                        justifyContent={'space-between'}
                      >
                        <Stack direction="row" alignItems="center" spacing={3}>
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
                                onClick={() =>
                                  setAddConstructionDialogOpen(true)
                                }
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
                                sx={{
                                  borderRight: '1px solid #ccc',
                                  height: '15px',
                                }}
                              />
                            }
                            sx={{ order: 3 }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 600, color: 'text.secondary' }}
                            >
                              Budowy: {constructionsWithWorkHours.length}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 600, color: 'text.secondary' }}
                            >
                              Pracownicy: {employeesCount}
                            </Typography>
                          </Stack>
                        </Stack>

                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 600, color: 'text.secondary' }}
                        >
                          Suma całkowita:
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell
                      align="center"
                      className="border-lightGray border-t bg-white"
                      sx={{
                        position: 'sticky',
                        bottom: -1,
                        p: 0,
                        zIndex: 2,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 600, color: 'text.secondary' }}
                      >
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
            handleAddConstruction={() => setAddConstructionDialogOpen(true)}
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

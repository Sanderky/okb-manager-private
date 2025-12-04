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
} from '@mui/material';
import {
  Add,
  AutoFixHigh,
  CancelPresentation,
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

const borderBold = '1px solid #333';
const numberCellMaxWidth = '20px';
const numberCellPadding = 0.5;
const redAlert = 'bg-red-300';
const orangeAlert = 'bg-amber-300';
const tableBorder = '1px solid rgb(224, 224, 224)';

interface EditableCellProps {
  value: number;
  onChange: (val: number) => void;
  max?: number;
  isHoliday?: boolean;
  isActive: boolean;
}

const EditableCell = React.memo(
  ({ value, onChange, max = 24, isHoliday, isActive }: EditableCellProps) => {
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
        onChange(numVal);
      }

      setLocalValue(numVal > 0 ? numVal.toString() : '');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        (e.target as HTMLElement).blur();
      }
    };

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
            cursor: isActive ? 'text' : 'default',
            backgroundColor: 'transparent',
            padding: 0,
          },
        }}
        sx={{
          fontSize: '0.875rem',
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          width: '100%',

          '& .MuiInputBase-input': {
            color: isActive ? 'black' : 'inherit',
            fontWeight: isActive ? 500 : 400,

            '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
              WebkitAppearance: 'none',
              margin: 0,
            },
            '&[type=number]': { MozAppearance: 'textfield' },
          },
        }}
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
  isLoading: boolean;
  error: Error | null;
  isFilling: boolean;
  handleFillWithSchedule: () => Promise<void>;
  handleCopyDataDialogOpen: () => void;
  getAvailableEmployeesForConstruction: (constructionId: string) => Employee[];
}

const TableRows = ({
  error,
  isLoading,
  constructionsWithWorkHours,
  editMode,
  handleDeleteConstruction,
  handleDeleteEmployee,
  handleHoursChange,
  handleOpenAddEmployeeDialog,
  isFilling,
  handleFillWithSchedule,
  handleCopyDataDialogOpen,
  getAvailableEmployeesForConstruction,
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
                  className={`${!construction.isActive && 'text-red-400'}`}
                  align="center"
                  sx={{
                    borderRight: tableBorder,
                    fontWeight: 'bold',
                    verticalAlign: 'middle',
                    borderBottom: borderBold,
                    '& span:hover': {
                      textDecoration: editMode ? 'underline' : 'none',
                    },
                  }}
                >
                  <span
                    onClick={() =>
                      editMode &&
                      handleDeleteConstruction(
                        construction.id,
                        construction.name
                      )
                    }
                    style={{ cursor: editMode ? 'pointer' : 'text' }}
                  >
                    {construction.name}
                  </span>
                </TableCell>
              )}

              <TableCell
                align="center"
                className={`${!workHour.isActive && 'text-red-400'}`}
                sx={{
                  verticalAlign: 'middle',
                  p: numberCellPadding,
                  position: 'relative',
                  fontWeight: 'bold',
                  borderRight: tableBorder,
                  borderBottom: tableBorder,
                  '& span:hover': {
                    textDecoration: editMode ? 'underline' : 'none',
                  },
                }}
              >
                <span
                  onClick={() =>
                    editMode &&
                    handleDeleteEmployee(
                      workHour.id,
                      workHour.employeeName,
                      construction.name
                    )
                  }
                  style={{ cursor: editMode ? 'pointer' : 'text' }}
                >
                  {workHour.employeeName}
                </span>
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
                      p: 0.5,
                      borderRight: tableBorder,
                      height: '33px',
                    }} // p:0.5 pasuje do inputa
                  >
                    <EditableCell
                      value={hour}
                      isHoliday={isVacation}
                      isActive={editMode} // <--- Kluczowa zmiana: sterujemy tylko tym propsem
                      onChange={(newVal) =>
                        handleHoursChange(workHour.id, dayIndex, newVal)
                      }
                    />
                  </TableCell>
                );
              })}

              <TableCell
                align="center"
                sx={{
                  fontWeight: 'bold',
                  width: numberCellMaxWidth,
                  minWidth: '20px',
                  p: numberCellPadding,
                  borderBottom: tableBorder,
                }}
              >
                {formatToPolishDecimal(workHour.total)}
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
              {editMode && (
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
                      onClick={() =>
                        handleOpenAddEmployeeDialog(construction.id)
                      }
                      size="small"
                    >
                      Dodaj pracowników
                    </Button>
                  </span>
                </Tooltip>
              )}
            </TableCell>
            <TableCell
              align="center"
              className="bg-blue-200"
              sx={{ borderBottom: borderBold, p: 0.5, fontWeight: 'bold' }}
            >
              {formatToPolishDecimal(construction.totalHours)}
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
              Brak danych dla tego tygodnia
            </Typography>
            {editMode && (
              <>
                <Button
                  onClick={handleFillWithSchedule}
                  loading={isFilling}
                  variant="outlined"
                  startIcon={<AutoFixHigh />}
                  sx={{ mt: 2 }}
                >
                  Uzupełnij proponowane
                </Button>
                <Button
                  onClick={handleCopyDataDialogOpen}
                  loading={isFilling}
                  variant="outlined"
                  startIcon={<ContentCopy />}
                  sx={{ mt: 2 }}
                >
                  Kopiuj dane z innego tygodnia
                </Button>
              </>
            )}
          </Box>
        </TableCell>
      </TableRow>
    );
};

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
  const isTableLoading = isCoping || isFilling || isLoading || isSaving;
  const availableConstructions = getAvailableConstructions();

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
        containerWidth={containerWidth}
        isLoading={isTableLoading}
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
        selectedConstructions={selectedConstructions}
        onSelectedConstructionsChange={onSelectedConstructionsChange}
        handleCancelEdit={handleCancelEdit}
        handleFillWithSchedule={handleFillWithSchedule}
        onSelectedEmployeesChange={onSelectedEmployeesChange}
        selectedEmployees={selectedEmployees}
      />
      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        {!loadingError &&
        !isTableLoading &&
        constructionsWithWorkHours.length > 0 ? (
          <>
            <TableContainer
              className="border-lightGray rounded-lg border bg-white"
              sx={(theme) => ({
                position: 'relative',
                '& th': { backgroundColor: 'oklch(0.967 0.003 264.542)' },
                outline: editMode
                  ? `2px solid ${theme.palette.primary.main} !important`
                  : '',
                maxHeight: '600px',
              })}
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
                      align="center"
                    >
                      Budowa
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        borderRight: tableBorder,
                        borderBottom: borderBold,
                      }}
                      align="center"
                    >
                      Pracownik
                    </TableCell>
                    {weekDates.map((date, index) => (
                      <TableCell
                        key={`${date.getTime()}-${index}`}
                        align="center"
                        sx={{
                          fontWeight: 'bold',
                          borderRight: tableBorder,
                          borderBottom: borderBold,
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {date.toLocaleDateString('pl-PL', {
                            weekday: 'short',
                          })}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {date.getDate().toString().padStart(2, '0')}.
                          {(date.getMonth() + 1).toString().padStart(2, '0')}
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
                    isFilling={isFilling}
                    handleFillWithSchedule={handleFillWithSchedule}
                    isLoading={isTableLoading}
                    handleDeleteConstruction={handleDeleteConstruction}
                    handleDeleteEmployee={handleDeleteEmployee}
                    handleHoursChange={handleHoursChange}
                    handleOpenAddEmployeeDialog={handleOpenAddEmployeeDialog}
                    constructionsWithWorkHours={dataSorted}
                    editMode={editMode}
                    error={loadingError}
                    handleCopyDataDialogOpen={handleCopyDataDialogOpen}
                    getAvailableEmployeesForConstruction={
                      getAvailableEmployeesForConstruction
                    }
                  />
                </TableBody>
              </Table>
            </TableContainer>
            <Stack direction={'row'}>
              {editMode && (
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
                      sx={{
                        visibility: editMode ? 'visible' : 'hidden',
                      }}
                      onClick={() => setAddConstructionDialogOpen(true)}
                      size="small"
                      variant="text"
                      color="primary"
                      disabled={availableConstructions.length === 0}
                    >
                      Dodaj budowę
                    </Button>
                  </span>
                </Tooltip>
              )}

              <Typography>
                {`Suma całkowita: ${
                  constructionsWithWorkHours.length > 0
                    ? formatToPolishDecimal(totalHoursData.grandTotal)
                    : '-'
                }`}
              </Typography>
            </Stack>
            {hasUnsavedChanges && (
              <Typography
                variant="caption"
                sx={{ fontWeight: 500 }}
                color="primary"
              >
                Masz niezapisane zmiany*
              </Typography>
            )}
          </>
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
    </Box>
  );
};

export default HoursTable;

import React, { useState, useRef, useEffect } from 'react';
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
  CircularProgress,
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  Add,
  AutoFixHigh,
  CancelPresentation,
  ContentCopy,
  ReportProblem,
} from '@mui/icons-material';
import type { Employee } from '../../../types';
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
import { formatToPolishDecimal } from './HoursHelpers';
import type { TableData } from './Hours';

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

const borderBold = '1px solid #333';
const numberCellMaxWidth = '20px';
const numberCellPadding = 0.5;
const redAlert = 'bg-red-300';
const orangeAlert = 'bg-amber-300';
const sumColor = 'oklch(0.707 0.165 254.624)';
const tableBorder = '1px solid rgb(224, 224, 224)';

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
                    style={{
                      cursor: editMode ? 'pointer' : 'text',
                      fontStyle: construction.isActive ? 'normal' : 'italic',
                    }}
                  >
                    {construction.isActive
                      ? construction.name
                      : `${construction.name} *`}
                  </span>
                </TableCell>
              )}

              <TableCell
                align="center"
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
                  style={{
                    cursor: editMode ? 'pointer' : 'text',
                    fontStyle: workHour.isActive ? 'normal' : 'italic',
                  }}
                >
                  {workHour.isActive
                    ? workHour.employeeName
                    : `${workHour.employeeName} *`}
                </span>
              </TableCell>

              {workHour.hours.map((hour, dayIndex) => {
                const isVacation = workHour.isOnVacation[dayIndex];
                return (
                  <TableCell
                    key={dayIndex}
                    align="center"
                    className={
                      hour > 24 ? redAlert : hour > 10 ? orangeAlert : ''
                    }
                    sx={{
                      borderBottom: tableBorder,
                      p: numberCellPadding,
                      borderRight: tableBorder,
                    }}
                  >
                    {isVacation ? (
                      <Typography
                        className="font-medium text-amber-700"
                        variant="body2"
                      >
                        Urlop
                      </Typography>
                    ) : editMode ? (
                      <TextField
                        type="number"
                        value={hour}
                        onFocus={(e) => {
                          e.target.select();
                        }}
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
                            '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button':
                              {
                                WebkitAppearance: 'none',
                                margin: 0,
                              },
                            '&[type=number]': {
                              MozAppearance: 'textfield',
                            },
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
                      <Typography>{formatToPolishDecimal(hour)}</Typography>
                    )}
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
                      Dodaj pracownika
                    </Button>
                  </span>
                </Tooltip>
              )}
            </TableCell>
            <TableCell
              align="center"
              sx={{
                color: '#fff',
                borderBottom: borderBold,
                p: 0.5,
                fontWeight: 'bold',
                backgroundColor: sumColor,
              }}
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
              Brak danych dla danego tygodnia
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

interface HoursTableProps {
  readOnly?: boolean;
  onTableDelete?: () => void;
  onTableDataUpdate?: (data: TableData) => void;
  tableId?: string;
}

const HoursTable = ({
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
    handleEmployeeAdded,
    handleConstructionWithEmployeeAdded,
    handleHoursChange,
    totalHoursData,
    selectedConstructionForEmployee,
    loadingError,
    isCoping,
    employees,
    constructions,
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
  }, [currentWeek, constructionsWithWorkHours, isLoading, loadingError]);

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

  const activeEmployees = employees?.filter((e) => e.status) ?? [];

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
            constructionsWithWorkHours={constructionsWithWorkHours}
            weekDates={weekDates}
            totalHoursData={totalHoursData}
          />
        </Box>
      </Box>

      <HoursTableControls
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
        <TableContainer
          className="border-lightGray rounded-lg border bg-white"
          sx={{
            position: 'relative',
            '& th': {
              backgroundColor: 'oklch(0.967 0.003 264.542)',
            },
          }}
        >
          <Table size="small">
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
                constructionsWithWorkHours={constructionsWithWorkHours}
                editMode={editMode}
                error={loadingError}
                handleCopyDataDialogOpen={handleCopyDataDialogOpen}
                getAvailableEmployeesForConstruction={
                  getAvailableEmployeesForConstruction
                }
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
                          sx={{ visibility: editMode ? 'visible' : 'hidden' }}
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
                    ? formatToPolishDecimal(totalHoursData.grandTotal)
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
        activeEmployees={activeEmployees}
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
        constructionId={selectedConstructionForEmployee}
        currentWeek={currentWeek}
        onEmployeeAdded={handleEmployeeAdded}
        constructions={constructions ?? []}
        availableEmployees={getAvailableEmployeesForConstruction(
          selectedConstructionForEmployee
        )}
      />
    </Box>
  );
};

export default HoursTable;

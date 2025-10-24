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
  IconButton,
} from '@mui/material';
import {
  Add,
  AutoFixHigh,
  CancelPresentation,
  Delete,
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
import useHoursTable from './useHoursTable';
import HoursTableControls from './HoursTableControls';
import { PrintableTable } from './PrintReport';
import { formatToPolishDecimal } from './HoursHelpers';
import type { TableData } from './Hours';

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

const borderBold = '2px solid #333';
const numberCellMaxWidth = '20px';
const numberCellPadding = 0.5;
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
  isFilling: boolean;
  handleFillWithSchedule: () => Promise<void>;
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
  isFilling,
  handleFillWithSchedule,
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
                  align="center"
                  sx={{
                    borderRight: tableBorder,
                    fontWeight: 'bold',
                    verticalAlign: 'top',
                    borderBottom: borderBold,
                    background: '#fff',
                    '& .MuiIconButton-root': {
                      opacity: 0,
                      transition: 'opacity 0.3s ease-in-out',
                    },
                    '&:hover .MuiIconButton-root': {
                      opacity: 1,
                    },
                  }}
                >
                  {construction.name}
                  {editMode && (
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteConstruction(construction.id)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              )}

              <TableCell
                align="center"
                sx={{
                  p: numberCellPadding,
                  fontWeight: 'bold',
                  borderRight: tableBorder,
                  borderBottom: tableBorder,
                  '& .MuiIconButton-root': {
                    opacity: 0,
                    transition: 'opacity 0.3s ease-in-out',
                  },
                  '&:hover .MuiIconButton-root': {
                    opacity: 1,
                  },
                }}
              >
                {workHour.employeeName}
                {editMode && (
                  <IconButton
                    size="small"
                    sx={{ visibility: editMode ? 'visible' : 'hidden' }}
                    onClick={() => handleDeleteEmployee(workHour.id)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                )}
              </TableCell>

              {workHour.hours.map((hour, dayIndex) => {
                const isVacation = workHour.isOnVacation[dayIndex];
                return (
                  <TableCell
                    key={dayIndex}
                    align="center"
                    sx={{
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
                        // onBlur={(e) => {
                        //   handleHoursChange(
                        //     workHour.id,
                        //     dayIndex,
                        //     parseFloat(e.target.value) || 0
                        //   )
                        // }}
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
                  <Button
                    startIcon={<Add />}
                    disabled={availableEmployees.length === 0}
                    onClick={() => handleOpenAddEmployeeDialog(construction.id)}
                    size="small"
                  >
                    Dodaj pracownika
                  </Button>
                </Tooltip>
              )}
            </TableCell>
            <TableCell
              align="center"
              sx={{
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
              <Button
                onClick={handleFillWithSchedule}
                loading={isFilling}
                variant="outlined"
                startIcon={<AutoFixHigh />}
                sx={{ mt: 2 }}
              >
                Uzupełnij proponowane
              </Button>
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
    getExistingEmployeeIdsForConstruction,
    existingConstructionIds,
    selectedConstructionForEmployee,
    loadingError,
    isCoping,
    employees,
    constructions,
    constructionsWithWorkHours,
    onSelectedConstructionForEmployeeChange,
    selectedConstructions,
    onSelectedConstructionsChange,
    availableConstructions,
    handleDeselectAll,
    handleSelectAll,
    isFilling,
    handleFillWithSchedule,
  } = useHoursTable();

  useEffect(() => {
    if (onTableDataUpdate && !isLoading && !loadingError) {
      onTableDataUpdate({
        weekStart: currentWeek,
        constructionsWithWorkHours,
        weekDates,
        totalHoursData,
        selectedConstructions,
        availableConstructions: availableConstructions || [],
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

  return (
    <Box>
      <Box sx={{ display: 'none' }}>
        <PrintableTable
          printTitle={true}
          showVacation={true}
          ref={printContentRef}
          constructionsWithWorkHours={constructionsWithWorkHours}
          weekDates={weekDates}
          totalHoursData={totalHoursData}
        />
      </Box>

      <HoursTableControls
        isLoading={isLoading}
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
        availableConstructions={availableConstructions ?? []}
        selectedConstructions={selectedConstructions}
        onSelectedConstructionsChange={onSelectedConstructionsChange}
        allConstructions={constructions ?? []}
        handleDeselectAll={handleDeselectAll}
        handleSelectAll={handleSelectAll}
      />

      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <TableContainer className="border-lightGray rounded-lg border bg-white">
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
                  {editMode && (
                    <Tooltip
                      title={
                        existingConstructionIds.length ===
                        (constructions?.length || 0)
                          ? 'Wszystkie budowy zostały już dodane'
                          : ''
                      }
                    >
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
    </Box>
  );
};

export default HoursTable;

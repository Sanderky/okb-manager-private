import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Table,
  TableContainer,
  Box,
  CircularProgress,
  Collapse,
} from '@mui/material';
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
import HoursTableControls from './hours-table-components/HoursTableControls';
import { PrintableTable } from './PrintReport';
import type { TableData } from '../model/types';
import { useHoursTable } from '../model/useHoursTable';
import { NoTable } from './hours-table-components/NoTable';
import { WorkLogsTableContent } from './hours-table-components/WorkLogsTableContent';
import { WorkLogsTableFooter } from './hours-table-components/WorkLogsTableFooter';
import { WorkLogsTableHeader } from './hours-table-components/WorkLogsTableHeader';
import { sortConstructionsWithWorkHours } from '../model/hoursTableUtils';

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

interface HoursTableProps {
  containerWidth: number;
  readOnly?: boolean;
  onTableDelete?: () => void;
  onTableDataUpdate?: (data: TableData) => void;
  tableId?: string;
}

export const HoursTable = ({
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

  const tableDataPayload = useMemo<TableData>(
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

  const printContentRef = useRef<HTMLDivElement>(null);
  const isTableLoading = isCoping || isFilling || isLoading;
  const availableConstructions = getAvailableConstructions();
  const isEmpty = constructionsWithWorkHours.length == 0;

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
            showVacation={true}
            constructionsWithWorkHours={dataSorted}
            weekDates={weekDates}
            totalHoursData={totalHoursData}
          />
        </Box>
      </Box>
      <HoursTableControls
        isEmpty={isEmpty}
        hasUnsavedChanges={hasUnsavedChanges}
        containerWidth={containerWidth}
        isLoading={isTableLoading || isSaving}
        currentWeek={currentWeek}
        handleWeekChange={handleWeekChange}
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
        {!loadingError && !isTableLoading && !isEmpty ? (
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
                maxHeight: `calc(100vh - 162px)`,
                // maxHeight: `500px`,
              })}
            >
              <Table size="small" stickyHeader>
                <WorkLogsTableHeader weekDates={weekDates} />
                <WorkLogsTableContent
                  handleDeleteConstruction={handleDeleteConstruction}
                  handleDeleteEmployee={handleDeleteEmployee}
                  handleHoursChange={handleHoursChange}
                  handleOpenAddEmployeeDialog={handleOpenAddEmployeeDialog}
                  constructionsWithWorkHours={dataSorted}
                  editMode={editMode}
                  activeEmployees={activeEmployees}
                />
                <WorkLogsTableFooter
                  availableConstructions={availableConstructions}
                  editMode={editMode}
                  totalHoursData={totalHoursData}
                  employeesCount={employeesCount}
                  onAddConstruction={handleAddConstructionClick}
                  hasUnsavedChanges={hasUnsavedChanges}
                  constructionsWithWorkHours={constructionsWithWorkHours}
                />
              </Table>
            </TableContainer>
          </Box>
        ) : (
          <NoTable
            isFilling={isFilling}
            handleFillWithSchedule={handleFillWithSchedule}
            isLoading={isTableLoading}
            isReadOnly={readOnly}
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

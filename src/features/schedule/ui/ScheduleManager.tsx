import React, { useCallback, useState } from 'react';
import {
  Box,
  Alert,
  CircularProgress,
  Menu,
  Autocomplete,
  TextField,
  useTheme,
} from '@mui/material';
import { FilterDialog } from './components/ScheduleDialogs';
import { PrintableSchedule } from './components/SchedulePrint';
import { TableControls } from './components/ScheduleTableControls';
import type { ICell } from '../model/types';
import { useScheduleManager } from '../model/services/useScheduleManager';

import dayjs from 'dayjs';
import 'dayjs/locale/pl';
import { type Construction } from '@/entities/construction';
import { useNavigate } from 'react-router-dom';
import useContainerBreakpoint from '@/shared/lib/useContainerWidth';
import { ScheduleManagerMultiWeekView } from './components/ScheduleManagerMultiWeekView';
import { ScheduleManagerWeekView } from './components/ScheduleManagerWeekView';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(weekOfYear);
dayjs.extend(isBetween);

export const ScheduleManager = () => {
  const theme = useTheme();
  const [containerRef, width] = useContainerBreakpoint();

  const navigate = useNavigate();
  const {
    fromWeek,
    setFromWeek,
    toWeek,
    setToWeek,
    selectedEmployees,
    setSelectedEmployees,
    showInactive,
    setShowInactive,
    selectedConstructions,
    setSelectedConstructions,
    showInactiveConstructions,
    setShowInactiveConstructions,
    activeTable,
    setActiveTable,
    showVacations,
    setShowVacations,
    showDates,
    setShowDates,
    loadingCells,
    weeks,
    constructions,
    filteredEmployees,
    isEmployeeOnVacation,
    scheduleMap,
    handleCellChange,
    getCellKey,
    isLoading,
    isError,
    employees,
    getCellContentItems,
    printRef,
  } = useScheduleManager();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [cellAnchorEl, setCellAnchorEl] = useState<null | HTMLElement>(null);
  const [activeCell, setActiveCell] = useState<ICell | null>(null);

  const handleShowInputConstruction = useCallback(
    (event: React.MouseEvent<HTMLElement>, cell: ICell) => {
      event.stopPropagation();
      const hasVacation = isEmployeeOnVacation(cell.empId, cell.date.toDate());
      if (!cell.isWeek && hasVacation) return;

      const target = event.currentTarget as HTMLElement;
      const row = target.closest('tr');
      if (row) {
        row.style.backgroundColor = theme.palette.schedule.hoverRow;
        (
          row.querySelector('td:first-child') as HTMLElement
        ).style.backgroundColor = theme.palette.schedule.hoverRow;
      }
      target.style.backgroundColor = theme.palette.schedule.hoverCell;

      setCellAnchorEl(target);
      setActiveCell(cell);
    },
    [isEmployeeOnVacation, theme]
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

  const handleOnEmployeeClick = useCallback(
    (id: string) => {
      navigate('/employees/' + id);
    },
    [navigate]
  );

  if (isError) return <Alert severity="error">Błąd danych.</Alert>;

  return (
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
      {isLoading && (
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
          <ScheduleManagerMultiWeekView
            weeks={weeks}
            filteredEmployees={filteredEmployees}
            activeTable={activeTable}
            setActiveTable={setActiveTable}
            loadingCells={loadingCells}
            isLoading={isLoading}
            handleShowInputConstruction={handleShowInputConstruction}
            getCellContentItems={getCellContentItems}
            getCellKey={getCellKey}
            handleOnEmployeeClick={handleOnEmployeeClick}
          />
        ) : (
          <ScheduleManagerWeekView
            weeks={weeks}
            filteredEmployees={filteredEmployees}
            activeTable={activeTable}
            setActiveTable={setActiveTable}
            loadingCells={loadingCells}
            isLoading={isLoading}
            handleShowInputConstruction={handleShowInputConstruction}
            getCellContentItems={getCellContentItems}
            getCellKey={getCellKey}
            handleOnEmployeeClick={handleOnEmployeeClick}
          />
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
            getCellContentItems={getCellContentItems}
          />
        </div>
      </div>
    </Box>
  );
};

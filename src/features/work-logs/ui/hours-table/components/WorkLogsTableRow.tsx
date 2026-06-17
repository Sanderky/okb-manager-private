import React, { useMemo } from 'react';
import {
  TableCell,
  TableRow,
  Button,
  Typography,
  Tooltip,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import 'dayjs/locale/pl';
import type { Employee } from '@/entities/employee';
import type { ConstructionsWithWorkHours } from '../../../model/types';
import { EditableCell } from './EditableCell';
import { areConstructionsEqual } from '../../helpers/areConstructionsEqual';
import { formatToPolishDecimal } from '@/shared/lib/format';

const numberCellMaxWidth = '20px';
const numberCellPadding = 0.5;

interface ConstructionRowProps {
  construction: ConstructionsWithWorkHours;
  startRowIndex: number;
  editMode: boolean;
  activeEmployees: Employee[];
  handleDeleteConstruction: (id: string, name: string) => void;
  handleDeleteEmployee: (id: string, empName: string, consName: string) => void;
  handleHoursChange: (
    id: string,
    dayIdx: number,
    val: number | string | null
  ) => void;
  handleOpenAddEmployeeDialog: (id: string) => void;
}

export const WorkLogsTableRow = React.memo(
  ({
    construction,
    editMode,
    activeEmployees,
    handleDeleteConstruction,
    startRowIndex,
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
          <TableRow
            key={workHour.id}
            sx={(theme) => ({
              transition: 'background-color 0.2s',
              '&:hover': {
                background: theme.palette.tableHover,
              },
            })}
          >
            {employeeIndex === 0 && (
              <TableCell
                rowSpan={construction.workHours.length + 1}
                align="center"
                sx={(theme) => ({
                  borderRight: `1px solid ${theme.palette.divider}`,
                  fontWeight: 'bold',
                  verticalAlign: 'middle',
                  borderBottom: theme.hoursTable.borderBold,
                  backgroundColor: theme.palette.background.paper,
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
              const currentRowIndex = startRowIndex + employeeIndex;
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
                      (hour ?? 0) > 24
                        ? theme.palette.hours.error
                        : (hour ?? 0) > 10
                          ? theme.palette.hours.warning
                          : '',
                  })}
                >
                  <EditableCell
                    value={hour}
                    id={workHour.id}
                    dayIndex={dayIndex}
                    rowIndex={currentRowIndex}
                    colIndex={dayIndex}
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

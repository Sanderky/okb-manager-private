import React from 'react';
import { TableRow, TableCell, Typography, Tooltip } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import type { Employee, Vacation } from '../../../types';
import type { ICell } from './ScheduleHelpers';

interface EmployeeRowProps {
  employee: Employee;
  weeks: Dayjs[];
  onCellClick: (e: React.MouseEvent<HTMLElement>, cell: ICell) => void;
  cellText: (cell: ICell) => React.ReactNode;
  activeTable: { type: number; week: Dayjs };
  vacations?: Vacation[];
}

interface ScheduleCellProps {
  cell: ICell;
  index: number;
  onClick: (e: React.MouseEvent<HTMLElement>, cell: ICell) => void;
  cellText: (cell: ICell) => React.ReactNode;
  hasVacation?: boolean;
}

// Komponent ScheduleCell
const ScheduleCell: React.FC<ScheduleCellProps> = React.memo(
  ({ cell, index, onClick, cellText, hasVacation = false }) => (
    <TableCell
      sx={{
        '&:hover': {
          background: hasVacation ? '#fff3cd' : 'ghostwhite',
        },
        backgroundColor: hasVacation ? '#fff3cd' : 'white',
        transition: '0.3s',
        cursor: hasVacation ? 'not-allowed' : 'pointer',
        borderBottom: '1px solid #6B7280',
        borderLeft: '1px solid #6B7280',
        padding: '6px 12px',
        textAlign: 'center',
        display: {
          xs: index === 0 ? 'table-cell' : 'none',
          sm: 'table-cell',
        },
        opacity: hasVacation ? 0.8 : 1,
      }}
      onClick={(e) => {
        if (hasVacation) return;
        onClick(e, cell);
        const target = e.currentTarget as HTMLElement;
        target.style.backgroundColor = '#ffd85f80';
      }}
    >
      {cellText(cell)}
    </TableCell>
  )
);

// Główny komponent EmployeeRow
export const EmployeeRow: React.FC<EmployeeRowProps> = React.memo(
  ({ employee, weeks, onCellClick, cellText, activeTable, vacations = [] }) => {
    // Funkcja pomocnicza do sprawdzania urlopu
    const hasVacation = (date: Dayjs, empId: string) => {
      return vacations.some(
        (v) =>
          v.employeeId === empId && date.isSame(dayjs(v.date.toDate()), 'day')
      );
    };

    if (activeTable.type === 1) {
      return (
        <TableRow
          sx={{
            '&:last-child td, &:last-child th': { borderBottom: 0 },
          }}
        >
          <TableCell
            sx={{
              position: 'sticky',
              left: 0,
              zIndex: 3,
              backgroundColor: '#f3f4f6',
              borderBottom: '1px solid #6B7280',
              padding: '6px 12px',
              textAlign: 'center',
            }}
          >
            <Tooltip
              arrow
              placement="top"
              title={employee.name}
              slotProps={{
                popper: {
                  modifiers: [
                    {
                      name: 'offset',
                      options: {
                        offset: [0, -5],
                      },
                    },
                  ],
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: {
                    xs: '0.75rem',
                    md: '0.85rem',
                  },
                  fontWeight: 600,
                }}
                noWrap
              >
                {employee.name}
              </Typography>
            </Tooltip>
          </TableCell>

          {Array.from({ length: 7 }).map((_, i) => {
            const day = activeTable.week.add(i, 'day');
            const cell: ICell = {
              empId: employee.id,
              weekKey: activeTable.week.format('YYYY-MM-DD'),
              date: day,
              isWeek: false,
            };

            const isVacationDay = hasVacation(day, employee.id);

            return (
              <ScheduleCell
                key={i}
                index={i}
                cell={cell}
                onClick={onCellClick}
                cellText={cellText}
                hasVacation={isVacationDay}
              />
            );
          })}
        </TableRow>
      );
    }

    return (
      <TableRow
        sx={{
          '&:last-child td, &:last-child th': { borderBottom: 0 },
        }}
      >
        <TableCell
          sx={{
            position: 'sticky',
            left: 0,
            zIndex: 3,
            backgroundColor: '#f3f4f6',
            borderBottom: '1px solid #6B7280',
            padding: '6px 12px',
            textAlign: 'center',
          }}
        >
          <Typography noWrap sx={{ fontWeight: 600 }} variant="body2">
            {employee.name}
          </Typography>
        </TableCell>

        {weeks.map((week, i) => {
          const cell: ICell = {
            empId: employee.id,
            weekKey: week.format('YYYY-MM-DD'),
            date: week,
            isWeek: true,
          };

          // Sprawdź czy w którymkolwiek dniu tygodnia jest urlop
          const hasVacationInWeek = Array.from({ length: 7 }).some(
            (_, dayIndex) => {
              const day = week.add(dayIndex, 'day');
              return hasVacation(day, employee.id);
            }
          );

          return (
            <ScheduleCell
              key={week.format('YYYY-MM-DD')}
              index={i}
              cell={cell}
              onClick={onCellClick}
              cellText={cellText}
              hasVacation={hasVacationInWeek}
            />
          );
        })}
      </TableRow>
    );
  }
);

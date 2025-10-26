import React from 'react';
import {
  TableRow,
  TableCell,
  Typography,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Dayjs } from 'dayjs';
import type { Employee } from '../../../types';
import type { ICell } from './ScheduleHelpers';

interface EmployeeRowProps {
  employee: Employee;
  weeks: Dayjs[];
  onCellClick: (e: React.MouseEvent<HTMLElement>, cell: ICell) => void;
  cellText: (cell: ICell) => React.ReactNode;
  activeTable: { type: number; week: Dayjs };
}

interface ScheduleCellProps {
  cell: ICell;
  onClick: (e: React.MouseEvent<HTMLElement>, cell: ICell) => void;
  cellText: (cell: ICell) => React.ReactNode;
  hasVacation?: boolean;
}

// Komponent ScheduleCell
const ScheduleCell: React.FC<ScheduleCellProps> = React.memo(
  ({ cell, onClick, cellText }) => (
    <TableCell
      sx={{
        '&:hover': {
          background: 'ghostwhite',
        },
        cursor: 'pointer',
        transition: '0.3s',
        borderBottom: '1px solid #6B7280',
        borderLeft: '1px solid #6B7280',
        padding: '6px 12px',
        textAlign: 'center',
        // display: {
        //   xs: index === 0 ? 'table-cell' : 'none',
        //   sm: 'table-cell',
        // },
      }}
      onClick={(e) => {
        // if (hasVacation) {
        //   e.stopPropagation();
        //   return;
        // }
        onClick(e, cell);
      }}
    >
      {cellText(cell)}
    </TableCell>
  )
);

// Główny komponent EmployeeRow
export const EmployeeRow: React.FC<EmployeeRowProps> = React.memo(
  ({ employee, weeks, onCellClick, cellText, activeTable }) => {
    // Funkcja pomocnicza do sprawdzania urlopu

    const theme = useTheme();
    const isXs = useMediaQuery(theme.breakpoints.only('xs'));

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

            return (
              <ScheduleCell
                key={i}
                cell={cell}
                onClick={onCellClick}
                cellText={cellText}
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

          if (isXs && i > 0) {
            return;
          }

          return (
            <ScheduleCell
              key={week.format('YYYY-MM-DD')}
              cell={cell}
              onClick={onCellClick}
              cellText={cellText}
            />
          );
        })}
      </TableRow>
    );
  }
);

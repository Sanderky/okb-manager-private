import React from 'react';
import {
  TableRow,
  TableCell,
  Typography,
  Tooltip,
  CircularProgress,
  Stack,
  Chip,
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
  loadingCells: Set<string>;
  getCellKey: (cell: ICell) => string;
  index: number;
}

interface ScheduleCellProps {
  cell: ICell;
  onClick: (e: React.MouseEvent<HTMLElement>, cell: ICell) => void;
  cellText: (cell: ICell) => React.ReactNode;
  loadingCells: Set<string>;
  getCellKey: (cell: ICell) => string;
  employee: Employee;
}

const ScheduleCell: React.FC<ScheduleCellProps> = React.memo(
  ({ cell, onClick, cellText, loadingCells, getCellKey, employee }) => {
    const cellKey = getCellKey(cell);
    const isLoading = loadingCells.has(cellKey);

    return (
      <TableCell
        sx={(theme) => ({
          cursor: isLoading || !employee.status ? 'default' : 'pointer',
          transition: '0.3s',
          textAlign: 'center',
          position: 'relative',
          color: employee.status ? 'inherit' : theme.palette.text.disabled,
          borderLeft: `1px solid ${theme.palette.divider}`,
          '&:hover': {
            background: employee.status
              ? theme.palette.schedule.hoverCell
              : theme.palette.background.default,
          },
        })}
        className={`px-3 py-2`}
        onClick={(e) => {
          if (isLoading || !employee.status) {
            e.stopPropagation();
            return;
          }
          onClick(e, cell);
        }}
      >
        {isLoading ? <CircularProgress size={16} /> : cellText(cell)}
      </TableCell>
    );
  }
);

export const EmployeeRow: React.FC<EmployeeRowProps> = React.memo(
  ({
    employee,
    weeks,
    onCellClick,
    cellText,
    activeTable,
    loadingCells,
    getCellKey,
    index,
  }) => {
    // const theme = useTheme();
    // const isXs = useMediaQuery(theme.breakpoints.only('xs'));

    if (activeTable.type === 1) {
      return (
        <TableRow
          sx={(theme) => ({
            '&:hover': {
              '& .MuiTableCell-root:first-of-type': {
                backgroundColor: `${employee.status && `${theme.palette.schedule.hoverRow} !important`}`,
              },
              background: employee.status
                ? theme.palette.schedule.hoverRow
                : theme.palette.background.default,
            },
            background: employee.status
              ? theme.palette.background.paper
              : theme.palette.background.default,
          })}
        >
          <TableCell
            sx={(theme) => ({
              position: 'sticky',
              left: 0,
              zIndex: 3,
              textAlign: 'center',
              background: theme.palette.background.default,
            })}
            className="px-3 py-2"
          >
            <Stack direction={'row'} alignItems={'center'}>
              <Chip
                label={index + 1}
                variant="outlined"
                size="small"
                sx={{ mr: 1 }}
              />
              {/* <Typography
                sx={{
                  fontSize: {
                    xs: '0.75rem',
                    md: '0.85rem',
                  },
                }}
                className={`${!employee.status && 'text-red-400'}`}
              >
                {index + 1}.
              </Typography> */}
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
                    flexGrow: 1,
                    textDecoration: employee.status ? 'none' : 'line-through',
                    color: employee.status ? 'inherit' : 'text.disabled',
                  }}
                >
                  {employee.name}
                </Typography>
              </Tooltip>
            </Stack>
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
                loadingCells={loadingCells}
                getCellKey={getCellKey}
                employee={employee}
              />
            );
          })}
        </TableRow>
      );
    }

    return (
      <TableRow
        sx={(theme) => ({
          '&:hover': {
            '& .MuiTableCell-root:first-of-type': {
              backgroundColor: `${employee.status && `${theme.palette.schedule.hoverRow} !important`}`,
            },
            background: employee.status
              ? theme.palette.schedule.hoverRow
              : theme.palette.background.default,
          },
          background: employee.status
            ? theme.palette.background.paper
            : theme.palette.background.default,
        })}
      >
        <TableCell
          sx={(theme) => ({
            position: 'sticky',
            left: 0,
            zIndex: 3,
            textAlign: 'center',
            background: theme.palette.background.default,
          })}
          className="px-3 py-2"
        >
          <Stack direction={'row'} alignItems={'center'}>
            <Chip
              label={index + 1}
              variant="outlined"
              size="small"
              sx={{ mr: 1 }}
            />
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
                  flexGrow: 1,
                  fontSize: {
                    xs: '0.75rem',
                    md: '0.85rem',
                  },
                  fontWeight: 600,
                  textDecoration: employee.status ? 'none' : 'line-through',
                  color: employee.status ? 'inherit' : 'text.disabled',
                }}
              >
                {employee.name}
              </Typography>
            </Tooltip>
          </Stack>
        </TableCell>

        {weeks.map((week) => {
          const cell: ICell = {
            empId: employee.id,
            weekKey: week.format('YYYY-MM-DD'),
            date: week,
            isWeek: true,
          };

          // if (isXs && i > 0) {
          //   return null;
          // }

          return (
            <ScheduleCell
              key={week.format('YYYY-MM-DD')}
              cell={cell}
              onClick={onCellClick}
              cellText={cellText}
              loadingCells={loadingCells}
              getCellKey={getCellKey}
              employee={employee}
            />
          );
        })}
      </TableRow>
    );
  }
);

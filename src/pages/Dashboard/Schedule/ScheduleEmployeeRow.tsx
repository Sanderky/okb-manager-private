import React from 'react';
import {
  TableRow,
  TableCell,
  Typography,
  Tooltip,
  CircularProgress,
  Stack,
  Box,
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
        sx={{
          cursor: isLoading ? 'default' : 'pointer',
          transition: '0.3s',
          textAlign: 'center',
          position: 'relative',
        }}
        className={`border-l border-l-gray-200 px-3 py-2 hover:bg-blue-100 ${!employee.status && 'bg-gray-100 *:!text-gray-500 hover:bg-gray-100'}`}
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
          className="hover:bg-blue-50"
          sx={{
            '&:hover': {
              '& .MuiTableCell-root:first-of-type': {
                backgroundColor: `${employee.status && '#eff6ff !important'}`,
              },
            },
          }}
        >
          <TableCell
            sx={{
              position: 'sticky',
              left: 0,
              zIndex: 3,
              textAlign: 'center',
            }}
            className="bg-gray-100 px-3 py-2"
          >
            <Stack direction={'row'} alignItems={'center'}>
              <Typography
                sx={{
                  fontSize: {
                    xs: '0.75rem',
                    md: '0.85rem',
                  },
                }}
                className={`${!employee.status && 'text-red-400'}`}
              >
                {index + 1}.
              </Typography>
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
                  }}
                  className={`${!employee.status && 'text-red-400'}`}
                  noWrap
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
        className="hover:bg-blue-50"
        sx={{
          '&:hover': {
            '& .MuiTableCell-root:first-of-type': {
              backgroundColor: `${employee.status && '#eff6ff !important'}`,
            },
          },
        }}
      >
        <TableCell
          sx={{
            position: 'sticky',
            left: 0,
            zIndex: 3,
            textAlign: 'center',
          }}
          className="bg-gray-100 px-3 py-2"
        >
          <Stack direction={'row'} alignItems={'center'}>
            <Box
              sx={{
                width: '20px',
              }}
            >
              <Typography
                sx={{
                  fontSize: {
                    xs: '0.75rem',
                    md: '0.85rem',
                  },
                }}
                className={`${!employee.status && 'text-red-400'}`}
              >
                {index + 1}.
              </Typography>
            </Box>
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
                noWrap
                sx={{
                  flexGrow: 1,
                  fontSize: {
                    xs: '0.75rem',
                    md: '0.85rem',
                  },
                  fontWeight: 600,
                }}
                className={`${!employee.status && 'text-red-400'}`}
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

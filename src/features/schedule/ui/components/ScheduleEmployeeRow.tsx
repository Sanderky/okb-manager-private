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
import type { CellDisplayItem, ICell } from '../../model/types';
import type { Employee } from '@/entities/employee';
import { ScheduleCellContent } from './ScheduleCellContent';

interface EmployeeRowProps {
  employee: Employee;
  weeks: Dayjs[];
  onCellClick: (e: React.MouseEvent<HTMLElement>, cell: ICell) => void;
  getCellContentItems: (cell: ICell) => CellDisplayItem[];
  activeTable: { type: number; week: Dayjs };
  loadingCells: Set<string>;
  getCellKey: (cell: ICell) => string;
  index: number;
  onEmployeeClick: (id: string) => void;
}

interface ScheduleCellProps {
  cell: ICell;
  onClick: (e: React.MouseEvent<HTMLElement>, cell: ICell) => void;
  getCellContentItems: (cell: ICell) => CellDisplayItem[];
  loadingCells: Set<string>;
  getCellKey: (cell: ICell) => string;
  employee: Employee;
}

const ScheduleCell: React.FC<ScheduleCellProps> = React.memo(
  ({
    cell,
    onClick,
    getCellContentItems,
    loadingCells,
    getCellKey,
    employee,
  }) => {
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
        {isLoading ? (
          <CircularProgress size={16} />
        ) : (
          <ScheduleCellContent
            items={getCellContentItems(cell)}
            isWeek={cell.isWeek}
          />
        )}
      </TableCell>
    );
  }
);

export const EmployeeRow: React.FC<EmployeeRowProps> = React.memo(
  ({
    employee,
    weeks,
    onCellClick,
    getCellContentItems,
    activeTable,
    loadingCells,
    getCellKey,
    index,
    onEmployeeClick,
  }) => {
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
              position: { xs: 'static', sm: 'sticky' },
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
                  onClick={() => onEmployeeClick(employee.id)}
                  sx={{
                    fontSize: {
                      xs: '0.75rem',
                      md: '0.85rem',
                    },
                    cursor: 'pointer',
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
                getCellContentItems={getCellContentItems}
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
            position: { xs: 'static', sm: 'sticky' },
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
                onClick={() => onEmployeeClick(employee.id)}
                sx={{
                  cursor: 'pointer',
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

          return (
            <ScheduleCell
              key={week.format('YYYY-MM-DD')}
              cell={cell}
              onClick={onCellClick}
              getCellContentItems={getCellContentItems}
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

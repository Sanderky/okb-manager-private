import { useMemo } from 'react';
import { Box } from '@mui/material';
import type { MRT_ColumnDef } from 'material-react-table';
import dayjs from 'dayjs';
import type { Construction } from '@/entities/construction';
import { dateBetweenFilterFn, employeeCountFilterFn } from '../model/filter';

export const useConstructionsColumns = (
  employeesData: Record<string, number> | undefined
) => {
  return useMemo<MRT_ColumnDef<Construction & { employeeCount?: number }>[]>(
    () => [
      { id: 'name', accessorKey: 'name', header: 'Nazwa' },
      {
        id: 'contractorName',
        accessorKey: 'contractorName',
        header: 'Wykonawca',
        filterFn: 'equals',
      },
      { id: 'location', accessorKey: 'location', header: 'Adres' },
      {
        id: 'startDate',
        header: 'Data rozpoczęcia',
        filterVariant: 'date-range',
        accessorFn: (originalRow) =>
          originalRow.startDate
            ? dayjs(originalRow.startDate).startOf('day')
            : null,
        Cell: ({ cell }) => {
          const value = cell.getValue();
          if (!value || !dayjs.isDayjs(value) || !value.isValid()) return '-';
          return dayjs(value).format('DD.MM.YYYY');
        },
        filterFn: dateBetweenFilterFn,
        maxSize: 140,
      },
      {
        id: 'endDate',
        header: 'Data zakończenia',
        filterVariant: 'date-range',
        accessorFn: (originalRow) =>
          originalRow.endDate && dayjs(originalRow.endDate).isValid()
            ? dayjs(originalRow.endDate).startOf('day')
            : null,
        Cell: ({ cell }) => {
          const value = cell.getValue();
          if (!value || !dayjs.isDayjs(value) || !value.isValid()) return '-';
          return dayjs(value).format('DD.MM.YYYY');
        },
        filterFn: dateBetweenFilterFn,
        maxSize: 140,
      },
      {
        id: 'employeeCount',
        header: 'Pracownicy dziś',
        accessorFn: (row) => employeesData?.[row.id] || 0,
        filterVariant: 'range',
        filterFn: employeeCountFilterFn,
        Cell: ({ cell }) => {
          const count = cell.getValue<number>();
          return (
            <Box
              component="span"
              className="rounded-full px-2 py-1 font-medium"
              sx={(theme) => ({
                color:
                  count > 0
                    ? theme.palette.status.employee.active.text
                    : theme.palette.text.secondary,
                background:
                  count > 0
                    ? theme.palette.status.employee.active.background
                    : theme.palette.background.default,
              })}
            >
              {count}
            </Box>
          );
        },
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => row.status,
        filterVariant: 'select',
        filterSelectOptions: [
          { label: 'W trakcie', value: 'true' },
          { label: 'Zakończone', value: 'false' },
          { label: 'Wszystkie', value: '' },
        ],
        filterFn: (row: any, _columnId: string, filterValue: string) => {
          if (!filterValue) return true;
          return String(row.original.status) === filterValue;
        },
        Cell: ({ cell }) => (
          <Box
            component="span"
            className="rounded px-3 py-1"
            sx={(theme) => ({
              background: cell.getValue<boolean>()
                ? theme.palette.status.construction.active.background
                : theme.palette.status.construction.inactive.background,
              color: cell.getValue<boolean>()
                ? theme.palette.status.construction.active.text
                : theme.palette.status.construction.inactive.text,
            })}
          >
            {cell.getValue<boolean>() ? 'W trakcie' : 'Zakończona'}
          </Box>
        ),
      },
    ],
    [employeesData]
  );
};

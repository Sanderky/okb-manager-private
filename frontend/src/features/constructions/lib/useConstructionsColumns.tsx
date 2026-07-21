import { useMemo } from 'react';
import { Box } from '@mui/material';
import type { MRT_ColumnDef } from 'material-react-table';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import type { Construction } from '@/entities/construction';
import { dateBetweenFilterFn, employeeCountFilterFn } from '../model/filter';

export const useConstructionsColumns = (
  employeesData: Record<string, number> | undefined
) => {
  const { t } = useTranslation(['constructions', 'common']);

  return useMemo<MRT_ColumnDef<Construction & { employeeCount?: number }>[]>(
    () => [
      { id: 'name', accessorKey: 'name', header: t('fields.name') },
      {
        id: 'contractorName',
        accessorKey: 'contractorName',
        header: t('fields.contractor'),
        filterFn: 'equals',
      },
      {
        id: 'location',
        accessorKey: 'location',
        header: t('fields.address'),
      },
      {
        id: 'startDate',
        header: t('fields.startDate'),
        filterVariant: 'date-range',
        accessorFn: (originalRow) =>
          originalRow.startDate
            ? dayjs(originalRow.startDate).startOf('day')
            : null,
        Cell: ({ cell }) => {
          const value = cell.getValue();
          if (!value || !dayjs.isDayjs(value) || !value.isValid()) return '-';
          return dayjs(value).format('L');
        },
        filterFn: dateBetweenFilterFn,
        maxSize: 140,
      },
      {
        id: 'endDate',
        header: t('fields.endDate'),
        filterVariant: 'date-range',
        accessorFn: (originalRow) =>
          originalRow.endDate && dayjs(originalRow.endDate).isValid()
            ? dayjs(originalRow.endDate).startOf('day')
            : null,
        Cell: ({ cell }) => {
          const value = cell.getValue();
          if (!value || !dayjs.isDayjs(value) || !value.isValid()) return '-';
          return dayjs(value).format('L');
        },
        filterFn: dateBetweenFilterFn,
        maxSize: 140,
      },
      {
        id: 'employeeCount',
        header: t('fields.employeeCount'),
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
        header: t('fields.status'),
        accessorFn: (row) => row.status,
        filterVariant: 'select',
        filterSelectOptions: [
          { label: t('statusOptions.inProgress'), value: 'true' },
          { label: t('common:status.completed'), value: 'false' },
          { label: t('statusOptions.all'), value: '' },
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
            {cell.getValue<boolean>()
              ? t('statusOptions.inProgress')
              : t('common:status.completed')}
          </Box>
        ),
      },
    ],
    [employeesData, t]
  );
};

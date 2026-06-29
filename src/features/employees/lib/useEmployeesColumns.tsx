import { useMemo } from 'react';
import { Box } from '@mui/material';
import type { MRT_ColumnDef } from 'material-react-table';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { sortByLastName, type Employee } from '@/entities/employee';
import { dateBetweenFilterFn, hourRateFilterFn } from '../model/filter';

export const useEmployeeColumns = (alertsMap: Map<string, any[]>) => {
  const { t, i18n } = useTranslation('employees');

  return useMemo<MRT_ColumnDef<Employee>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('form.fields.name'),
        Cell: ({ renderedCellValue, row }) => {
          const employeeId = row.original.id;
          const hasAlert = (alertsMap.get(employeeId) || []).length > 0;
          return (
            <Box
              sx={(theme) => ({
                color: hasAlert ? theme.palette.warning.dark : '',
              })}
            >
              {renderedCellValue}
            </Box>
          );
        },
        sortingFn: (a, b) => sortByLastName(a.original.name, b.original.name),
      },
      { accessorKey: 'email', header: t('form.fields.email') },
      { accessorKey: 'phone', header: t('form.fields.phone') },
      { accessorKey: 'address', header: t('form.fields.address') },
      { accessorKey: 'pesel', header: t('form.fields.pesel') },
      {
        accessorKey: 'hourRate',
        header: t('list.filters.hourRate'),
        filterVariant: 'range',
        filterFn: hourRateFilterFn,
        Cell: ({ cell }) => {
          const value = cell.getValue<number>();
          if (value === null || value === undefined) return '-';
          return value.toLocaleString(i18n.language, {
            style: 'currency',
            currency: 'EUR',
          });
        },
      },
      { accessorKey: 'accountNumber', header: t('form.fields.accountNumber') },
      {
        accessorKey: 'isContractor',
        header: t('form.sections.contractor'),
        filterVariant: 'checkbox',
        Cell: ({ cell }) => (
          <Box className="w-full text-center">
            {cell.getValue<boolean>() ? (
              <CheckBoxIcon sx={{ color: 'textSecondary' }} />
            ) : (
              <CheckBoxOutlineBlankIcon sx={{ color: 'textSecondary' }} />
            )}
          </Box>
        ),
      },
      { accessorKey: 'birthPlace', header: t('form.fields.birthPlace') },
      {
        accessorKey: 'birthDate',
        header: t('form.fields.birthDate'),
        filterVariant: 'date-range',
        accessorFn: (originalRow) =>
          originalRow.birthDate && dayjs(originalRow.birthDate).isValid()
            ? dayjs(originalRow.birthDate).startOf('day')
            : null,
        Cell: ({ cell }) => {
          const value = cell.getValue();
          if (!value || !dayjs.isDayjs(value) || !value.isValid()) return '-';
          return dayjs(value).format('DD.MM.YYYY');
        },
        filterFn: dateBetweenFilterFn,
      },
      {
        accessorKey: 'contractStartDate',
        header: t('form.fields.contractStartDate'),
        filterVariant: 'date-range',
        size: 250,
        accessorFn: (originalRow) =>
          originalRow.contractStartDate &&
          dayjs(originalRow.contractStartDate).isValid()
            ? dayjs(originalRow.contractStartDate).startOf('day')
            : null,
        Cell: ({ cell }) => {
          const value = cell.getValue();
          if (!value || !dayjs.isDayjs(value) || !value.isValid()) return '-';
          return dayjs(value).format('DD.MM.YYYY');
        },
        filterFn: dateBetweenFilterFn,
      },
      {
        accessorKey: 'contractEndDate',
        header: t('form.fields.contractEndDate'),
        size: 250,
        filterVariant: 'date-range',
        accessorFn: (originalRow) =>
          originalRow.contractEndDate &&
          dayjs(originalRow.contractEndDate).isValid()
            ? dayjs(originalRow.contractEndDate).startOf('day')
            : null,
        Cell: ({ cell }) => {
          const value = cell.getValue();
          if (!value || !dayjs.isDayjs(value) || !value.isValid()) return '-';
          return dayjs(value).format('DD.MM.YYYY');
        },
        filterFn: dateBetweenFilterFn,
      },
      {
        accessorKey: 'a1StartDate',
        header: t('form.fields.a1StartDate'),
        filterVariant: 'date-range',
        accessorFn: (originalRow) =>
          originalRow.a1StartDate && dayjs(originalRow.a1StartDate).isValid()
            ? dayjs(originalRow.a1StartDate).startOf('day')
            : null,
        Cell: ({ cell }) => {
          const value = cell.getValue();
          if (!value || !dayjs.isDayjs(value) || !value.isValid()) return '-';
          return dayjs(value).format('DD.MM.YYYY');
        },
        filterFn: dateBetweenFilterFn,
      },
      {
        accessorKey: 'a1EndDate',
        header: t('form.fields.a1EndDate'),
        filterVariant: 'date-range',
        accessorFn: (originalRow) =>
          originalRow.a1EndDate && dayjs(originalRow.a1EndDate).isValid()
            ? dayjs(originalRow.a1EndDate).startOf('day')
            : null,
        Cell: ({ cell }) => {
          const value = cell.getValue();
          if (!value || !dayjs.isDayjs(value) || !value.isValid()) return '-';
          return dayjs(value).format('DD.MM.YYYY');
        },
        filterFn: dateBetweenFilterFn,
      },
      {
        id: 'status',
        header: t('list.columns.status'),
        accessorFn: (row) => row.status,
        filterVariant: 'select',
        filterSelectOptions: [
          { label: t('list.filters.options.active'), value: 'true' },
          { label: t('list.filters.options.inactive'), value: 'false' },
          { label: t('list.filters.options.all'), value: '' },
        ],
        filterFn: (row: any, _columnId: string, filterValue: string) => {
          if (!filterValue) return true;
          return String(row.original.status) === filterValue;
        },
        Cell: ({ cell }) => (
          <Box
            component="span"
            className={`rounded px-3 py-1`}
            sx={(theme) => ({
              background: cell.getValue<boolean>()
                ? theme.palette.status.employee.active.background
                : theme.palette.status.employee.inactive.background,
              color: cell.getValue<boolean>()
                ? theme.palette.status.employee.active.text
                : theme.palette.status.employee.inactive.text,
            })}
          >
            {cell.getValue<boolean>()
              ? t('list.status.active')
              : t('list.status.inactive')}
          </Box>
        ),
      },
    ],
    [alertsMap, t, i18n.language]
  );
};

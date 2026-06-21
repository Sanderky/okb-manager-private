import { useMemo } from 'react';
import { Box } from '@mui/material';
import type { MRT_ColumnDef } from 'material-react-table';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import dayjs from 'dayjs';
import { sortByLastName, type Employee } from '@/entities/employee';
import { dateBetweenFilterFn, hourRateFilterFn } from '../model/filter';

export const useEmployeeColumns = (alertsMap: Map<string, any[]>) => {
  return useMemo<MRT_ColumnDef<Employee>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nazwa',
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
      { accessorKey: 'email', header: 'E-mail' },
      { accessorKey: 'phone', header: 'Telefon' },
      { accessorKey: 'address', header: 'Adres' },
      { accessorKey: 'pesel', header: 'Pesel' },
      {
        accessorKey: 'hourRate',
        header: 'Stawka',
        filterVariant: 'range',
        filterFn: hourRateFilterFn,
        Cell: ({ cell }) => {
          const value = cell.getValue<number>();
          if (value === null || value === undefined) return '-';
          return value.toLocaleString('pl-PL', {
            style: 'currency',
            currency: 'EUR',
          });
        },
      },
      { accessorKey: 'accountNumber', header: 'Numer konta' },
      {
        accessorKey: 'isContractor',
        header: 'Kontraktor',
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
      { accessorKey: 'birthPlace', header: 'Miejsce urodzenia' },
      {
        accessorKey: 'birthDate',
        header: 'Data urodzenia',
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
        header: 'Data rozpoczęcia umowy',
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
        header: 'Data zakończenia umowy',
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
        header: 'Data rozpoczęcia A1',
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
        header: 'Data zakończenia A1',
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
        header: 'Status',
        accessorFn: (row) => row.status,
        filterVariant: 'select',
        filterSelectOptions: [
          { label: 'Aktywni', value: 'true' },
          { label: 'Nieaktywni', value: 'false' },
          { label: 'Wszyscy', value: '' },
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
            {cell.getValue<boolean>() ? 'Aktywny' : 'Nieaktywny'}
          </Box>
        ),
      },
    ],
    [alertsMap]
  );
};

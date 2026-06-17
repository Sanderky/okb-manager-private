import { TableCell, TableHead, TableRow, Typography } from '@mui/material';
import 'dayjs/locale/pl';
import { useMemo } from 'react';

interface Props {
  weekDates: Date[];
}

export const WorkLogsTableHeader = ({ weekDates }: Props) => {
  const tableHeaders = useMemo(
    () =>
      weekDates.map((date, index) => (
        <TableCell
          key={`${date.getTime()}-${index}`}
          align="center"
          sx={(theme) => ({
            borderRight: `1px solid ${theme.palette.divider}`,
            borderBottom: theme.hoursTable.borderBold,
            background: theme.palette.background.default,
          })}
        >
          <Typography
            className="block text-center font-semibold"
            variant="caption"
          >
            {date.toLocaleDateString('pl-PL', { weekday: 'short' })}
          </Typography>
          <Typography className="text-center font-semibold" variant="body2">
            {date.getDate().toString().padStart(2, '0')}.
            {(date.getMonth() + 1).toString().padStart(2, '0')}
          </Typography>
        </TableCell>
      )),
    [weekDates]
  );

  return (
    <TableHead>
      <TableRow>
        <TableCell
          sx={(theme) => ({
            borderRight: `1px solid ${theme.palette.divider}`,
            borderBottom: theme.hoursTable.borderBold,
            background: theme.palette.background.default,
          })}
          align="center"
        >
          <Typography className="text-center font-semibold" variant="body2">
            Budowa
          </Typography>
        </TableCell>
        <TableCell
          sx={(theme) => ({
            borderRight: `1px solid ${theme.palette.divider}`,
            borderBottom: theme.hoursTable.borderBold,
            background: theme.palette.background.default,
          })}
          align="center"
        >
          <Typography className="text-center font-semibold" variant="body2">
            Pracownik
          </Typography>
        </TableCell>
        {tableHeaders}
        <TableCell
          align="center"
          sx={(theme) => ({
            borderBottom: theme.hoursTable.borderBold,
            background: theme.palette.background.default,
          })}
        >
          <Typography className="text-center font-semibold" variant="body2">
            Suma
          </Typography>
        </TableCell>
      </TableRow>
    </TableHead>
  );
};

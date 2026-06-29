import { TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import dayjs from 'dayjs';

interface Props {
  weekDates: Date[];
}

export const WorkLogsTableHeader = ({ weekDates }: Props) => {
  const { t } = useTranslation('workLogs');

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
            {dayjs(date).format('ddd')}
          </Typography>
          <Typography className="text-center font-semibold" variant="body2">
            {dayjs(date).format('DD.MM')}
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
            {t('table.headers.construction')}
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
            {t('table.headers.employee')}
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
            {t('table.headers.sum')}
          </Typography>
        </TableCell>
      </TableRow>
    </TableHead>
  );
};

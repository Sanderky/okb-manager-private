import { TableHead, TableRow, TableCell, Typography } from '@mui/material';
import type { LangCode } from '@/shared/model/types';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

interface PrintableTableHeaderProps {
  printTitle: boolean;
  tableTitle: string;
  weekDates: Date[];
  lang: LangCode;
  borderBold: string;
}

export const PrintableTableHeader = ({
  printTitle,
  tableTitle,
  weekDates,
  lang,
  borderBold,
}: PrintableTableHeaderProps) => {
  const { t } = useTranslation('workLogs');
  const shortLang = lang.substring(0, 2).toLowerCase();

  return (
    <TableHead sx={{ display: 'table-row-group' }}>
      {printTitle && (
        <TableRow>
          <TableCell
            colSpan={10}
            sx={{ border: 'none', textAlign: 'left', p: 0 }}
          >
            <Typography variant="caption" sx={{ textAlign: 'left' }}>
              {tableTitle}
            </Typography>
          </TableCell>
        </TableRow>
      )}
      <TableRow>
        <TableCell sx={{ borderBottom: borderBold, p: 0, px: 1 }}>
          <Typography className="text-center font-semibold" variant="body2">
            {t('print.report.construction', { lng: lang })}
          </Typography>
        </TableCell>
        <TableCell sx={{ borderBottom: borderBold, p: 0, px: 1 }}>
          <Typography className="text-center font-semibold" variant="body2">
            {t('print.report.employee', { lng: lang })}
          </Typography>
        </TableCell>

        {weekDates.map((date, index) => (
          <TableCell
            key={index}
            align="center"
            sx={{ borderBottom: borderBold, p: 0, px: 2 }}
          >
            <Typography
              className="block text-center font-semibold"
              variant="caption"
              sx={{ fontSize: '0.6rem' }}
            >
              {dayjs(date).locale(shortLang).format('ddd')}
            </Typography>
            <Typography className="text-center font-semibold" variant="body2">
              {dayjs(date).format('DD.MM')}
            </Typography>
          </TableCell>
        ))}

        <TableCell
          align="center"
          sx={{ p: 0, px: 1, borderBottom: borderBold }}
        >
          <Typography className="text-center font-semibold" variant="body2">
            {t('print.report.sum', { lng: lang })}
          </Typography>
        </TableCell>
      </TableRow>
    </TableHead>
  );
};

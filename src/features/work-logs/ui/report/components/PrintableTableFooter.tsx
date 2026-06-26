import { TableRow, TableCell, Typography } from '@mui/material';
import { formatDecimal } from '@/shared/lib/format';
import type { LangCode } from '@/shared/model/types';
import { useTranslation } from 'react-i18next';

interface PrintableTableFooterProps {
  constructionsCount: number;
  employeesCount: number;
  grandTotal: number;
  hasData: boolean;
  lang: LangCode;
}

export const PrintableTableFooter = ({
  constructionsCount,
  employeesCount,
  grandTotal,
  lang,
  hasData,
}: PrintableTableFooterProps) => {
  const { t } = useTranslation('workLogs');

  return (
    <TableRow sx={{ borderTop: 'none', background: '#fff' }}>
      <TableCell align="left" sx={{ border: 'none', p: 0, py: 0.5 }}>
        <Typography sx={{ pl: 1 }}>
          {t('print.report.constructionsCount', {
            count: constructionsCount,
            lng: lang,
          })}
        </Typography>
      </TableCell>
      <TableCell align="left" sx={{ border: 'none', p: 0 }}>
        <Typography>
          {t('print.report.employeesCount', {
            count: employeesCount,
            lng: lang,
          })}
        </Typography>
      </TableCell>
      <TableCell colSpan={7} align="right" sx={{ border: 'none', p: 0, pr: 0 }}>
        <Typography align="right">
          {t('print.report.sum', { lng: lang })}
        </Typography>
      </TableCell>
      <TableCell
        align="center"
        sx={{ border: 'none', p: 0, borderLeft: 'none !important' }}
      >
        <Typography>
          {hasData ? formatDecimal(grandTotal, lang) : '-'}
        </Typography>
      </TableCell>
    </TableRow>
  );
};

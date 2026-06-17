import { TableRow, TableCell, Typography } from '@mui/material';
import { formatToPolishDecimal } from '@/shared/lib/format';
import type { ReportTranslations } from '../../../lib/reportTranslations';

interface PrintableTableFooterProps {
  constructionsCount: number;
  employeesCount: number;
  grandTotal: number;
  translations: ReportTranslations;
  hasData: boolean;
}

export const PrintableTableFooter = ({
  constructionsCount,
  employeesCount,
  grandTotal,
  translations,
  hasData,
}: PrintableTableFooterProps) => (
  <TableRow sx={{ borderTop: 'none', background: '#fff' }}>
    <TableCell align="left" sx={{ border: 'none', p: 0, py: 0.5 }}>
      <Typography
        sx={{ pl: 1 }}
      >{`${translations.constructions}: ${constructionsCount}`}</Typography>
    </TableCell>
    <TableCell align="left" sx={{ border: 'none', p: 0 }}>
      <Typography>{`${translations.employees}: ${employeesCount}`}</Typography>
    </TableCell>
    <TableCell colSpan={7} align="right" sx={{ border: 'none', p: 0, pr: 0 }}>
      <Typography align="right">{`${translations.totalSum}:`}</Typography>
    </TableCell>
    <TableCell
      align="center"
      sx={{ border: 'none', p: 0, borderLeft: 'none !important' }}
    >
      <Typography>
        {hasData ? formatToPolishDecimal(grandTotal) : '-'}
      </Typography>
    </TableCell>
  </TableRow>
);

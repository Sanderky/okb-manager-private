import { TableHead, TableRow, TableCell, Typography } from '@mui/material';
import type { LangCode } from '@/shared/model/types';
import type { ReportTranslations } from '../../../lib/reportTranslations';

interface PrintableTableHeaderProps {
  printTitle: boolean;
  tableTitle: string;
  weekDates: Date[];
  lang: LangCode;
  translations: ReportTranslations;
  borderBold: string;
}

export const PrintableTableHeader = ({
  printTitle,
  tableTitle,
  weekDates,
  lang,
  translations,
  borderBold,
}: PrintableTableHeaderProps) => (
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
          {translations.construction}
        </Typography>
      </TableCell>
      <TableCell sx={{ borderBottom: borderBold, p: 0, px: 1 }}>
        <Typography className="text-center font-semibold" variant="body2">
          {translations.employee}
        </Typography>
      </TableCell>

      {/* Mapowanie dni */}
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
            {date.toLocaleDateString(lang, { weekday: 'short' })}
          </Typography>
          <Typography className="text-center font-semibold" variant="body2">
            {date.getDate().toString().padStart(2, '0')}.
            {(date.getMonth() + 1).toString().padStart(2, '0')}
          </Typography>
        </TableCell>
      ))}

      <TableCell align="center" sx={{ p: 0, px: 1, borderBottom: borderBold }}>
        <Typography className="text-center font-semibold" variant="body2">
          {translations.sum}
        </Typography>
      </TableCell>
    </TableRow>
  </TableHead>
);

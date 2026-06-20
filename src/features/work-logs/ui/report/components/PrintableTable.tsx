import { forwardRef, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/pl';
import type { ConstructionsWithWorkHours } from '../../../model/types';
import { getWeekNumber } from '@/shared/lib/date';
import type { LangCode } from '@/shared/model/types';
import { sortConstructionsWithWorkHours } from '../../../model/utils/hoursTableUtils';
import { formatToPolishDecimal } from '@/shared/lib/format';
import { getReportTranslations } from '../../../lib/reportTranslations';
import { printStyles } from './printStyles';
import { PrintableTableRows } from './PrintableTableRows';

interface PrintableTableProps {
  constructionsWithWorkHours: ConstructionsWithWorkHours[];
  weekDates: Date[];
  totalHoursData: { dailyTotals: number[]; grandTotal: number };
  showVacation: boolean;
  customNoDataText?: string;
  customTitle?: string;
  printTitle?: boolean;
  lang?: LangCode;
}

export const PrintableTable = forwardRef<HTMLDivElement, PrintableTableProps>(
  (
    {
      constructionsWithWorkHours,
      weekDates,
      totalHoursData,
      showVacation,
      customTitle,
      customNoDataText,
      printTitle = true,
      lang = 'pl-PL',
    },
    ref
  ) => {
    const translations = getReportTranslations(lang);
    const dataSorted = useMemo(() => {
      return sortConstructionsWithWorkHours(constructionsWithWorkHours);
    }, [constructionsWithWorkHours]);

    const employeesCount = useMemo(() => {
      return constructionsWithWorkHours.reduce((acc, construction) => {
        return acc + construction.workHours.length;
      }, 0);
    }, [constructionsWithWorkHours]);

    const tableTitle =
      customTitle ??
      `Tydzień ${getWeekNumber(weekDates[0])}: ${dayjs(weekDates[0]).format('DD.MM.YYYY')} - ${dayjs(weekDates[6]).format('DD.MM.YYYY')}`;

    return (
      <Box ref={ref} sx={{ width: '99%' }}>
        {dataSorted.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              width: '100%',
              flexDirection: 'column',
            }}
          >
            {printTitle && (
              <Typography
                variant="caption"
                sx={{
                  textAlign: 'left !important',
                  mb: 1,
                }}
              >
                {tableTitle}
              </Typography>
            )}
            <Typography sx={{ width: '100%' }}>
              {customNoDataText ?? 'Brak danych'}
            </Typography>
          </Box>
        ) : (
          <TableContainer className="bg-white">
            <Table
              size="small"
              sx={{
                '& td, & th, & p': {
                  fontSize: printStyles.fontSize,
                },
                '& td, & th': {
                  border: printStyles.tableBorder,
                  textAlign: 'center',
                },
                border: '1px solid #000',
                borderTop: 'none !important',
                borderLeft: 'none !important',
                borderRight: 'none !important',
                borderCollapse: 'collapse',
              }}
            >
              <TableHead sx={{ display: 'table-row-group' }}>
                {printTitle && (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      align="left"
                      sx={{
                        borderLeft: 'none !important',
                        borderRight: 'none !important',
                        borderTop: 'none !important',
                        textAlign: 'left !important',

                        p: 0,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          textAlign: 'left !important',
                          //  mb: 2
                        }}
                      >
                        {tableTitle}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell
                    sx={{
                      borderBottom: printStyles.borderBold,
                      p: 0,
                      px: 1,
                    }}
                  >
                    <Typography
                      className="text-center font-semibold"
                      variant="body2"
                    >
                      {translations.construction}
                    </Typography>
                  </TableCell>
                  <TableCell
                    sx={{
                      borderBottom: printStyles.borderBold,
                      p: 0,
                      px: 1,
                    }}
                  >
                    <Typography
                      className="text-center font-semibold"
                      variant="body2"
                    >
                      {translations.employee}
                    </Typography>
                  </TableCell>
                  {weekDates.map((date, index) => (
                    <TableCell
                      key={index}
                      align="center"
                      sx={{
                        borderBottom: printStyles.borderBold,
                        p: 0,
                        px: 2,
                      }}
                    >
                      <Typography
                        className="block text-center font-semibold"
                        variant="caption"
                        sx={{
                          fontSize: '0.6rem',
                        }}
                      >
                        {date.toLocaleDateString(lang, { weekday: 'short' })}
                      </Typography>
                      <Typography
                        className="text-center font-semibold"
                        variant="body2"
                      >
                        {date.getDate().toString().padStart(2, '0')}.
                        {(date.getMonth() + 1).toString().padStart(2, '0')}
                      </Typography>
                    </TableCell>
                  ))}
                  <TableCell
                    align="center"
                    sx={{
                      p: 0,
                      px: 1,

                      borderBottom: printStyles.borderBold,
                    }}
                  >
                    <Typography
                      className="text-center font-semibold"
                      variant="body2"
                    >
                      {translations.sum}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                <PrintableTableRows
                  constructionsWithWorkHours={dataSorted}
                  showVacation={showVacation}
                  lang={lang}
                />

                <TableRow
                  sx={{
                    borderTop: 'none',
                    borderBottom: 'none',
                    background: '#fff',
                  }}
                >
                  <TableCell
                    align="center"
                    valign="middle"
                    sx={{
                      textAlign: 'left !important',

                      borderTop: 'none',
                      p: 0,
                      py: 0.5,
                      borderBottom: 'none',
                      borderRight: 'none !important',
                    }}
                  >
                    <Typography
                      sx={{
                        pl: 1,
                      }}
                    >
                      {`${translations.constructions}: ${constructionsWithWorkHours.length}`}
                    </Typography>
                  </TableCell>
                  <TableCell
                    valign="middle"
                    align="left"
                    sx={{
                      borderTop: 'none',
                      p: 0,
                      textAlign: 'left !important',
                      borderBottom: 'none',
                      borderRight: 'none !important',
                      borderLeft: 'none !important',
                    }}
                  >
                    <Typography>
                      {`${translations.employees}: ${employeesCount}`}
                    </Typography>
                  </TableCell>
                  <TableCell
                    valign="middle"
                    sx={{
                      borderTop: 'none',
                      p: 0,
                      pr: 0,
                      borderBottom: 'none',
                      borderLeft: 'none !important',
                      borderRight: 'none !important',
                      textAlign: 'right !important',
                    }}
                    colSpan={7}
                    align="right"
                  >
                    <Typography
                      align="right"
                      sx={{
                        textAlign: 'right !important',
                      }}
                    >
                      {`${translations.totalSum}:`}
                    </Typography>
                  </TableCell>
                  <TableCell
                    valign="middle"
                    sx={{
                      borderTop: 'none',
                      p: 0,
                      borderBottom: 'none',
                      borderLeft: 'none !important',
                    }}
                    align="center"
                  >
                    <Typography>
                      {dataSorted.length > 0
                        ? formatToPolishDecimal(totalHoursData.grandTotal)
                        : '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    );
  }
);

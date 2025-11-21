import React, { forwardRef, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/pl';
import isoWeek from 'dayjs/plugin/isoWeek';
import { CancelPresentation } from '@mui/icons-material';
import type { ConstructionsWithWorkHours } from './useHoursTable';
import {
  formatToPolishDecimal,
  formatWeeksString,
  getWeeksInRange,
} from './HoursHelpers';
import useWeekReport from './useWeeksReport';
import { getReporTranslations, type LangCode } from './reportTranslations';
import type { TableData } from './Hours';
import type { Construction, Employee } from '../../../types';

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

const borderBold = '2px solid #000 !important';
const numberCellMaxWidth = '20px';
const numberCellPadding = 0.3;
const constructionCellWidth = 'auto';
const employeeCellWidth = 'auto';
const constructionCellMinWidth = '50px';
const employeeCellMinWidth = '50px';
const vacationColor = 'none';
const sumColor = '#fff3cd !important';
const tableBorder = '1px solid #000';

const fontSize = '0.7rem';

interface TableRowsProps {
  constructionsWithWorkHours: ConstructionsWithWorkHours[];
  showVacation: boolean;
  lang: LangCode;
}

const TableRows = ({
  constructionsWithWorkHours,
  showVacation,
  lang,
}: TableRowsProps) => {
  const translations = getReporTranslations(lang);
  if (constructionsWithWorkHours.length > 0) {
    return constructionsWithWorkHours.map((construction) => {
      return (
        <React.Fragment key={construction.id}>
          {construction.workHours.map((workHour, employeeIndex) => (
            <TableRow key={workHour.id}>
              <TableCell
                sx={{
                  // p: numberCellPadding,
                  p: 1,
                  fontWeight: 'bold',
                  verticalAlign: 'top',
                  borderBottom: 'none !important',
                  borderTop: 'none !important',
                  width: constructionCellWidth,
                  minWidth: constructionCellMinWidth,
                  // wordBreak: 'break-all',
                }}
              >
                {employeeIndex === 0 ? construction.name : ''}
              </TableCell>

              <TableCell
                sx={{
                  // p: numberCellPadding,
                  p: 1,
                  // pl: 2,
                  width: employeeCellWidth,
                  fontWeight: 'bold',
                  minWidth: employeeCellMinWidth,
                  borderTop: tableBorder,
                  // wordBreak: 'break-all',
                }}
              >
                {workHour.employeeName}
              </TableCell>

              {workHour.hours.map((hour, dayIndex) => {
                const isVacation = workHour.isOnVacation[dayIndex];
                return (
                  <TableCell
                    key={dayIndex}
                    align="center"
                    sx={{
                      borderTop: tableBorder,

                      width: numberCellMaxWidth,
                      minWidth: '20px',
                      p: numberCellPadding,
                      backgroundColor: isVacation ? vacationColor : 'none',
                    }}
                  >
                    {isVacation && showVacation ? (
                      <Typography variant="body2" color="textPrimary">
                        {translations.vacation}
                      </Typography>
                    ) : (
                      <Typography>{formatToPolishDecimal(hour)}</Typography>
                    )}
                  </TableCell>
                );
              })}

              <TableCell
                align="center"
                sx={{
                  fontWeight: 'bold',
                  width: numberCellMaxWidth,
                  minWidth: '20px',
                  p: numberCellPadding,
                }}
              >
                {formatToPolishDecimal(workHour.total)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell
              sx={{
                borderTop: 'none !important',
                borderBottom: borderBold,
                p: 0.5,
                background: '#fff',
              }}
            ></TableCell>
            <TableCell
              sx={{
                borderBottom: borderBold,
                p: 0.5,
                background: '#fff',
              }}
              colSpan={8}
            ></TableCell>
            <TableCell
              align="center"
              sx={{
                borderBottom: borderBold,
                p: 0.5,
                fontWeight: 'bold',
                padding: 0,
                backgroundColor: sumColor,
              }}
            >
              {formatToPolishDecimal(construction.totalHours)}
            </TableCell>
          </TableRow>
        </React.Fragment>
      );
    });
  } else
    return (
      <TableRow>
        <TableCell colSpan={10} sx={{ height: '300px' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CancelPresentation
              sx={{ color: 'text.secondary', fontSize: 40 }}
            />
            <Typography color="textSecondary" variant="body2">
              Brak danych dla danego tygodnia
            </Typography>
          </Box>
        </TableCell>
      </TableRow>
    );
};

interface PrintableTableProps {
  constructionsWithWorkHours: ConstructionsWithWorkHours[];
  weekDates: Date[];
  totalHoursData: { dailyTotals: number[]; grandTotal: number };
  showVacation: boolean;
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
      printTitle,
      lang = 'pl-PL',
    },
    ref
  ) => {
    const translations = getReporTranslations(lang);
    return (
      <Box ref={ref} sx={{ width: '100%' }}>
        {printTitle && (
          <Typography variant="caption" sx={{ mb: 2 }}>
            {`${dayjs(weekDates[0]).format('DD.MM.YYYY')} - ${dayjs(weekDates[6]).format('DD.MM.YYYY')}`}
          </Typography>
        )}

        {constructionsWithWorkHours.length === 0 ? (
          <Typography sx={{ width: '100%' }}>Brak danych</Typography>
        ) : (
          <TableContainer className="bg-white">
            <Table
              size="small"
              sx={{
                '& td, & th, & p': {
                  fontSize: fontSize,
                },
                '& td, & th': {
                  border: tableBorder,
                  textAlign: 'center',
                },
                border: '1px solid #000',
                borderCollapse: 'collapse',
              }}
            >
              <TableHead sx={{ display: 'table-row-group' }}>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      borderBottom: borderBold,
                    }}
                  >
                    {translations.construction}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      borderBottom: borderBold,
                    }}
                  >
                    {translations.employee}
                  </TableCell>
                  {weekDates.map((date, index) => (
                    <TableCell
                      key={index}
                      align="center"
                      sx={{
                        fontWeight: 'bold',
                        borderBottom: borderBold,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {date.toLocaleDateString(lang, { weekday: 'short' })}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {date.getDate().toString().padStart(2, '0')}.
                        {(date.getMonth() + 1).toString().padStart(2, '0')}
                      </Typography>
                    </TableCell>
                  ))}
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 'bold', borderBottom: borderBold }}
                  >
                    {translations.sum}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRows
                  constructionsWithWorkHours={constructionsWithWorkHours}
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
                    colSpan={7}
                    sx={{
                      borderTop: 'none',
                      p: 0.5,
                      borderBottom: 'none',
                      borderRight: 'none !important',
                    }}
                  ></TableCell>
                  <TableCell
                    sx={{
                      borderTop: 'none',
                      p: 0.5,
                      pr: 0,
                      borderBottom: 'none',
                      borderLeft: 'none !important',
                      borderRight: 'none !important',
                    }}
                    colSpan={2}
                    align="right"
                  >
                    {`${translations.totalSum}:`}
                  </TableCell>
                  <TableCell
                    sx={{
                      borderTop: 'none',
                      p: 0.5,
                      borderBottom: 'none',
                      borderLeft: 'none !important',
                    }}
                    align="center"
                  >
                    {constructionsWithWorkHours.length > 0
                      ? formatToPolishDecimal(totalHoursData.grandTotal)
                      : '-'}
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

interface PrintReportProps {
  startWeek: Date;
  endWeek: Date;
  onLoading: (isLoading: boolean) => void;
  printTitle?: boolean;
  printTablesTitle?: boolean;
  omitEmpty?: boolean;
  showVacation?: boolean;
  lang?: LangCode;
  selectedConstructions?: Construction[];
  selectedEmployees?: Employee[];
}

export const PrintReport = forwardRef<HTMLDivElement, PrintReportProps>(
  (
    {
      startWeek,
      endWeek,
      onLoading,
      printTablesTitle,
      printTitle,
      omitEmpty,
      showVacation,
      lang = 'pl-PL',
      selectedConstructions = [],
      selectedEmployees = [],
    },
    ref
  ) => {
    const weeks = useMemo(() => {
      return getWeeksInRange(startWeek, endWeek);
    }, [startWeek, endWeek]);

    const { weeksData, isLoading, error } = useWeekReport({
      weekStarts: weeks,
      selectedConstructions,
      selectedEmployees,
    });

    const translations = getReporTranslations(lang);

    useEffect(() => {
      onLoading(isLoading);
    }, [isLoading, onLoading]);

    if (isLoading) {
      return (
        <Box
          ref={ref}
          sx={{
            p: 4,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 200,
          }}
        >
          <Typography>Ładowanie raportu...</Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Box ref={ref} sx={{ p: 4 }}>
          <Alert severity="error">Błąd: {error.message}</Alert>
        </Box>
      );
    }

    return (
      <Box ref={ref} sx={{ backgroundColor: 'white' }}>
        {printTitle && (
          <>
            <Typography variant="h6" gutterBottom align="center">
              {translations.title}
            </Typography>
            <Typography
              variant="body2"
              gutterBottom
              align="center"
              sx={{ mb: 3 }}
            >
              {`${translations.subtitle}: ${dayjs(startWeek).format('DD.MM.YYYY')} - ${dayjs(endWeek).add(6, 'days').format('DD.MM.YYYY')} (${weeks.length} ${formatWeeksString(weeks.length, lang)})`}
            </Typography>
          </>
        )}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {weeksData.map((weekData, index) => {
            if (omitEmpty && weekData.constructionsWithWorkHours.length === 0)
              return null;
            return (
              <Box key={index} sx={{ mb: 4, width: '100%' }}>
                {printTablesTitle && (
                  <Typography
                    variant="caption"
                    sx={{
                      mb: 2,
                    }}
                  >
                    {`${index + 1}) ${translations.week} ${dayjs(weekData.weekStart).isoWeek()} (${dayjs(weekData.weekDates[0]).format('DD.MM.YYYY')} - ${dayjs(weekData.weekDates[6]).format('DD.MM.YYYY')})`}
                  </Typography>
                )}
                {weekData.constructionsWithWorkHours.length === 0 ? (
                  <Typography>{translations.noData}</Typography>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <PrintableTable
                      constructionsWithWorkHours={
                        weekData.constructionsWithWorkHours
                      }
                      weekDates={weekData.weekDates}
                      totalHoursData={weekData.totalHoursData}
                      showVacation={showVacation ?? true}
                      printTitle={false}
                      lang={lang}
                    />
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  }
);

export const MultiTablePrintReport = forwardRef<
  HTMLDivElement,
  { tablesData: { [key: string]: TableData | null } }
>(({ tablesData }, ref) => {
  return (
    <Box ref={ref} sx={{ backgroundColor: 'white' }}>
      <Box
        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        {Object.entries(tablesData).map(([tableId, tableData]) => {
          if (!tableData) return null;

          return (
            <Box key={tableId} sx={{ mb: 4 }}>
              <PrintableTable
                constructionsWithWorkHours={
                  tableData.constructionsWithWorkHours
                }
                weekDates={tableData.weekDates}
                totalHoursData={tableData.totalHoursData}
                showVacation={true}
                printTitle={true}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
});

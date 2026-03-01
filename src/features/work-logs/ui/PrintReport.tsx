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
import { formatToPolishDecimal } from '../model/format';
import useWeekReport from '../model/useWeeksReport';
import { getReporTranslations } from '../model/reportTranslations';
import type { ConstructionsWithWorkHours, TableData } from '../model/types';
import { sortConstructionsWithWorkHours } from '../model/sort';
import {
  formatWeeksString,
  getWeekNumber,
  getWeeksInRange,
} from '@/shared/lib/date';
import type { LangCode } from '@/shared/model/types';

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

const borderBold = '2px solid #000 !important';
const numberCellMaxWidth = '20px';
const numberCellPadding = 0.3;
const constructionCellWidth = 'auto';
const employeeCellWidth = 'auto';
const constructionCellMinWidth = '50px';
const employeeCellMinWidth = '50px';
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
                  px: 1,
                  py: 0,
                  fontWeight: 600,
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
                  px: 1,
                  py: 0,
                  // pl: 2,
                  width: employeeCellWidth,
                  // fontWeight: 'bold',
                  fontWeight: 600,
                  minWidth: employeeCellMinWidth,
                  borderTop: tableBorder,
                  // wordBreak: 'break-all',
                }}
              >
                {workHour.employeeName}
              </TableCell>

              {workHour.hours.map((hour, dayIndex) => {
                const isVacation = workHour.isOnVacation[dayIndex];

                let content;

                if (isVacation && showVacation) {
                  content = (
                    <Typography variant="body2" color="textPrimary">
                      {translations.vacation}
                    </Typography>
                  );
                } else if (hour === null || hour === undefined) {
                  content = null;
                } else {
                  content = (
                    <Typography>{formatToPolishDecimal(hour)}</Typography>
                  );
                }

                return (
                  <TableCell
                    key={dayIndex}
                    align="center"
                    sx={{
                      borderTop: tableBorder,
                      width: numberCellMaxWidth,
                      minWidth: '20px',
                      p: numberCellPadding,
                    }}
                  >
                    {content}
                  </TableCell>
                );
              })}

              <TableCell
                align="center"
                sx={{
                  fontWeight: 600,
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
                borderRight: 'none !important',
              }}
              colSpan={8}
            ></TableCell>
            <TableCell
              align="center"
              className="bg-gray-100"
              sx={{
                borderBottom: borderBold,
                p: 0.5,
                fontWeight: 'bold',
                padding: 0,
                borderLeft: 'none !important',
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
    const translations = getReporTranslations(lang);
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
                  fontSize: fontSize,
                },
                '& td, & th': {
                  border: tableBorder,
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
                      borderBottom: borderBold,
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
                      borderBottom: borderBold,
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
                        borderBottom: borderBold,
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

                      borderBottom: borderBold,
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
                <TableRows
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

interface PrintReportProps {
  startWeek: Date;
  endWeek: Date;
  onLoading: (isLoading: boolean) => void;
  printTitle?: boolean;
  printTablesTitle?: boolean;
  omitEmpty?: boolean;
  showVacation?: boolean;
  lang?: LangCode;
  selectedConstructions?: string[];
  selectedEmployees?: string[];
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
      selectedConstructionIds: selectedConstructions,
      selectedEmployeeIds: selectedEmployees,
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
            const title = `${index + 1}) ${translations.week} ${dayjs(weekData.weekStart).isoWeek()} (${dayjs(weekData.weekDates[0]).format('DD.MM.YYYY')} - ${dayjs(weekData.weekDates[6]).format('DD.MM.YYYY')})`;
            if (omitEmpty && weekData.constructionsWithWorkHours.length === 0)
              return null;
            return (
              <Box
                key={index}
                sx={{
                  mb: 4,
                  width: '100%',
                  pageBreakBefore: index > 0 ? 'always' : 'auto',
                  breakBefore: index > 0 ? 'page' : 'auto',
                }}
              >
                {!weekData ? (
                  <Typography>{translations.noData}</Typography>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <PrintableTable
                      constructionsWithWorkHours={
                        weekData.constructionsWithWorkHours
                      }
                      weekDates={weekData.weekDates}
                      printTitle={printTablesTitle}
                      totalHoursData={weekData.totalHoursData}
                      showVacation={showVacation ?? true}
                      customNoDataText={translations.noData}
                      customTitle={title}
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
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {Object.entries(tablesData).map(([tableId, tableData], index) => {
          if (!tableData) return null;

          return (
            <Box
              key={tableId}
              sx={{
                mb: 4,
                pageBreakBefore: index > 0 ? 'always' : 'auto',
                breakBefore: index > 0 ? 'page' : 'auto',
              }}
            >
              <PrintableTable
                constructionsWithWorkHours={
                  tableData.constructionsWithWorkHours
                }
                weekDates={tableData.weekDates}
                totalHoursData={tableData.totalHoursData}
                showVacation={true}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
});

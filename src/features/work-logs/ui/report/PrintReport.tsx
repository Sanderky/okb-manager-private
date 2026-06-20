import { forwardRef, useEffect, useMemo } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/pl';
import { getReportTranslations } from '../../lib/reportTranslations';
import { formatWeeksString, getWeeksInRange } from '@/shared/lib/date';
import type { LangCode } from '@/shared/model/types';
import { PrintableTable } from './components/PrintableTable';
import useWeekReport from '../../model/api/useWeekReport';

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

    const translations = getReportTranslations(lang);

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

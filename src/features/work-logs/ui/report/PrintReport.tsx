import { forwardRef, useEffect, useMemo } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import dayjs from 'dayjs';
import { getWeeksInRange } from '@/shared/lib/date';
import type { LangCode } from '@/shared/model/types';
import { PrintableTable } from './components/PrintableTable';
import useWeekReport from '../../model/services/useWeekReport';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation('workLogs');

    const weeks = useMemo(() => {
      return getWeeksInRange(startWeek, endWeek);
    }, [startWeek, endWeek]);

    const { weeksData, isLoading, error } = useWeekReport({
      weekStarts: weeks,
      selectedConstructionIds: selectedConstructions,
      selectedEmployeeIds: selectedEmployees,
    });

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
          <Typography>{t('print.report.loading', { lng: lang })}</Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Box ref={ref} sx={{ p: 4 }}>
          <Alert severity="error">
            {t('print.report.error', { lng: lang })} {error.message}
          </Alert>
        </Box>
      );
    }

    return (
      <Box ref={ref} sx={{ backgroundColor: 'white' }}>
        {printTitle && (
          <>
            <Typography variant="h6" gutterBottom align="center">
              {t('print.report.title', { lng: lang })}
            </Typography>
            <Typography
              variant="body2"
              gutterBottom
              align="center"
              sx={{ mb: 3 }}
            >
              {`${t('print.report.subtitle', { lng: lang })}: ${dayjs(startWeek).format('DD.MM.YYYY')} - ${dayjs(endWeek).add(6, 'days').format('DD.MM.YYYY')} (${t('print.report.weeksCount', { count: weeks.length, lng: lang })})`}
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
            const title = `${index + 1}) ${t('print.report.week', { lng: lang })} ${dayjs(weekData.weekStart).isoWeek()} (${dayjs(weekData.weekDates[0]).format('DD.MM.YYYY')} - ${dayjs(weekData.weekDates[6]).format('DD.MM.YYYY')})`;
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
                  <Typography>
                    {t('print.report.noData', { lng: lang })}
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <PrintableTable
                      constructionsWithWorkHours={
                        weekData.constructionsWithWorkHours
                      }
                      weekDates={weekData.weekDates}
                      printTitle={printTablesTitle}
                      totalHoursData={weekData.totalHoursData}
                      showVacation={showVacation ?? true}
                      customNoDataText={t('print.report.noData', { lng: lang })}
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

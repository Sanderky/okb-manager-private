import React from 'react';
import { Box, Typography } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';
import {
  CELL_WIDTH,
  HEADER_HEIGHT,
  CONSTRUCTION_COL_WIDTH,
} from './LodgingsTimeline';

interface TimelineHeaderProps {
  daysArray: Dayjs[];
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  daysArray,
}) => {
  const { t } = useTranslation(['lodgings']);

  const months = React.useMemo(() => {
    const result: { name: string; daysCount: number }[] = [];
    if (daysArray.length === 0) return result;

    let currentMonth = daysArray[0].format('MMMM YYYY');
    let daysCount = 0;

    daysArray.forEach((day) => {
      const monthName = day.format('MMMM YYYY');
      if (monthName === currentMonth) {
        daysCount++;
      } else {
        result.push({ name: currentMonth, daysCount });
        currentMonth = monthName;
        daysCount = 1;
      }
    });
    result.push({ name: currentMonth, daysCount });
    return result;
  }, [daysArray]);

  return (
    <Box
      sx={{
        display: 'flex',
        height: HEADER_HEIGHT,
        position: 'sticky',
        top: 0,
        zIndex: 30,
        backgroundColor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          width: CONSTRUCTION_COL_WIDTH,
          minWidth: CONSTRUCTION_COL_WIDTH,
          position: { xs: 'static', sm: 'sticky' },
          left: 0,
          zIndex: 40,
          bgcolor: 'schedule.accent',
          borderRight: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          px: 2,
        }}
      >
        <Typography variant="caption" fontWeight="bold" color="textSecondary">
          {t('lodgings:timeline.construction')}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            display: 'flex',
            height: '40%',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          {months.map((month, index) => (
            <Box
              key={index}
              sx={{
                width: month.daysCount * CELL_WIDTH,
                minWidth: month.daysCount * CELL_WIDTH,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRight: 1,
                borderColor: 'test.primary',
                backgroundColor: 'background.default',
              }}
            >
              <Typography
                variant="caption"
                noWrap
                sx={{ textTransform: 'capitalize', px: 1, fontWeight: 'bold' }}
              >
                {month.name}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'flex', height: '60%' }}>
          {daysArray.map((day) => {
            const isWeekend = day.day() === 0 || day.day() === 6;
            const isToday = day.isSame(dayjs(), 'day');
            const isLastOfMonth = day.date() === day.daysInMonth();
            return (
              <Box
                key={day.format('YYYY-MM-DD')}
                sx={(theme) => ({
                  width: CELL_WIDTH,
                  minWidth: CELL_WIDTH,
                  borderRight: 1,
                  borderRightColor: isLastOfMonth ? 'text.primary' : 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: isToday
                    ? theme.palette.schedule.current
                    : isWeekend
                      ? theme.palette.background.default
                      : theme.palette.background.paper,
                  flex: 1,
                })}
              >
                <Typography
                  variant="caption"
                  fontWeight={isToday ? 'bold' : 'normal'}
                  color={isToday ? 'textPrimary' : 'textSecondary'}
                >
                  {day.format('DD')}
                </Typography>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  sx={{ fontSize: '0.65rem' }}
                >
                  {day.format('dd')}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

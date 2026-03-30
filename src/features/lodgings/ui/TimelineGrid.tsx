import React, { useMemo } from 'react';
import { Box, alpha } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import { CELL_WIDTH, CONSTRUCTION_COL_WIDTH } from './LodgingsTimeline';

interface TimelineGridProps {
  daysArray: Dayjs[];
}

export const TimelineGrid: React.FC<TimelineGridProps> = ({ daysArray }) => {
  const today = useMemo(() => dayjs(), []);

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        paddingLeft: `${CONSTRUCTION_COL_WIDTH}px`,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {daysArray.map((day) => {
        const isWeekend = day.day() === 0 || day.day() === 6;
        const isToday = day.isSame(today, 'day');
        const isLastOfMonth = day.date() === day.daysInMonth();

        return (
          <Box
            key={'bg-' + day.format('YYYY-MM-DD')}
            sx={(theme) => ({
              width: CELL_WIDTH,
              minWidth: CELL_WIDTH,
              borderRight: 1,
              borderRightColor: isLastOfMonth ? 'text.primary' : 'divider',
              bgcolor: isToday
                ? alpha(
                    theme.palette.schedule?.current ||
                      theme.palette.primary.light,
                    0.5
                  )
                : isWeekend
                  ? theme.palette.background.default
                  : theme.palette.background.paper,
            })}
          />
        );
      })}
    </Box>
  );
};

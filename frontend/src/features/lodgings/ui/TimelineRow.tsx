import React from 'react';
import { Box, Typography, Stack, alpha } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import type { Employee } from '@/entities/employee';
import type {
  Lodging,
  TimelineRow as TimelineRowInferface,
} from '../model/types';
import {
  CONSTRUCTION_COL_WIDTH,
  ROW_PADDING,
  BAR_HEIGHT,
  BAR_GAP,
} from './LodgingsTimeline';
import { TimelineBar } from './TimelineBar';

interface TimelineRowProps {
  row: TimelineRowInferface;
  minDate: Dayjs;
  employees: Employee[];
  onEdit: (l: Lodging) => void;
  handleClickOnConstruction: (id: string | undefined) => void;
}

export const TimelineRow: React.FC<TimelineRowProps> = ({
  row,
  minDate,
  employees,
  onEdit,
  handleClickOnConstruction,
}) => {
  return (
    <Box
      sx={(theme) => ({
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        height: row.height,
        borderBottom: 1,
        borderColor: 'divider',
        '&:hover': {
          bgcolor: alpha(theme.palette.tableHover, 0.5),
        },
        '&:hover .lodgings-timeline-construction': {
          bgcolor: theme.palette.tableHover,
        },
      })}
    >
      <Box
        className="lodgings-timeline-construction"
        sx={{
          width: CONSTRUCTION_COL_WIDTH,
          minWidth: CONSTRUCTION_COL_WIDTH,
          position: { xs: 'static', sm: 'sticky' },
          left: 0,
          zIndex: 20,
          bgcolor: 'background.paper',
          borderRight: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          px: 2,
        }}
      >
        <Stack spacing={0}>
          <Typography
            variant="subtitle2"
            noWrap
            title={row.construction.name}
            onClick={() => handleClickOnConstruction(row.construction.id)}
            sx={{
              color:
                row.construction.id === 'orphan'
                  ? 'text.secondary'
                  : row.construction.status
                    ? 'text.primary'
                    : 'text.disabled',
              textDecoration: row.construction.status ? 'none' : 'line-through',
              fontStyle: row.construction.id === 'orphan' ? 'italic' : 'normal',
              ':hover': {
                textDecoration: row.construction.id === 'orphan' ? 'none' : 'underline',
                cursor: row.construction.id === 'orphan' ? 'default' : 'pointer',
              },
            }}
          >
            {row.construction.name}
          </Typography>
          {row.construction.location && (
            <Typography variant="caption" color="textSecondary" noWrap>
              {row.construction.location}
            </Typography>
          )}
        </Stack>
      </Box>

      <Box sx={{ flex: 1, position: 'relative' }}>
        {row.lodgings.map((lodging) => {
          const startDiff = dayjs(lodging.startDate).diff(minDate, 'day');
          const duration =
            dayjs(lodging.endDate).diff(dayjs(lodging.startDate), 'day') + 1;
          const topPosition =
            ROW_PADDING + lodging.lane * (BAR_HEIGHT + BAR_GAP);

          return (
            <TimelineBar
              key={lodging.id}
              lodging={lodging}
              startDiff={startDiff}
              duration={duration}
              topPosition={topPosition}
              employees={employees}
              onEdit={onEdit}
            />
          );
        })}
      </Box>
    </Box>
  );
};

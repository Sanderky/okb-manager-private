import React, { useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import dayjs from 'dayjs';
import type { Lodging } from '../model/types';
import type { Construction } from '@/entities/construction';
import type { Employee } from '@/entities/employee';
import { useTimelineData } from '../model/useTimeline';
import { TimelineHeader } from './TimelineHeader';
import { TimelineGrid } from './TimelineGrid';
import { TimelineRow } from './TimelineRow';

export const CELL_WIDTH = 40;
export const HEADER_HEIGHT = 60;
export const CONSTRUCTION_COL_WIDTH = 200;
export const BAR_HEIGHT = 36;
export const BAR_GAP = 6;
export const ROW_PADDING = 12;

interface LodgingTimelineProps {
  lodgings: Lodging[];
  onEdit: (l: Lodging) => void;
  employees: Employee[];
  constructions: Construction[];
  handleClickOnConstruction: (id: string | undefined) => void;
}

export const LodgingsTimeline: React.FC<LodgingTimelineProps> = ({
  lodgings,
  onEdit,
  employees,
  constructions,
  handleClickOnConstruction,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { minDate, daysArray, rows } = useTimelineData(lodgings, constructions);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const todayDiff = dayjs().diff(minDate, 'day');
      if (todayDiff > 0)
        scrollContainerRef.current.scrollLeft = (todayDiff - 2) * CELL_WIDTH;
    }
  }, [minDate]);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.default',
      }}
    >
      <Box
        ref={scrollContainerRef}
        sx={{ overflow: 'auto', flex: 1, position: 'relative' }}
      >
        <Box sx={{ minWidth: 'fit-content' }}>
          <TimelineHeader daysArray={daysArray} />

          <Box sx={{ position: 'relative' }}>
            <TimelineGrid daysArray={daysArray} />

            <Box sx={{ backgroundColor: 'background.paper' }}>
              {rows.map((row) => (
                <TimelineRow
                  key={row.construction.id}
                  row={row}
                  minDate={minDate}
                  employees={employees}
                  onEdit={onEdit}
                  handleClickOnConstruction={handleClickOnConstruction}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

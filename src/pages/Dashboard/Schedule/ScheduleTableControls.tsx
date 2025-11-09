import React from 'react';
import {
  Stack,
  Typography,
  IconButton,
  Badge,
  Switch,
  Button,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import WeekSelector from '../../../components/WeekSelector';
import dayjs from 'dayjs';
import type { Employee } from '../../../types';

interface TableControlsProps {
  fromWeek: Date;
  toWeek: Date;
  setFromWeek: (date: Date) => void;
  setToWeek: (date: Date) => void;
  selectedEmployees: Employee[];
  setIsFilterOpen: (open: boolean) => void;
  showVacations: boolean;
  setShowVacations: (show: boolean) => void;
  showDates: boolean;
  setShowDates: (show: boolean) => void;
  activeTable: { type: number; week: dayjs.Dayjs };
}

export const TableControls: React.FC<TableControlsProps> = ({
  fromWeek,
  toWeek,
  setFromWeek,
  setToWeek,
  selectedEmployees,
  setIsFilterOpen,
  showVacations,
  setShowVacations,
  showDates,
  setShowDates,
  activeTable,
}) => {
  return (
    <>
      <Stack
        alignItems={'center'}
        direction={'row'}
        flexWrap={'wrap'}
        justifyContent={'flex-start'}
        gap={2}
        mb={1}
        width={'100%'}
        className={
          'border-lightGray rounded-lg border bg-gray-50 px-3 py-3 md:py-2'
        }
      >
        <Stack
          alignItems={'center'}
          direction={'row'}
          flexWrap={'wrap'}
          gap={2}
          sx={{
            display: {
              xs: 'none',
              sm: 'flex',
            },
          }}
        >
          <WeekSelector
            value={fromWeek}
            onChange={(val) => {
              if (!val) return;

              if (toWeek && dayjs(val).isAfter(toWeek, 'week')) {
                return;
              }

              setFromWeek(val);
            }}
          />
          <Typography>-</Typography>
          <WeekSelector
            value={toWeek}
            onChange={(val) => {
              if (!val) return;

              if (fromWeek && dayjs(val).isBefore(fromWeek, 'week')) {
                return;
              }

              setToWeek(val);
            }}
          />
        </Stack>
        <Badge badgeContent={selectedEmployees.length} color="primary">
          <IconButton
            size="small"
            className="rounded-lg border text-blue-500"
            onClick={() => setIsFilterOpen(true)}
          >
            <FilterListIcon />
          </IconButton>
        </Badge>
        <Stack direction={'row'} spacing={1}>
          <Stack direction="column" alignItems="center" justifyContent="center">
            <Switch
              size="small"
              checked={showVacations}
              onChange={(e) => setShowVacations(e.target.checked)}
              color="primary"
            />
            <Typography variant="caption" sx={{ textAlign: 'center' }}>
              Urlopy
            </Typography>
          </Stack>
          <Stack direction="column" alignItems="center" justifyContent="center">
            <Switch
              size="small"
              checked={showDates}
              onChange={(e) => setShowDates(e.target.checked)}
              color="primary"
            />
            <Typography variant="caption" sx={{ textAlign: 'center' }}>
              Daty
            </Typography>
          </Stack>
        </Stack>
        <Stack
          sx={{ flexGrow: 1 }}
          alignItems={'center'}
          direction={'row'}
          flexWrap={'wrap'}
          justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
        >
          <Typography
            className="rounded-full border border-gray-700 px-3 py-1 font-semibold"
            sx={{
              display: {
                xs: 'none',
                sm: 'block',
              },
            }}
          >
            {dayjs(fromWeek).format('DD.MM.YYYY')} -{' '}
            {dayjs(toWeek).add(6, 'day').format('DD.MM.YYYY')}
          </Typography>
        </Stack>
      </Stack>

      {activeTable.type === 0 && (
        <Stack
          direction={'row'}
          sx={{
            mb: 1,
            display: {
              xs: 'flex',
              sm: 'none',
            },
          }}
        >
          <IconButton
            size="small"
            className="rounded-l-lg rounded-r-none border text-blue-600"
            onClick={() => {
              const prevWeek = dayjs(fromWeek)
                .subtract(1, 'week')
                .startOf('week')
                .toDate();
              if (!toWeek || !dayjs(prevWeek).isAfter(dayjs(toWeek))) {
                setFromWeek(prevWeek);
              }
            }}
          >
            <ChevronLeft />
          </IconButton>
          <Button
            variant="outlined"
            className="rounded-none border-x-0 border-blue-600 text-blue-600"
            sx={{
              flexGrow: 1,
            }}
            onClick={() => {
              const currentWeek = dayjs().startOf('week').toDate();
              setFromWeek(currentWeek);
              if (dayjs(currentWeek).isAfter(dayjs(toWeek))) {
                setToWeek(currentWeek);
              }
            }}
          >
            Bierzący tydzień
          </Button>
          <IconButton
            size="small"
            className="rounded-l-none rounded-r-lg border text-blue-600"
            onClick={() => {
              const nextWeek = dayjs(fromWeek)
                .add(1, 'week')
                .startOf('week')
                .toDate();
              if (dayjs(nextWeek).isAfter(dayjs(toWeek))) {
                setToWeek(nextWeek);
              }
              setFromWeek(nextWeek);
            }}
          >
            <ChevronRight />
          </IconButton>
        </Stack>
      )}
    </>
  );
};

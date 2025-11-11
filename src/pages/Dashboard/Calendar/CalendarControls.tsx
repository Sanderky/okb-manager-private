import React from 'react';
import {
  Stack,
  Typography,
  IconButton,
  Badge,
  Button,
  Tooltip,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { Dayjs } from 'dayjs';
import type { Employee } from '../../../types';

interface CalendarControlsProps {
  currentMonth: Dayjs;
  selectedEmployees: Employee[];
  setIsFilterOpen: (open: boolean) => void;
  handleMonthChange: (action: 'prev' | 'next' | 'today') => void;
  handleDatePickerChange: (value: Dayjs | null) => void;
}

export const CalendarControls: React.FC<CalendarControlsProps> = ({
  currentMonth,
  selectedEmployees,
  setIsFilterOpen,
  handleMonthChange,
  handleDatePickerChange,
}) => {
  return (
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
      <Stack direction={'row'}>
        <IconButton
          size="small"
          className="rounded-l-lg rounded-r-none border text-blue-600"
          onClick={() => handleMonthChange('prev')}
        >
          <ChevronLeft />
        </IconButton>
        <Button
          variant="outlined"
          className="rounded-none border-x-0 border-blue-600 text-blue-600"
          onClick={() => handleMonthChange('today')}
        >
          Dziś
        </Button>
        <IconButton
          size="small"
          className="rounded-l-none rounded-r-lg border text-blue-600"
          onClick={() => handleMonthChange('next')}
        >
          <ChevronRight />
        </IconButton>
      </Stack>

      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
        <DatePicker
          openTo="month"
          views={['year', 'month']}
          // slotProps={{
          //   textField: { size: 'small' },
          // }}
          sx={{
            minWidth: 200,
            '& .MuiPickersSectionList-root': {
              padding: '7px 0',
              width: 'auto',
            },
            '&:hover .MuiPickersOutlinedInput-notchedOutline': {
              borderColor: '#1976d2 !important',
            },
            '& .MuiPickersOutlinedInput-notchedOutline': {
              borderColor: '#1976d2',
            },
            '& .MuiPickersInputBase-root': {
              color: '#1976d2',
              fontWeight: 500,
            },
            '& .MuiButtonBase-root': {
              color: '#1976d2',
            },
          }}
          value={currentMonth}
          onChange={handleDatePickerChange}
        />
      </LocalizationProvider>
      <Tooltip title="Filtry">
        <Badge badgeContent={selectedEmployees.length} color="primary">
          <IconButton
            size="small"
            className="rounded-lg border text-blue-500"
            onClick={() => setIsFilterOpen(true)}
          >
            <FilterListIcon />
          </IconButton>
        </Badge>
      </Tooltip>

      {/* <Stack
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
                  {dayjs(fromWeek).format('DD.MM.YY')} -{' '}
                  {dayjs(toWeek).add(6, 'day').format('DD.MM.YY')}
                </Typography>
              </Stack> */}

      <Stack
        sx={{ flexGrow: 1 }}
        alignItems={'center'}
        direction={'row'}
        flexWrap={'wrap'}
        justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
      >
        <Typography
          textTransform={'capitalize'}
          className="rounded-full border border-gray-700 px-3 py-1 font-semibold"
        >
          {currentMonth.format('MMMM YYYY')}
        </Typography>
      </Stack>
    </Stack>
  );
};

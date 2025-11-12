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
        <Tooltip title={'Poprzedni miesiąc'}>
          <IconButton
            size="small"
            className="rounded-l-lg rounded-r-none border"
            color="primary"
            onClick={() => handleMonthChange('prev')}
            sx={(theme) => ({
              borderColor: theme.palette.primary.light,
              '&:hover': {
                borderColor: theme.palette.primary.main,
              },
            })}
          >
            <ChevronLeft />
          </IconButton>
        </Tooltip>
        <Tooltip title={'Obecy miesiąc'}>
          <Button
            variant="outlined"
            className="rounded-none border-x-0"
            color="primary"
            onClick={() => handleMonthChange('today')}
            sx={(theme) => ({
              borderColor: theme.palette.primary.light,
              '&:hover': {
                borderColor: theme.palette.primary.main,
              },
            })}
          >
            Dziś
          </Button>
        </Tooltip>
        <Tooltip title={'Następny miesiąc'}>
          <IconButton
            size="small"
            color="primary"
            className="rounded-l-none rounded-r-lg border"
            onClick={() => handleMonthChange('next')}
            sx={(theme) => ({
              borderColor: theme.palette.primary.light,
              '&:hover': {
                borderColor: theme.palette.primary.main,
              },
            })}
          >
            <ChevronRight />
          </IconButton>
        </Tooltip>
      </Stack>

      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
        <DatePicker
          openTo="month"
          views={['year', 'month']}
          sx={(theme) => ({
            minWidth: 200,
            '& .MuiPickersSectionList-root': {
              padding: '7px 0',
              width: 'auto',
            },
            '&:hover .MuiPickersOutlinedInput-notchedOutline': {
              borderColor: `${theme.palette.primary.main} !important`,
            },
            '& .MuiPickersOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.light,
            },
            '& .MuiPickersInputBase-root': {
              color: theme.palette.primary.main,
              fontWeight: 500,
            },
            '& .MuiButtonBase-root': {
              color: theme.palette.primary.main,
            },
          })}
          value={currentMonth}
          onChange={handleDatePickerChange}
        />
      </LocalizationProvider>
      <Tooltip title="Filtry">
        <Badge badgeContent={selectedEmployees.length} color="primary">
          <IconButton
            size="small"
            color="primary"
            className="rounded-lg border"
            onClick={() => setIsFilterOpen(true)}
            sx={(theme) => ({
              borderColor: theme.palette.primary.light,
              '&:hover': {
                borderColor: theme.palette.primary.main,
              },
            })}
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

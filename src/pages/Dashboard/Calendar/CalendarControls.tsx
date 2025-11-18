import React from 'react';
import {
  Stack,
  Typography,
  IconButton,
  Badge,
  Button,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { ChevronLeft, ChevronRight, MoreHoriz } from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { Dayjs } from 'dayjs';
import type { Employee } from '../../../types';
import { plPL } from '@mui/x-date-pickers/locales';

interface CalendarControlsProps {
  currentMonth: Dayjs;
  selectedEmployees: Employee[];
  setIsFilterOpen: (open: boolean) => void;
  handleMonthChange: (action: 'prev' | 'next' | 'today') => void;
  handleDatePickerChange: (value: Dayjs | null) => void;
  containerWidth: number;
}

export const CalendarControls: React.FC<CalendarControlsProps> = ({
  currentMonth,
  selectedEmployees,
  setIsFilterOpen,
  handleMonthChange,
  handleDatePickerChange,
  containerWidth,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const openMobileMenu = Boolean(anchorEl);
  const handleClickMobileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMobileMenu = () => {
    setAnchorEl(null);
  };

  const phone = (
    <Stack
      direction={'column'}
      gap={2}
      mb={1}
      width={'100%'}
      className={
        'border-lightGray rounded-lg border bg-gray-50 px-3 py-3 md:py-2'
      }
    >
      <Stack
        sx={{ flexGrow: 1 }}
        alignItems={'center'}
        direction={'row'}
        flexWrap={'wrap'}
        justifyContent={'space-between'}
      >
        <Typography
          textTransform={'capitalize'}
          className="rounded-full border border-gray-700 px-3 py-1 font-semibold"
        >
          {currentMonth.format('MMMM YYYY')}
        </Typography>
        <IconButton onClick={handleClickMobileMenu}>
          <MoreHoriz />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={openMobileMenu}
          onClose={handleCloseMobileMenu}
        >
          <MenuItem
            disableRipple
            key={'filters'}
            onClick={() => {
              setIsFilterOpen(true);
            }}
          >
            <Badge
              badgeContent={selectedEmployees.length}
              color="primary"
              sx={{ width: '100%' }}
            >
              <Button
                startIcon={<FilterListIcon />}
                size="small"
                fullWidth
                color="primary"
                className="rounded-lg border"
                onClick={() => {
                  setIsFilterOpen(true);
                }}
                sx={(theme) => ({
                  borderColor: theme.palette.primary.light,
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                  },
                })}
              >
                Filtry
              </Button>
            </Badge>
          </MenuItem>
          <MenuItem disableRipple key={'datePicker'}>
            <LocalizationProvider
              localeText={
                plPL.components.MuiLocalizationProvider.defaultProps.localeText
              }
              dateAdapter={AdapterDayjs}
              adapterLocale="pl"
            >
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
          </MenuItem>
        </Menu>
      </Stack>

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
              flexGrow: 1,
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
    </Stack>
  );

  const desktop = (
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

      <LocalizationProvider
        localeText={
          plPL.components.MuiLocalizationProvider.defaultProps.localeText
        }
        dateAdapter={AdapterDayjs}
        adapterLocale="pl"
      >
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

  return containerWidth < 600 ? phone : desktop;
};

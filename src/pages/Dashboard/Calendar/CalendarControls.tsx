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
import { plPL } from '@mui/x-date-pickers/locales';

interface CalendarControlsProps {
  currentMonth: Dayjs;
  setIsFilterOpen: (open: boolean) => void;
  handleMonthChange: (action: 'prev' | 'next' | 'today') => void;
  handleDatePickerChange: (value: Dayjs | null) => void;
  containerWidth: number;
  showFilterBadge: boolean;
}

export const CalendarControls: React.FC<CalendarControlsProps> = ({
  currentMonth,
  setIsFilterOpen,
  handleMonthChange,
  handleDatePickerChange,
  containerWidth,
  showFilterBadge,
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
      direction={'row'}
      justifyContent={'space-between'}
      alignItems={'center'}
      gap={1}
      mb={1}
      width={'100%'}
      sx={(theme) => ({
        p: 1,
        background: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`
      })}
    >


      <Stack direction={'row'} gap={1}>

        <Typography
          textTransform={'capitalize'}

          className="rounded-full border border-gray-700 px-3 py-1 font-semibold"
          sx={{
            fontSize: '0.8rem'
          }}
        >
          {currentMonth.format('MMMM YYYY')}
        </Typography>


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
              <ChevronLeft fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={'Obecy miesiąc'}>
            <Button
              variant="outlined"
              className="rounded-none border-x-0"
              color="primary"
              size="small"
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
            {/* <IconButton
            // className="rounded-none border-x-0"
            className=" rounded-none border border-x-0"

            color="primary"
            size="small"
            onClick={() => handleMonthChange('today')}
            sx={(theme) => ({
              borderColor: theme.palette.primary.light,
              flexGrow: 1,
              '&:hover': {
                borderColor: theme.palette.primary.main,
              },
            })}
          >
            <ExpandMore fontSize="small" />
          </IconButton> */}
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
              <ChevronRight fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>


      <IconButton onClick={handleClickMobileMenu}>
        <MoreHoriz />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={openMobileMenu}
        onClose={handleCloseMobileMenu}
        slotProps={{
          list: {
            'aria-labelledby': 'long-button',
          },
          paper: {
            sx: {
              minWidth: '200px',
            },
          },
        }}
      >
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
              slotProps={{
                textField: {
                  size: 'small',
                },
              }}
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
                  borderRadius: '8px',
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
        <MenuItem
          disableRipple
          key={'filters'}
          onClick={() => {
            setIsFilterOpen(true);
          }}
        >
          <Badge
            badgeContent={showFilterBadge ? 1 : 0}
            variant="dot"
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
            >
              Filtry
            </Button>
          </Badge>
        </MenuItem>
      </Menu>


      {/* <Stack direction={'row'}>
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
            <ChevronLeft fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={'Obecy miesiąc'}>
          <Button
            variant="outlined"
            className="rounded-none border-x-0"
            color="primary"
            size="small"
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
            <ChevronRight fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack> */}
    </Stack>
  );

  const desktop = (
    <Stack
      alignItems={'center'}
      direction={'row'}
      flexWrap={'wrap'}
      justifyContent={'flex-start'}
      gap={1}
      width={'100%'}
      sx={(theme) => ({
        p: 1,
        background: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`
      })}
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
            <ChevronLeft fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={'Obecy miesiąc'}>
          <Button
            variant="outlined"
            size="small"
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
            <ChevronRight fontSize="small" />
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
          slotProps={{
            textField: {
              size: 'small',
            },
          }}
          sx={(theme) => ({
            minWidth: 200,
            '& .MuiIconButton-root': {
              p: 1,
            },
            '& .MuiPickersSectionList-root': {
              // padding: '7px 0',
              padding: '0',
              width: 'auto',
            },
            '&:hover .MuiPickersOutlinedInput-notchedOutline': {
              borderColor: `${theme.palette.primary.main} !important`,
            },
            '& .MuiPickersOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.light,
            },
            '& .MuiPickersInputBase-root': {
              borderRadius: '8px',
              color: theme.palette.primary.main,
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
        <Badge
          badgeContent={showFilterBadge ? 1 : 0}
          variant="dot"
          color="primary"
        >
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
            <FilterListIcon fontSize="small" />
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

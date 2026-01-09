import React, { useState } from 'react';
import {
  Stack,
  Typography,
  IconButton,
  Button,
  Tooltip,
  Menu,
  MenuItem,
  Badge,
  Popover,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  FilterList,
  MoreHoriz,
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { Dayjs } from 'dayjs';
import { plPL } from '@mui/x-date-pickers/locales';
import { AVAILABLE_CATEGORIES, getCategoryLabel } from './CalendarHelpers';
import type { EventCategory } from '../../../types';

interface CalendarControlsProps {
  currentMonth: Dayjs;
  handleMonthChange: (action: 'prev' | 'next' | 'today') => void;
  handleDatePickerChange: (value: Dayjs | null) => void;
  containerWidth: number;
  selectedCategories: EventCategory[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<EventCategory[]>>;
}

export const CalendarControls: React.FC<CalendarControlsProps> = ({
  currentMonth,
  handleMonthChange,
  handleDatePickerChange,
  containerWidth,
  selectedCategories,
  setSelectedCategories,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const openMobileMenu = Boolean(anchorEl);
  const handleClickMobileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMobileMenu = () => {
    setAnchorEl(null);
  };

  const [anchorElFilters, setAnchorElFilters] =
    useState<HTMLButtonElement | null>(null);

  const handleOpenPopover = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorElFilters(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorElFilters(null);
  };

  const popoverOpen = Boolean(anchorElFilters);
  const popoverId = popoverOpen ? 'simple-popover' : undefined;

  const handleFilterChange = (category: EventCategory) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((s) => s !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const isFiltered = selectedCategories.length < AVAILABLE_CATEGORIES.length;

  const filtersContent = (
    <Popover
      id={popoverId}
      open={popoverOpen}
      anchorEl={anchorElFilters}
      onClose={handleClosePopover}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
    >
      <FormGroup sx={{ p: 2 }}>
        <Typography
          variant="caption"
          color="textSecondary"
          sx={{ mb: 1, display: 'block' }}
        >
          Pokaż typy wydarzeń:
        </Typography>
        {AVAILABLE_CATEGORIES.map((sev) => (
          <FormControlLabel
            key={sev}
            control={
              <Checkbox
                checked={selectedCategories.includes(sev)}
                onChange={() => handleFilterChange(sev)}
                size="small"
              />
            }
            label={
              <Typography variant="body2">{getCategoryLabel(sev)}</Typography>
            }
          />
        ))}
      </FormGroup>
    </Popover>
  );

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
        borderBottom: `1px solid ${theme.palette.divider}`,
      })}
    >
      <Stack direction={'row'} gap={1}>
        <Typography
          textTransform={'capitalize'}
          className="rounded-full border px-3 py-1 font-semibold"
          sx={{
            fontSize: '0.8rem',
            borderColor: 'text.primary',
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

        <MenuItem>
          <Badge
            color="primary"
            variant="dot"
            badgeContent={isFiltered ? 1 : 0}
            sx={{width: '100%'}}
          >
            <Button
              startIcon={<FilterList />}
              size="small"
              fullWidth
              color="primary"
              className="rounded-lg border"
              aria-describedby={popoverId}
              onClick={handleOpenPopover}
            >
              Filtry
            </Button>
          </Badge>
          {filtersContent}
        </MenuItem>
      </Menu>
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
        borderBottom: `1px solid ${theme.palette.divider}`,
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
        <Badge badgeContent={isFiltered ? 1 : 0} variant="dot" color="primary">
          <IconButton
            size="small"
            color="primary"
            className="rounded-lg border"
            aria-describedby={popoverId}
            onClick={handleOpenPopover}
            sx={(theme) => ({
              borderColor: theme.palette.primary.light,
              '&:hover': {
                borderColor: theme.palette.primary.main,
              },
            })}
          >
            <FilterList fontSize="small" />
          </IconButton>
        </Badge>
      </Tooltip>

      {filtersContent}

      <Stack
        sx={{ flexGrow: 1 }}
        alignItems={'center'}
        direction={'row'}
        flexWrap={'wrap'}
        justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
      >
        <Typography
          textTransform={'capitalize'}
          className="rounded-full border px-3 py-1 font-semibold"
          sx={{
            borderColor: 'text.primary',
          }}
        >
          {currentMonth.format('MMMM YYYY')}
        </Typography>
      </Stack>
    </Stack>
  );

  return containerWidth < 600 ? phone : desktop;
};

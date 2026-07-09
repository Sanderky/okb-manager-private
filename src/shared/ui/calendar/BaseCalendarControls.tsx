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
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  FilterList,
  MoreHoriz,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import type { Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';

interface BaseCalendarControlsProps {
  currentMonth: Dayjs;
  handleMonthChange: (action: 'prev' | 'next' | 'today') => void;
  handleDatePickerChange: (value: Dayjs | null) => void;
  containerWidth: number;
  isFiltered: boolean;
  filtersContent: React.ReactNode;
  popoverId?: string;
  onOpenFilters: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export const BaseCalendarControls: React.FC<BaseCalendarControlsProps> = ({
  currentMonth,
  handleMonthChange,
  handleDatePickerChange,
  containerWidth,
  isFiltered,
  filtersContent,
  popoverId,
  onOpenFilters,
}) => {
  const { t, i18n } = useTranslation(['calendar', 'common']);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMobileMenu = Boolean(anchorEl);

  const handleClickMobileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMobileMenu = () => {
    setAnchorEl(null);
  };

  const phone = (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      gap={1}
      mb={1}
      width="100%"
      sx={(theme) => ({
        p: 1,
        background: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
      })}
    >
      <Stack direction="row" gap={1}>
        <Typography
          textTransform="capitalize"
          className="rounded-full border px-3 py-1 font-semibold"
          sx={{
            fontSize: '0.8rem',
            borderColor: 'text.primary',
          }}
        >
          {currentMonth.locale(i18n.language).format('MMMM YYYY')}
        </Typography>

        <Stack direction="row">
          <Tooltip title={t('calendar:controls.prevMonth')}>
            <IconButton
              size="small"
              className="rounded-l-lg rounded-r-none border"
              color="primary"
              onClick={() => handleMonthChange('prev')}
              sx={(theme) => ({
                borderColor: theme.palette.primary.light,
                '&:hover': { borderColor: theme.palette.primary.main },
              })}
            >
              <ChevronLeft fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('calendar:controls.currentMonth')}>
            <Button
              variant="outlined"
              className="rounded-none border-x-0"
              color="primary"
              size="small"
              onClick={() => handleMonthChange('today')}
              sx={(theme) => ({
                borderColor: theme.palette.primary.light,
                flexGrow: 1,
                '&:hover': { borderColor: theme.palette.primary.main },
              })}
            >
              {t('common:buttons.today')}
            </Button>
          </Tooltip>
          <Tooltip title={t('calendar:controls.nextMonth')}>
            <IconButton
              size="small"
              color="primary"
              className="rounded-l-none rounded-r-lg border"
              onClick={() => handleMonthChange('next')}
              sx={(theme) => ({
                borderColor: theme.palette.primary.light,
                '&:hover': { borderColor: theme.palette.primary.main },
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
          paper: { sx: { minWidth: '200px' } },
        }}
      >
        <MenuItem disableRipple key="datePicker">
          <DatePicker
            openTo="month"
            views={['year', 'month']}
            slotProps={{ textField: { size: 'small' } }}
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
              '& .MuiButtonBase-root': { color: theme.palette.primary.main },
            })}
            value={currentMonth}
            onChange={handleDatePickerChange}
          />
        </MenuItem>

        <MenuItem>
          <Badge
            color="primary"
            variant="dot"
            badgeContent={isFiltered ? 1 : 0}
            sx={{ width: '100%' }}
          >
            <Button
              startIcon={<FilterList />}
              size="small"
              fullWidth
              color="primary"
              className="rounded-lg border"
              aria-describedby={popoverId}
              onClick={onOpenFilters}
            >
              {t('calendar:controls.filters')}
            </Button>
          </Badge>
        </MenuItem>
      </Menu>
      {filtersContent}
    </Stack>
  );

  const desktop = (
    <Stack
      alignItems="center"
      direction="row"
      flexWrap="wrap"
      justifyContent="flex-start"
      gap={1}
      width="100%"
      sx={(theme) => ({
        p: 1,
        background: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
      })}
    >
      <Stack direction="row">
        <Tooltip title={t('calendar:controls.prevMonth')}>
          <IconButton
            size="small"
            className="rounded-l-lg rounded-r-none border"
            color="primary"
            onClick={() => handleMonthChange('prev')}
            sx={(theme) => ({
              borderColor: theme.palette.primary.light,
              '&:hover': { borderColor: theme.palette.primary.main },
            })}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('calendar:controls.currentMonth')}>
          <Button
            variant="outlined"
            size="small"
            className="rounded-none border-x-0"
            color="primary"
            onClick={() => handleMonthChange('today')}
            sx={(theme) => ({
              borderColor: theme.palette.primary.light,
              '&:hover': { borderColor: theme.palette.primary.main },
            })}
          >
            {t('common:buttons.today')}
          </Button>
        </Tooltip>
        <Tooltip title={t('calendar:controls.nextMonth')}>
          <IconButton
            size="small"
            color="primary"
            className="rounded-l-none rounded-r-lg border"
            onClick={() => handleMonthChange('next')}
            sx={(theme) => ({
              borderColor: theme.palette.primary.light,
              '&:hover': { borderColor: theme.palette.primary.main },
            })}
          >
            <ChevronRight fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      <DatePicker
        openTo="month"
        views={['year', 'month']}
        slotProps={{ textField: { size: 'small' } }}
        sx={(theme) => ({
          minWidth: 200,
          '& .MuiIconButton-root': { p: 1 },
          '& .MuiPickersSectionList-root': { padding: '0', width: 'auto' },
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
          '& .MuiButtonBase-root': { color: theme.palette.primary.main },
        })}
        value={currentMonth}
        onChange={handleDatePickerChange}
      />

      <Tooltip title={t('calendar:controls.filters')}>
        <Badge badgeContent={isFiltered ? 1 : 0} variant="dot" color="primary">
          <IconButton
            size="small"
            color="primary"
            className="rounded-lg border"
            aria-describedby={popoverId}
            onClick={onOpenFilters}
            sx={(theme) => ({
              borderColor: theme.palette.primary.light,
              '&:hover': { borderColor: theme.palette.primary.main },
            })}
          >
            <FilterList fontSize="small" />
          </IconButton>
        </Badge>
      </Tooltip>

      {filtersContent}

      <Stack
        sx={{ flexGrow: 1 }}
        alignItems="center"
        direction="row"
        flexWrap="wrap"
        justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
      >
        <Typography
          textTransform="capitalize"
          className="rounded-full border px-3 py-1 font-semibold"
          sx={{ borderColor: 'text.primary' }}
        >
          {currentMonth.locale(i18n.language).format('MMMM YYYY')}
        </Typography>
      </Stack>
    </Stack>
  );

  return containerWidth < 600 ? phone : desktop;
};

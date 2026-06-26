import React from 'react';
import {
  Stack,
  Typography,
  IconButton,
  Badge,
  Switch,
  Button,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { ChevronLeft, ChevronRight, MoreHoriz } from '@mui/icons-material';
import WeekSelector from '@/shared/ui/WeekSelector';
import dayjs from 'dayjs';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import { useTranslation } from 'react-i18next';

interface TableControlsProps {
  fromWeek: Date;
  toWeek: Date;
  setFromWeek: (date: Date) => void;
  setToWeek: (date: Date) => void;
  setIsFilterOpen: (open: boolean) => void;
  showVacations: boolean;
  setShowVacations: (show: boolean) => void;
  showDates: boolean;
  setShowDates: (show: boolean) => void;
  activeTable: { type: number; week: dayjs.Dayjs };
  containerWidth: number;
  showFilterBadge: boolean;
}

export const TableControls: React.FC<TableControlsProps> = ({
  fromWeek,
  toWeek,
  setFromWeek,
  setToWeek,
  setIsFilterOpen,
  showDates,
  setShowDates,
  activeTable,
  containerWidth,
  showFilterBadge,
}) => {
  const { t } = useTranslation(['schedule', 'common']);
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
      gap={1}
      width={'100%'}
      sx={(theme) => ({
        p: 1,
        background: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
      })}
    >
      <Stack direction={'row'} alignItems={'center'} gap={1}>
        <Typography
          className="0 rounded-full border px-3 py-1 font-semibold"
          sx={{
            fontSize: '0.8rem',
            borderColor: 'text.primary',
          }}
        >
          {dayjs(fromWeek).format('DD.MM.YY')} -{' '}
          {dayjs(toWeek).add(6, 'day').format('DD.MM.YY')}
        </Typography>

        {activeTable.type === 0 && (
          <Stack direction={'row'}>
            <IconButton
              size="small"
              color="primary"
              className="rounded-l-lg rounded-r-none border"
              sx={(theme) => ({
                borderColor: theme.palette.primary.light,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                },
              })}
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
              <ChevronLeft fontSize="small" />
            </IconButton>
            <Button
              size="small"
              variant="outlined"
              className="rounded-none border-x-0"
              sx={(theme) => ({
                flexGrow: 1,
                borderColor: theme.palette.primary.light,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                },
              })}
              onClick={() => {
                const currentWeek = dayjs().startOf('week').toDate();
                setFromWeek(currentWeek);
                if (dayjs(currentWeek).isAfter(dayjs(toWeek))) {
                  setToWeek(currentWeek);
                }
              }}
            >
              {t('common:buttons.today')}
            </Button>
            <IconButton
              color="primary"
              size="small"
              className="rounded-l-none rounded-r-lg border"
              sx={(theme) => ({
                borderColor: theme.palette.primary.light,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                },
              })}
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
              <ChevronRight fontSize="small" />
            </IconButton>
          </Stack>
        )}
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
            sx: { minWidth: '200px' },
          },
        }}
      >
        <MenuItem disableRipple key={'weekFrom'}>
          <Stack>
            <Typography sx={{ mr: 1 }}>
              {t('schedule:controls.from')}{' '}
            </Typography>
            <WeekSelector
              value={fromWeek}
              onChange={(val) => {
                if (!val) return;
                if (toWeek && dayjs(val).isAfter(toWeek, 'week')) return;
                setFromWeek(val);
              }}
              comparisonDate={toWeek}
            />
          </Stack>
        </MenuItem>
        <MenuItem disableRipple key={'weekTo'}>
          <Stack>
            <Typography sx={{ mr: 1 }}>{t('schedule:controls.to')} </Typography>
            <WeekSelector
              value={toWeek}
              onChange={(val) => {
                if (!val) return;
                if (fromWeek && dayjs(val).isBefore(fromWeek, 'week')) return;
                setToWeek(val);
              }}
              comparisonDate={fromWeek}
            />
          </Stack>
        </MenuItem>
        <Divider />
        <MenuItem disableRipple key={'dates'}>
          <Stack direction="row" alignItems="center" justifyContent="center">
            <Typography sx={{ textAlign: 'center' }}>
              {t('schedule:controls.dates')}
            </Typography>
            <Tooltip title={t('schedule:controls.hideDatesTooltip')}>
              <Switch
                size="small"
                checked={showDates}
                onChange={(e) => setShowDates(e.target.checked)}
                color="primary"
              />
            </Tooltip>
          </Stack>
        </MenuItem>
        <MenuItem disableRipple key={'filters'}>
          <Badge
            badgeContent={showFilterBadge ? ' ' : 0}
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
              onClick={() => setIsFilterOpen(true)}
              sx={(theme) => ({
                borderColor: theme.palette.primary.light,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                },
              })}
            >
              {t('schedule:controls.filters')}
            </Button>
          </Badge>
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
      <Stack alignItems={'center'} direction={'row'} flexWrap={'wrap'} gap={2}>
        <WeekSelector
          value={fromWeek}
          onChange={(val) => {
            if (!val) return;
            if (toWeek && dayjs(val).isAfter(toWeek, 'week')) return;
            setFromWeek(val);
          }}
          comparisonDate={toWeek}
        />
        <Typography>-</Typography>
        <WeekSelector
          value={toWeek}
          onChange={(val) => {
            if (!val) return;
            if (fromWeek && dayjs(val).isBefore(fromWeek, 'week')) return;
            setToWeek(val);
          }}
          comparisonDate={fromWeek}
        />
      </Stack>
      <Tooltip title={t('schedule:controls.filters')}>
        <Badge
          badgeContent={showFilterBadge ? 1 : 0}
          color="primary"
          variant="dot"
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
      <Stack direction={'row'} spacing={1}>
        <Stack
          direction="row"
          gap={0.5}
          alignItems="center"
          justifyContent="center"
        >
          <Typography variant="caption" sx={{ textAlign: 'center' }}>
            {t('schedule:controls.dates')}
          </Typography>
          <Tooltip title={t('schedule:controls.hideDatesTooltip')}>
            <Switch
              size="small"
              checked={showDates}
              onChange={(e) => setShowDates(e.target.checked)}
              color="primary"
            />
          </Tooltip>
        </Stack>
      </Stack>
      <Stack
        sx={{ flexGrow: 1 }}
        alignItems={'center'}
        direction={'row'}
        flexWrap={'wrap'}
        spacing={1}
        justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
      >
        <Typography
          className="rounded-full border px-3 py-1 font-semibold"
          sx={{
            display: { xs: 'none', sm: 'block' },
            borderColor: 'text.primary',
          }}
        >
          {dayjs(fromWeek).format('DD.MM.YYYY')} -{' '}
          {dayjs(toWeek).add(6, 'day').format('DD.MM.YYYY')}
        </Typography>
        <Tooltip
          title={t('schedule:controls.weekClickTooltip')}
          placement="top"
          slotProps={{
            popper: {
              sx: { cursor: 'pointer' },
              modifiers: [{ name: 'offset', options: { offset: [0, -14] } }],
            },
          }}
        >
          <InfoOutlineIcon />
        </Tooltip>
      </Stack>
    </Stack>
  );

  return containerWidth < 600 ? phone : desktop;
};

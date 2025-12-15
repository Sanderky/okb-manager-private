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
import WeekSelector from '../../../components/WeekSelector';
import dayjs from 'dayjs';

import InfoOutlineIcon from '@mui/icons-material/InfoOutline';

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
  // showVacations,
  // setShowVacations,
  showDates,
  setShowDates,
  activeTable,
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
      direction={'column'}
      flexWrap={'wrap'}
      gap={1}
      mb={1}
      width={'100%'}
      className={'border-lightGray rounded-lg border bg-white'}
      sx={{
        p: 1,
      }}
    >
      <Stack
        sx={{ flexGrow: 1 }}
        alignItems={'center'}
        direction={'row'}
        justifyContent={'space-between'}
      >
        <Stack direction={'row'} alignItems={'center'} spacing={1}>
          <Typography className="rounded-full border border-gray-700 px-3 py-1 font-semibold">
            {dayjs(fromWeek).format('DD.MM.YYYY')} -{' '}
            {dayjs(toWeek).add(6, 'day').format('DD.MM.YYYY')}
          </Typography>
          <Tooltip
            title="Kliknij w datę tygodnia w nagłówku tabeli, aby wyświetlić szczegółowy widok tego tygodnia."
            placement="top"
            slotProps={{
              popper: {
                sx: {
                  cursor: 'pointer',
                },
                modifiers: [
                  {
                    name: 'offset',
                    options: {
                      offset: [0, -14],
                    },
                  },
                ],
              },
            }}
          >
            <InfoOutlineIcon />
          </Tooltip>
        </Stack>
        <IconButton onClick={handleClickMobileMenu}>
          <MoreHoriz />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={openMobileMenu}
          onClose={handleCloseMobileMenu}
        >
          <MenuItem disableRipple key={'weekFrom'}>
            <Stack>
              <Typography sx={{ mr: 1 }}>Od: </Typography>
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
            </Stack>
          </MenuItem>
          <MenuItem disableRipple key={'weekTo'}>
            <Stack>
              <Typography sx={{ mr: 1 }}>Do: </Typography>
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
          </MenuItem>
          <Divider />
          {/* <MenuItem disableRipple key={'vacations'}>
            <Stack direction="row" alignItems="center" justifyContent="center">
              <Typography sx={{ textAlign: 'center' }}>Urlopy</Typography>
              <Tooltip title="Ukrywanie informacji o urlopach">
                <Switch
                  size="small"
                  checked={showVacations}
                  onChange={(e) => setShowVacations(e.target.checked)}
                  color="primary"
                />
              </Tooltip>
            </Stack>
          </MenuItem> */}
          <MenuItem disableRipple key={'dates'}>
            <Stack direction="row" alignItems="center" justifyContent="center">
              <Typography sx={{ textAlign: 'center' }}>Daty</Typography>
              <Tooltip title="Ukrywanie szczegółowych dat">
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
        </Menu>
      </Stack>

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
            <ChevronLeft />
          </IconButton>
          <Button
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
            Bieżący tydzień
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
            <ChevronRight />
          </IconButton>
        </Stack>
      )}
    </Stack>
  );

  const desktop = (
    <Stack
      alignItems={'center'}
      direction={'row'}
      flexWrap={'wrap'}
      justifyContent={'flex-start'}
      gap={1}
      mb={1}
      width={'100%'}
      className={'border-lightGray rounded-lg border bg-white'}
      sx={{ p: 1 }}
    >
      <Stack alignItems={'center'} direction={'row'} flexWrap={'wrap'} gap={2}>
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
      <Tooltip title="Filtry">
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
        {/* <Stack direction="column" alignItems="center" justifyContent="center">
          <Tooltip title="Ukrywanie informacji o urlopach">
            <Switch
              size="small"
              checked={showVacations}
              onChange={(e) => setShowVacations(e.target.checked)}
              color="primary"
            />
          </Tooltip>
          <Typography variant="caption" sx={{ textAlign: 'center' }}>
            Urlopy
          </Typography>
        </Stack> */}
        <Stack
          direction="row"
          gap={0.5}
          alignItems="center"
          justifyContent="center"
        >
          <Typography variant="caption" sx={{ textAlign: 'center' }}>
            Daty
          </Typography>
          <Tooltip title="Ukrywanie szczegółowych dat">
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
        <Tooltip
          title="Kliknij w datę tygodnia w nagłówku tabeli, aby wyświetlić szczegółowy widok tego tygodnia."
          placement="top"
          slotProps={{
            popper: {
              sx: {
                cursor: 'pointer',
              },
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, -14],
                  },
                },
              ],
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

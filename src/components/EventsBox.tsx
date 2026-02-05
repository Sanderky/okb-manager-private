import {
  alpha,
  Badge,
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
  IconButton,
  List,
  ListItem,
  Popover,
  Stack,
  TableBody,
  TableRow,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { useScroll } from '../context/ScrollContext';
import {
  Done,
  ExpandLess,
  ExpandMore,
  FilterList,
  Notifications,
} from '@mui/icons-material';
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Loading from '../shared/ui/Loading';
import { useEventColor } from '../features/calendar/hooks/useEventColor';
import type { EventCategory, InfoEvent } from '../types';
import {
  AVAILABLE_CATEGORIES,
  getCategoryLabel,
} from '../features/calendar/utils';
import { getDateStr } from '../pages/Dashboard/Vacations/VacationsHelpers';

const EVENTS_FILTER_STORAGE_KEY = 'eventsBox_filters';

interface EventsBoxProps {
  events: InfoEvent[];
  type?: 'all' | 'employee' | 'construction';
  isLoading?: boolean;
}

export const useUpcomingEvents = ({
  type = 'all',
  events: upcomingEvents,
}: EventsBoxProps) => {
  const navigate = useNavigate();
  const { scrollToTop: scrollToTopFn } = useScroll();

  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>(
    () => {
      try {
        const saved = localStorage.getItem(EVENTS_FILTER_STORAGE_KEY);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (error) {
        console.error('Błąd odczytu filtrów z localStorage', error);
      }
      return AVAILABLE_CATEGORIES;
    }
  );

  useEffect(() => {
    localStorage.setItem(
      EVENTS_FILTER_STORAGE_KEY,
      JSON.stringify(selectedCategories)
    );
  }, [selectedCategories]);

  const handleFilterChange = (category: EventCategory) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const filteredEvents = useMemo(() => {
    return upcomingEvents.filter((event) =>
      selectedCategories.includes(event.category)
    );
  }, [upcomingEvents, selectedCategories]);

  const getTitle = () => {
    if (type === 'construction') return 'Wydarzenia na budowie';
    if (type === 'employee') return 'Wydarzenia pracownika';
    return 'Nadchodzące wydarzenia';
  };

  const filtersActive =
    selectedCategories.length !== AVAILABLE_CATEGORIES.length;

  const handleEventClick = (event: InfoEvent, scrollToTop = false) => {
    const startMonth = dayjs(event.startDate).format('YYYY-MM');
    navigate(`/calendar?month=${startMonth}&eventId=${event.id}`);
    if (scrollToTop) scrollToTopFn();
  };

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleOpenPopover = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const popoverOpen = Boolean(anchorEl);
  const popoverId = popoverOpen ? 'simple-popover' : undefined;

  const renderFilters = (
    <>
      <Badge color="primary" variant="dot" badgeContent={filtersActive ? 1 : 0}>
        <IconButton
          aria-describedby={popoverId}
          onClick={handleOpenPopover}
          sx={{ p: 0.5 }}
        >
          <FilterList fontSize="small" />
        </IconButton>
      </Badge>
      <Popover
        id={popoverId}
        open={popoverOpen}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <FormGroup
          sx={{
            p: 1,
          }}
        >
          {AVAILABLE_CATEGORIES.map((cat) => (
            <FormControlLabel
              key={cat}
              control={
                <Checkbox
                  checked={selectedCategories.includes(cat)}
                  onChange={() => handleFilterChange(cat)}
                  size="small"
                />
              }
              label={
                <Typography variant="body2">{getCategoryLabel(cat)}</Typography>
              }
            />
          ))}
        </FormGroup>
      </Popover>
    </>
  );

  return {
    handleEventClick,
    getTitle,
    filteredEvents,
    renderFilters,
  };
};

export const EventsBox = ({
  events,
  isLoading,
  type = 'all',
}: EventsBoxProps) => {
  const { filteredEvents, handleEventClick, getTitle, renderFilters } =
    useUpcomingEvents({ type, events });
  const [isExpanded, setIsExpanded] = useState(false);

  const MAX_VISIBLE_ITEMS = 2;
  const hasMoreItems = filteredEvents.length > MAX_VISIBLE_ITEMS;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const { getEventColor, getEventTextColor } = useEventColor();

  return (
    <Box>
      <Stack
        direction={'row'}
        alignItems={'center'}
        justifyContent={'space-between'}
        spacing={1}
        sx={{
          mb: 1,
        }}
      >
        <Stack direction={'row'} alignItems={'center'} spacing={1}>
          <Notifications
            sx={{
              color: 'primary.main',
            }}
          />
          <Typography variant="body1" className="font-medium">
            {getTitle()}
          </Typography>
          {hasMoreItems && (
            <Chip
              label={`${filteredEvents.length} ${filteredEvents.length > 4 ? 'wydarzeń' : 'wydarzenia'}`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          )}
        </Stack>

        {renderFilters}
      </Stack>
      {isLoading ? (
        <Stack direction={'row'} spacing={1} className="my-5">
          <Loading size={25} message="" />
        </Stack>
      ) : (
        <Box
          sx={(theme) => ({
            position: 'relative',
            '&:after': {
              content: '""',
              pointerEvents: 'none',
              display: isExpanded && !isLoading ? 'none' : 'block',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: 'calc(100% - 34px)',
              boxShadow: hasMoreItems ? `inset 0px -25px 10px -15px ${alpha(theme.palette.background.paper, 1)}` : 'none',
            },
          })}
        >
          <Box
            sx={{
              maxHeight: isExpanded ? 'none' : 176,
              overflow: 'auto',
              position: 'relative',
            }}
          >
            <List className="mb-2">
              {filteredEvents.length === 0 ? (
                <Stack direction={'row'} spacing={1}>
                  <Done />
                  <Typography color={'textSecondary'}>
                    Brak nadchodzących wydarzeń
                  </Typography>
                </Stack>
              ) : (
                filteredEvents.map((event) => (
                  <ListItem
                    key={event.groupId}
                    onClick={() => handleEventClick(event, true)}
                    sx={(theme) => ({
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      alignItems: 'flex-start',
                      mb: 1,
                      border: `1px solid ${theme.palette.divider}`,
                      background: theme.palette.accent.light,
                      ':hover': {
                        background: theme.palette.accent.main,
                      },
                    })}
                    className={`rounded-md last:mb-0`}
                  >
                    <Stack
                      direction={'row'}
                      justifyContent={'space-between'}
                      width={'100%'}
                      alignItems={'center'}
                    >
                      <Typography variant="subtitle2">{event.title}</Typography>
                      <Chip
                        label={getCategoryLabel(event.category)}
                        variant="filled"
                        sx={{
                          color: getEventTextColor(event.color),
                          backgroundColor: getEventColor(event.color),
                          minWidth: '50px',
                        }}
                        size="small"
                      />
                    </Stack>
                    <Typography variant="body2">
                      {getDateStr(event.startDate, event.endDate, true)}
                    </Typography>
                  </ListItem>
                ))
              )}
            </List>
          </Box>
          {hasMoreItems && (
            <Box sx={{ textAlign: 'center', mb: 1 }}>
              <IconButton onClick={toggleExpanded} size="small">
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export const EventsListTable = ({ type = 'all', events }: EventsBoxProps) => {
  const { filteredEvents, handleEventClick, getTitle, renderFilters } =
    useUpcomingEvents({ type, events });

  const { getEventColor, getEventTextColor } = useEventColor();

  return (
    <table className="w-full">
      <thead>
        <TableRow sx={(theme) => ({ background: theme.palette.accent.main })}>
          <th className="px-4 py-3 text-left">
            <Stack
              direction={'row'}
              alignItems={'center'}
              spacing={1}
              justifyContent={'space-between'}
            >
              <Stack direction={'row'} alignItems={'center'} spacing={1}>
                <Notifications sx={{ color: 'accent.superDark' }} />
                <Typography variant="subtitle2" fontWeight="600">
                  {`${getTitle()} (${filteredEvents.length}):`}
                </Typography>
              </Stack>

              {renderFilters}
            </Stack>
          </th>
        </TableRow>
      </thead>
      <TableBody
        sx={(theme) => ({
          '& > tr:not(:last-child) > td, & > tr:not(:last-child) > th': {
            borderBottom: `1px solid ${theme.palette.divider}`,
          },
          '& > tr:last-child > td, & > tr:last-child > th': {
            borderBottom: 'none',
          },
        })}
      >
        {filteredEvents && filteredEvents.length > 0 ? (
          filteredEvents.map((event) => {
            return (
              <TableRow
                key={event.id}
                onClick={() => handleEventClick(event)}
                className="cursor-pointer transition-colors"
                sx={(theme) => ({
                  ':hover': {
                    background: theme.palette.accent.light,
                  },
                  ':active': {
                    background: theme.palette.accent.main,
                  },
                })}
              >
                <td className="px-4 py-3">
                  <Stack direction={'column'}>
                    <Stack
                      direction={'row'}
                      alignItems={'center'}
                      justifyContent={'space-between'}
                      spacing={1}
                    >
                      <Typography
                        variant="body2"
                        className="font-medium"
                        color="textSecondary"
                      >
                        {event.title}
                      </Typography>
                      <Chip
                        label={getCategoryLabel(event.category)}
                        sx={{
                          color: getEventTextColor(event.color),
                          background: getEventColor(event.color),
                          minWidth: '50px',
                        }}
                        size="small"
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {getDateStr(event.startDate, event.endDate, true)}
                    </Typography>
                  </Stack>
                </td>
              </TableRow>
            );
          })
        ) : (
          <tr>
            <td className="px-4 py-3">
              <Typography variant="body2" color="textSecondary">
                Brak nadchodzących wydarzeń
              </Typography>
            </td>
          </tr>
        )}
      </TableBody>
    </table>
  );
};

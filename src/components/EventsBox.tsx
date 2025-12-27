import {
  Badge,
  Box,
  Checkbox,
  Chip,
  darken,
  FormControlLabel,
  FormGroup,
  IconButton,
  List,
  ListItem,
  Popover,
  Stack,
  TableBody,
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
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Loading from './Loading';
import {
  getNearestUpcomingEvents,
  getUpcomingEventsForConstruction,
  getUpcomingEventsForEmployee,
} from '../services/calendar';
import { useEventColor } from '../pages/Dashboard/Calendar/useEventColor';
import type { InfoEvent, InfoEventSeverity } from '../types';
import {
  AVAILABLE_SEVERITIES,
  getSeverityLabel,
} from '../pages/Dashboard/Calendar/CalendarHelpers';

const EVENTS_FILTER_STORAGE_KEY = 'eventsBox_filters';

interface EventsBoxProps {
  type?: 'all' | 'employee' | 'construction';
  entityId?: string;
}

const useUpcomingEvents = ({ type = 'all', entityId }: EventsBoxProps) => {
  const navigate = useNavigate();
  const { scrollToTop: scrollToTopFn } = useScroll();

  const [selectedSeverities, setSelectedSeverities] = useState<
    InfoEventSeverity[]
  >(() => {
    try {
      const saved = localStorage.getItem(EVENTS_FILTER_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Błąd odczytu filtrów z localStorage', error);
    }
    return AVAILABLE_SEVERITIES;
  });

  useEffect(() => {
    localStorage.setItem(
      EVENTS_FILTER_STORAGE_KEY,
      JSON.stringify(selectedSeverities)
    );
  }, [selectedSeverities]);

  const { data: upcomingEvents = [], isLoading } = useQuery({
    queryKey: ['calendarEvents', 'upcoming', type, entityId],
    queryFn: async () => {
      if (type === 'employee' && entityId) {
        return getUpcomingEventsForEmployee(entityId);
      }
      if (type === 'construction' && entityId) {
        return getUpcomingEventsForConstruction(entityId);
      }
      return getNearestUpcomingEvents();
    },
    enabled: type === 'all' || !!entityId,
  });

  const handleFilterChange = (severity: InfoEventSeverity) => {
    setSelectedSeverities((prev) => {
      if (prev.includes(severity)) {
        return prev.filter((s) => s !== severity);
      } else {
        return [...prev, severity];
      }
    });
  };

  const filteredEvents = useMemo(() => {
    return upcomingEvents.filter((event) =>
      selectedSeverities.includes(event.severity)
    );
  }, [upcomingEvents, selectedSeverities]);

  const getTitle = () => {
    if (type === 'construction') return 'Wydarzenia na budowie';
    if (type === 'employee') return 'Wydarzenia pracownika';
    return 'Nadchodzące wydarzenia';
  };

  const filtersActive =
    selectedSeverities.length !== AVAILABLE_SEVERITIES.length;

  const handleEventClick = (event: InfoEvent, scrollToTop = false) => {
    const startMonth = dayjs(event.startDate).format('YYYY-MM');
    navigate(`/calendar?month=${startMonth}`);
    scrollToTop && scrollToTopFn();
  };

  const getDateStr = (start: Date, end: Date) => {
    if (!start || !end) return '-';
    const startDate = dayjs(start);
    const endDate = dayjs(end);
    if (startDate.isSame(endDate)) return startDate.format('DD.MM.YYYY');
    return `${startDate.format('DD.MM.YYYY')} - ${endDate.format('DD.MM.YYYY')}`;
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
          {AVAILABLE_SEVERITIES.map((sev) => (
            <FormControlLabel
              key={sev}
              control={
                <Checkbox
                  checked={selectedSeverities.includes(sev)}
                  onChange={() => handleFilterChange(sev)}
                  size="small"
                />
              }
              label={
                <Typography variant="body2">{getSeverityLabel(sev)}</Typography>
              }
            />
          ))}
        </FormGroup>
      </Popover>
    </>
  );

  return {
    getDateStr,
    handleEventClick,
    getTitle,
    filteredEvents,
    isLoading,
    renderFilters,
  };
};

export const EventsBox = ({ type = 'all', entityId }: EventsBoxProps) => {
  const {
    filteredEvents,
    handleEventClick,
    getDateStr,
    getTitle,
    isLoading,
    renderFilters,
  } = useUpcomingEvents({ type, entityId });
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
        <Box>
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
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      alignItems: 'flex-start',
                      mb: 1,
                      background: getEventColor(event.severity),
                      color: getEventTextColor(event.severity),
                      ':hover': {
                        background: darken(getEventColor(event.severity), 0.2),
                      },
                    }}
                    className={`rounded-md last:mb-0`}
                  >
                    <Typography variant="subtitle2">{event.title}</Typography>
                    <Typography variant="body2">
                      {getDateStr(event.startDate, event.endDate)}
                    </Typography>
                  </ListItem>
                ))
              )}
            </List>
          </Box>
          {hasMoreItems && (
            <Box sx={{ textAlign: 'center', mb: 1 }}>
              <IconButton
                onClick={toggleExpanded}
                size="small"
                className="text-gray-400"
              >
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export const EventsListTable = ({ type = 'all', entityId }: EventsBoxProps) => {
  const {
    filteredEvents,
    handleEventClick,
    getDateStr,
    getTitle,
    isLoading,
    renderFilters,
  } = useUpcomingEvents({ type, entityId });

  const { getEventColor, getEventTextColor } = useEventColor();

  return (
    <table className="w-full">
      <thead>
        <tr className="bg-blue-100">
          <th className="px-4 py-3 text-left">
            <Stack
              direction={'row'}
              alignItems={'center'}
              spacing={1}
              justifyContent={'space-between'}
            >
              <Stack direction={'row'} alignItems={'center'} spacing={1}>
                <Notifications className="text-blue-800" />
                <Typography variant="subtitle2" fontWeight="600">
                  {`${getTitle()} (${filteredEvents.length}):`}
                </Typography>
              </Stack>

              {renderFilters}
            </Stack>
          </th>
        </tr>
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
              <tr
                key={event.id}
                onClick={() => handleEventClick(event)}
                className="cursor-pointer transition-colors hover:bg-blue-50 active:bg-blue-100"
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
                        className="font-medium text-gray-800"
                      >
                        {event.title}
                      </Typography>
                      <Chip
                        label={getSeverityLabel(event.severity)}
                        sx={{
                          color: getEventTextColor(event.severity),
                          background: getEventColor(event.severity),
                          minWidth: '50px',
                        }}
                        size="small"
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {getDateStr(event.startDate, event.endDate)}
                    </Typography>
                  </Stack>
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td className="px-4 py-3">
              <Typography variant="body2" className="text-gray-500">
                Brak nadchodzących wydarzeń
              </Typography>
            </td>
          </tr>
        )}
      </TableBody>
    </table>
  );
};

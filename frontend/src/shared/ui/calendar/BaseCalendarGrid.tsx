import React, { useState } from 'react';
import {
  Grid,
  Box,
  Typography,
  Link,
  useTheme,
  Stack,
  useMediaQuery,
  Divider,
} from '@mui/material';
import dayjs, { type Dayjs } from 'dayjs';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import type {
  BaseCalendarEvent,
  CalendarDay,
  GridEvent,
} from '../../model/types';

const MAX_EVENTS_DESKTOP = 4;
const MAX_EVENTS_PHONE = 2;

const MAX_EVENT_HEIGHT_DESKTOP = 20;
const MAX_EVENT_HEIGHT_PHONE = 18;

interface BaseCalendarGridProps<T extends BaseCalendarEvent> {
  monthGrid: CalendarDay<T>[][];
  currentMonth: Dayjs;
  selectDay: Dayjs | null;
  onDayClick: (day: Dayjs) => void;
  isDayInRange: (day: Dayjs) => boolean;
  onMoreClick: (data: CalendarDay<T>) => void;
  isEventHidden: (
    event: GridEvent<T>,
    slot: number,
    maxSlots: number
  ) => boolean;
  renderEventChip: (
    event: GridEvent<T>,
    options: {
      isStart: boolean;
      isEnd: boolean;
      isWeekStart: boolean;
      showName: boolean;
      height: number;
    }
  ) => React.ReactNode;
  onEventClick: (event: GridEvent<T>) => void;
}

export function BaseCalendarGrid<T extends BaseCalendarEvent>({
  monthGrid,
  currentMonth,
  selectDay,
  onDayClick,
  isDayInRange,
  onMoreClick,
  isEventHidden,
  renderEventChip,
  onEventClick,
}: BaseCalendarGridProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());

  const MAX_EVENTS = isMobile ? MAX_EVENTS_PHONE : MAX_EVENTS_DESKTOP;
  const MAX_EVENT_HEIGHT = isMobile
    ? MAX_EVENT_HEIGHT_PHONE
    : MAX_EVENT_HEIGHT_DESKTOP;

  const handleToggleExpand = (weekIndex: number) => {
    setExpandedWeeks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(weekIndex)) {
        newSet.delete(weekIndex);
      } else {
        newSet.add(weekIndex);
      }
      return newSet;
    });
  };

  return (
    <Grid
      container
      sx={(theme) => ({
        borderBottom: `1px solid ${theme.palette.divider}`,
      })}
    >
      {monthGrid.map((week, wi) =>
        week.map((calendarDay, di) => {
          const { date: day, events, slots = {} } = calendarDay;
          const isCurrentMonth = day.isSame(currentMonth, 'month');
          const isToday = day.isSame(dayjs(), 'day');
          const isSelected = isDayInRange(day);
          const isExpanded = expandedWeeks.has(wi);

          const getSlot = (ev: T) => slots[ev.id] ?? 0;

          const getDayBoxHeight = () => {
            const baseHeight = MAX_EVENTS * 24 + 23;
            if (!isExpanded) return baseHeight;

            const maxSlot = events.reduce((max, ev) => {
              return Math.max(max, getSlot(ev));
            }, 0);

            const requiredSlots = Math.max(maxSlot + 1, MAX_EVENTS);
            return requiredSlots * 24 + 23;
          };

          const hasHiddenEvents = events.some((ev) =>
            isEventHidden(ev, getSlot(ev), MAX_EVENTS)
          );

          const hiddenEventsCount = events.filter((ev) =>
            isEventHidden(ev, getSlot(ev), MAX_EVENTS)
          ).length;

          const showExpandLink = events.length > MAX_EVENTS || hasHiddenEvents;
          const showMoreLink = events.length > 1 || hasHiddenEvents;

          return (
            <Grid
              size={{ xs: 12 / 7 }}
              key={`${wi}-${di}`}
              className="p-1"
              sx={(theme) => ({
                borderTop:
                  wi === 0
                    ? 'none !important'
                    : `1px solid ${theme.palette.divider}`,
                borderLeft:
                  di % 7 !== 0 ? `1px solid ${theme.palette.divider}` : 'none',
                p: '0 !important',
                bgcolor: isSelected
                  ? theme.palette.calendar.selectedDay
                  : isCurrentMonth
                    ? theme.palette.background.paper
                    : theme.palette.calendar.dayOut,
                ':hover': {
                  background: selectDay
                    ? theme.palette.calendar.hoverSelectedDay
                    : theme.palette.calendar.hoverDay,
                },
                position: 'relative',
                cursor: 'pointer',
              })}
              onClick={() => onDayClick(day)}
            >
              <Typography
                textAlign="center"
                sx={{
                  opacity: isCurrentMonth ? 1 : 0.4,
                  fontWeight: '500',
                  pt: 1,
                  pb: '5px',
                  color: isToday ? 'calendar.currentDay' : '',
                }}
                variant="body2"
                className={`${isToday && 'font-bold underline'}`}
              >
                {day.date()}
              </Typography>

              <Box
                sx={{
                  position: 'relative',
                  height: getDayBoxHeight(),
                  transition: 'ease height 0.3s',
                }}
              >
                {events.map((ev, index) => {
                  const isStart = ev.date.isSame(dayjs(ev.startDate), 'day');
                  const isEnd = ev.date.isSame(dayjs(ev.endDate), 'day');
                  const isWeekStart = di === 0;
                  const slot = getSlot(ev);

                  const showName = isStart || isWeekStart;
                  const maxSlots = isExpanded
                    ? events.length > MAX_EVENTS
                      ? events.length
                      : MAX_EVENTS
                    : MAX_EVENTS;

                  const shouldHide =
                    !isExpanded && isEventHidden(ev, slot, maxSlots);

                  return (
                    <Box
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(ev);
                      }}
                      sx={{
                        visibility: shouldHide ? 'hidden' : 'visible',
                        position: 'absolute',
                        top: slot * (MAX_EVENT_HEIGHT + 4),
                        height: MAX_EVENT_HEIGHT,
                        left: 0,
                        right: 0,
                        cursor: 'pointer',
                      }}
                    >
                      {renderEventChip(ev, {
                        isStart,
                        isEnd,
                        isWeekStart,
                        showName,
                        height: MAX_EVENT_HEIGHT,
                      })}
                    </Box>
                  );
                })}
              </Box>

              <Stack
                direction="row"
                alignItems="center"
                sx={{
                  width: '100%',
                  position: 'absolute',
                  bottom: 3,
                  left: 0,
                  right: 0,
                  height: 20,
                  gap: 0.25,
                }}
              >
                {showMoreLink && (
                  <Link
                    component="button"
                    underline="none"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoreClick(calendarDay);
                    }}
                    sx={{ flex: 1 }}
                    className="hover:bg-gray-900/15"
                  >
                    <FormatListBulletedIcon
                      sx={{
                        width: { xs: '15px', sm: '17px' },
                        maxHeight: '100%',
                      }}
                    />
                  </Link>
                )}
                {showExpandLink && [
                  <Divider key="d" orientation="vertical" flexItem />,
                  <Link
                    key="l"
                    component="button"
                    underline="none"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleExpand(wi);
                    }}
                    sx={{
                      fontSize: { xs: '0.80rem' },
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 1,
                      gap: { xs: 0, sm: 0.25 },
                    }}
                    className="hover:bg-gray-900/15"
                  >
                    {isExpanded ? (
                      <ExpandLess
                        sx={{
                          width: { xs: '15px', sm: '20px' },
                          maxHeight: '100%',
                          position: 'relative',
                          left: '-3px',
                          marginRight: { xs: '-5px', md: 0 },
                        }}
                      />
                    ) : (
                      <ExpandMore
                        sx={{
                          width: { xs: '15px', sm: '20px' },
                          maxHeight: '100%',
                          position: 'relative',
                          left: '-3px',
                          marginRight: { xs: '-5px', md: 0 },
                        }}
                      />
                    )}
                    {!isExpanded && (
                      <Typography component="span" variant="inherit">
                        {hiddenEventsCount}
                      </Typography>
                    )}
                  </Link>,
                ]}
              </Stack>
            </Grid>
          );
        })
      )}
    </Grid>
  );
}

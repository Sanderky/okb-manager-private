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
import dayjs from 'dayjs';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import type { CalendarGridProps } from '../model/types';
import { useEventColor } from '@/entities/events';

const MAX_EVENTS_DESKTOP = 4;
const MAX_EVENTS_PHONE = 2;

const MAX_EVENT_HEIGHT_DESKTOP = 20;
const MAX_EVENT_HEIGHT_PHONE = 18;

export const CalendarGrid: React.FC<CalendarGridProps> = React.memo(
  ({
    onMoreClick,
    monthGrid,
    currentMonth,
    selectDay,
    onDayClick,
    isDayInRange,
    handleEventClick,
  }) => {
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

    const { getEventColor, getEventTextColor } = useEventColor();
    return (
      <>
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

              const getDayBoxHeight = () => {
                const baseHeight = MAX_EVENTS * 24 + 23;

                if (!isExpanded) {
                  return baseHeight;
                }

                const maxSlot = events.reduce((max, ev) => {
                  const slot = getSlot(ev);
                  return Math.max(max, slot);
                }, 0);

                const requiredSlots = Math.max(maxSlot + 1, MAX_EVENTS);
                return requiredSlots * 24 + 23;
              };

              const getSlot = (ev: any) => slots[ev.id || 'temp'] ?? 0;

              const hasHiddenEvents = events.some((ev) => {
                const slot = getSlot(ev);
                return slot >= MAX_EVENTS;
              });

              const hiddenEventsCount = events.filter((ev) => {
                const slot = getSlot(ev);
                return slot >= MAX_EVENTS;
              }).length;

              const showExpandLink =
                events.length > MAX_EVENTS || hasHiddenEvents;
              const showMoreLink = events.length > 1 || hasHiddenEvents;

              return (
                <Grid
                  size={{ xs: 12 / 7 }}
                  key={`${wi}-${di}`}
                  className={`p-1`}
                  sx={(theme) => ({
                    borderTop:
                      wi === 0
                        ? 'none !important'
                        : `1px solid ${theme.palette.divider}`,
                    borderLeft:
                      di % 7 !== 0
                        ? `1px solid ${theme.palette.divider}`
                        : 'none',
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
                    textAlign={'center'}
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
                      const isStart = ev.date.isSame(ev.startDate, 'day');
                      const isEnd = ev.date.isSame(ev.endDate, 'day');

                      const isWeekStart = di === 0;
                      const slot = getSlot(ev);

                      const eventColor = getEventColor(ev.color);
                      const textColor = getEventTextColor(ev.color);

                      const showName = isStart || isWeekStart;

                      const maxSlots = isExpanded
                        ? events.length > MAX_EVENTS
                          ? events.length
                          : MAX_EVENTS
                        : MAX_EVENTS;

                      const shouldHideEvent = () => {
                        if (isExpanded) return false;
                        if (slot >= maxSlots) return true;
                      };

                      return (
                        <Box
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(ev);
                          }}
                          sx={{
                            visibility: shouldHideEvent()
                              ? 'hidden'
                              : 'visible',
                            position: 'absolute',
                            top: slot * (MAX_EVENT_HEIGHT + 4),
                            height: MAX_EVENT_HEIGHT,
                            left: 0,
                            right: 0,
                            bgcolor: eventColor,
                            px: { xs: 0.5, md: 1 },
                            ml: {
                              xs: isStart ? 0 : '-1px',
                              md: isStart ? 1 : '-1px',
                            },
                            mr: {
                              xs: isEnd ? 0 : '-1px',
                              md: isEnd ? 1 : '-1px',
                            },
                            fontSize: '0.7rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: showName ? textColor : 'transparent',

                            borderTopLeftRadius: isStart ? 10 : 0,
                            borderBottomLeftRadius: isStart ? 10 : 0,
                            borderTopRightRadius: isEnd ? 10 : 0,
                            borderBottomRightRadius: isEnd ? 10 : 0,

                            cursor: 'pointer',
                            textAlign: showName ? 'left' : 'right',
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 'inherit',
                              fontWeight: 500,
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              color: 'inherit',
                              lineHeight: `${MAX_EVENT_HEIGHT}px`,
                            }}
                          >
                            {ev.title || ev.description || '(Brak tytułu)'}
                          </Typography>

                          {isWeekStart && !isStart && (
                            <Box
                              sx={{
                                position: 'absolute',
                                left: 2,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: 3,
                                height: 12,
                                backgroundColor: textColor,
                                opacity: 0.6,
                                borderRadius: 1,
                              }}
                            />
                          )}
                        </Box>
                      );
                    })}
                  </Box>

                  <Stack
                    direction={'row'}
                    alignItems={'center'}
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
                      <>
                        <Link
                          component="button"
                          underline="none"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoreClick(calendarDay);
                          }}
                          sx={{
                            flex: 1,
                          }}
                          className="hover:bg-gray-900/15"
                        >
                          <FormatListBulletedIcon
                            sx={{
                              width: { xs: '15px', sm: '17px' },
                              maxHeight: '100%',
                            }}
                          />
                        </Link>
                      </>
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
                          <Typography component={'span'} variant="inherit">
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
      </>
    );
  }
);

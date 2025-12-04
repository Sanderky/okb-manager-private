import React, { useState } from 'react';
import {
  Grid,
  Box,
  Typography,
  Link,
  useTheme,
  darken,
  Stack,
  useMediaQuery,
  Divider,
} from '@mui/material';
import dayjs from 'dayjs';
import {
  getInitials,
  WEEK_DAYS,
  type CalendarGridProps,
} from './CalendarHelpers';

import { ExpandLess, ExpandMore } from '@mui/icons-material';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';

const MAX_EVENTS_DESKTOP = 4;
const MAX_EVENTS_PHONE = 2;

const MAX_EVENT_HEIGHT_DESKTOP = 20;
const MAX_EVENT_HEIGHT_PHONE = 18;

export const CalendarGrid: React.FC<CalendarGridProps> = React.memo(
  ({
    monthGrid,
    currentMonth,
    selectDay,
    onDayClick,
    isDayInRange,
    handleEventClick,
    setActiveDialog,
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

    return (
      <>
        {/* NAGŁÓWKI DNI TYGODNIA */}
        <Grid container className="bg-gray-50">
          {WEEK_DAYS.map((day, index) => (
            <Grid
              size={{ xs: 12 / 7 }}
              key={index}
              sx={{ textAlign: 'center', p: 1 }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: '700' }}
              >
                {day}
              </Typography>
            </Grid>
          ))}

          {/* SIATKA DNI */}
          {monthGrid.map((week, wi) =>
            week.map((calendarDay, di) => {
              const { date: day, events, slots = {} } = calendarDay;

              const isCurrentMonth = day.isSame(currentMonth, 'month');
              const isToday = day.isSame(dayjs(), 'day');
              const isSelected = isDayInRange(day);
              const isExpanded = expandedWeeks.has(wi);

              // Obliczanie wysokości komórki
              const getDayBoxHeight = () => {
                const eventsCount = events.length;
                const hasEvents = eventsCount > 0;

                // Base height calculation based on rows
                const rowHeight = MAX_EVENTS_DESKTOP * 24 + 23; // Stała wysokość minimalna

                if (hasEvents && isExpanded) {
                  const expandedHeight = eventsCount * 24 + 23;
                  return Math.max(expandedHeight, rowHeight);
                } else {
                  return rowHeight; // Domyślna wysokość wiersza
                }
              };

              // Sprawdzanie czy są ukryte eventy
              const hasHiddenEvents = events.some((ev) => {
                const slot = slots[ev.groupId];
                // Jeśli slot jest poza limitem LUB nie ma przypisanego slotu (błąd danych)
                return (
                  (slot !== undefined ? slot : 99) >= MAX_EVENTS || !ev.employee
                );
              });

              const hiddenEventsCount = events.filter((ev) => {
                const slot = slots[ev.groupId];
                return (
                  (slot !== undefined ? slot : 99) >= MAX_EVENTS || !ev.employee
                );
              }).length;

              const showMoreLink =
                events.length > MAX_EVENTS || hasHiddenEvents;

              return (
                <Grid
                  size={{ xs: 12 / 7 }}
                  key={`${wi}-${di}`}
                  className={`border-t border-t-gray-300 p-1 ${isSelected ? 'bg-blue-100' : ''}`}
                  sx={{
                    borderLeft: di % 7 !== 0 ? '1px solid #ddd' : 'none',
                    p: '0 !important',
                    bgcolor: isCurrentMonth ? 'white' : '#fafafa',
                    ':hover': {
                      background: selectDay ? 'lightskyblue' : '#f0f0f0',
                    },
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                  onClick={() => onDayClick(day)}
                >
                  {/* NUMER DNIA */}
                  <Typography
                    textAlign={'center'}
                    sx={{
                      opacity: isCurrentMonth ? 1 : 0.4,
                      fontWeight: '500',
                      pt: 1,
                      pb: '5px',
                    }}
                    variant="body2"
                    className={`${isToday ? 'font-bold text-blue-700 underline' : ''}`}
                  >
                    {day.date()}
                  </Typography>

                  {/* KONTENER NA PASKI URLOPÓW */}
                  <Box
                    sx={{
                      position: 'relative',
                      height: getDayBoxHeight(),
                      transition: 'ease height 0.2s', // Przyspieszyłem animację
                    }}
                  >
                    {events.map((ev, index) => {
                      // Obliczenia wizualne
                      const isStart = ev.date.isSame(ev.startDate, 'day');
                      const isEnd = ev.date.isSame(ev.endDate, 'day');

                      // ZMIANA: Wykrywanie początku wiersza (poniedziałek) po indeksie kolumny
                      const isWeekStart = di === 0;

                      const slot = slots[ev.groupId] ?? index; // Fallback to index if slot missing

                      // Kolory
                      const isLightColor =
                        theme.palette.getContrastText(ev.color) !== '#fff';
                      const textColor = isLightColor
                        ? darken(ev.color, 0.55)
                        : '#ffffff';

                      // Kiedy pokazać nazwisko: Początek urlopu LUB początek tygodnia
                      const showName = isStart || isWeekStart;

                      const maxSlots = isExpanded
                        ? events.length > MAX_EVENTS
                          ? events.length
                          : MAX_EVENTS
                        : MAX_EVENTS;

                      const shouldHideEvent = () => {
                        if (isExpanded) return false;
                        if (slot >= maxSlots || !ev.employee) return true;
                        return false;
                      };

                      return (
                        <Box
                          key={`${ev.id}-${index}`}
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
                            bgcolor: ev.color,
                            px: 1,
                            // Magia CSS: Jeśli to nie początek, przesuń w lewo o 1px żeby zakryć przerwę
                            // Ale jeśli to początek tygodnia (di===0) i nie początek urlopu, to nie przesuwamy (bo jest krawędź)
                            ml: isStart || isWeekStart ? 1 : '-1px',
                            mr: isEnd ? 1 : '-1px',

                            fontSize: '0.7rem',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            color: showName ? textColor : 'transparent',

                            // Zaokrąglenia tylko na faktycznych końcach urlopu
                            borderTopLeftRadius: isStart ? 10 : 0,
                            borderBottomLeftRadius: isStart ? 10 : 0,
                            borderTopRightRadius: isEnd ? 10 : 0,
                            borderBottomRightRadius: isEnd ? 10 : 0,

                            cursor: 'pointer',
                            textAlign: showName ? 'left' : 'right',
                            zIndex: 1, // Żeby pasek był nad siatką
                          }}
                          className={`${!ev.employee.status ? 'italic line-through' : ''}`}
                        >
                          {/* Nazwa (Desktop) */}
                          <Typography
                            sx={{
                              fontSize: 'inherit',
                              fontWeight: 500,
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              display: {
                                xs: 'none',
                                sm: showName ? 'block' : 'none',
                              },
                              color: 'inherit',
                              lineHeight: `${MAX_EVENT_HEIGHT}px`,
                            }}
                          >
                            {ev.employee.name}
                          </Typography>

                          {/* Inicjały (Mobile) */}
                          <Typography
                            sx={{
                              fontSize: 'inherit',
                              fontWeight: 600,
                              display: {
                                xs: showName ? 'block' : 'none',
                                sm: 'none',
                              },
                              color: 'inherit',
                              lineHeight: `${MAX_EVENT_HEIGHT}px`,
                            }}
                          >
                            {getInitials(ev.employee.name)}
                          </Typography>

                          {/* Ozdobnik (Pasek po lewej dla kontynuacji w nowym tygodniu) */}
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

                  {/* PRZYCISKI "POKAŻ WIĘCEJ" */}
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
                            setActiveDialog({
                              type: 'moreEvents',
                              day: calendarDay,
                            });
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
                        {hasHiddenEvents && [
                          <Divider key="div" orientation="vertical" flexItem />,
                          <Link
                            key="expand"
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
                                sx={{ width: { xs: '15px', sm: '20px' } }}
                              />
                            ) : (
                              <ExpandMore
                                sx={{ width: { xs: '15px', sm: '20px' } }}
                              />
                            )}
                            {!isExpanded && (
                              <Typography component={'span'} variant="inherit">
                                {hiddenEventsCount}
                              </Typography>
                            )}
                          </Link>,
                        ]}
                      </>
                    )}
                  </Stack>
                </Grid>
              );
            })
          )}
        </Grid>

        {/* STOPKA Z NAZWĄ MIESIĄCA */}
        <Stack
          direction={'row'}
          justifyContent={'space-between'}
          spacing={2}
          alignItems={'center'}
          className="border-t border-t-gray-300 px-3 py-2"
        >
          <Typography
            align="center"
            variant="overline"
            className="text-md w-full font-medium text-gray-500"
          >
            {currentMonth.format('MMMM YYYY')}
          </Typography>
        </Stack>
      </>
    );
  }
);

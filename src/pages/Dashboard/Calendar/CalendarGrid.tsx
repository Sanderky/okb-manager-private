import React from 'react';
import { Grid, Box, Typography, Tooltip, Link } from '@mui/material';
import dayjs from 'dayjs';
import {
  getInitials,
  WEEK_DAYS,
  type CalendarGridProps,
} from './CalendarHelpers';

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
    return (
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

        {monthGrid.map((week, wi) =>
          week.map((calendarDay, di) => {
            const { date: day, events, slots = {} } = calendarDay;
            const isCurrentMonth = day.isSame(currentMonth, 'month');
            const isToday = day.isSame(dayjs(), 'day');
            const isSelected = isDayInRange(day);

            return (
              <Grid
                size={{ xs: 12 / 7 }}
                key={`${wi}-${di}`}
                className={`border-t border-t-gray-300 p-1 ${isSelected && 'bg-lightBlue'}`}
                sx={{
                  borderLeft: di % 7 !== 0 ? '1px solid #ddd' : 'none',
                  minHeight: 140,
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
                <Typography
                  textAlign={'center'}
                  sx={{
                    opacity: isCurrentMonth ? 1 : 0.4,
                    fontWeight: '500',
                    pt: 1,
                    pb: 0.5,
                  }}
                  variant="body2"
                  className={`${isToday && 'font-bold text-blue-700 underline'}`}
                >
                  {day.date()}
                </Typography>
                <Box
                  sx={{
                    position: 'relative',
                    height: 4 * 23,
                  }}
                >
                  {events.map((ev, index) => {
                    const isStart = ev.date.isSame(ev.startDate);
                    const isEnd = ev.date.isSame(ev.endDate);
                    const slot = slots[ev.groupId];

                    if (slot > 3 || !ev.employee) return null;

                    return (
                      <Tooltip
                        arrow
                        placement="top"
                        key={index}
                        title={
                          <Box>
                            <Typography variant="subtitle2">
                              {ev.employee?.name}
                            </Typography>
                            <Typography variant="body2">
                              {ev.startDate.format('DD.MM.YYYY')} –{' '}
                              {ev.endDate.format('DD.MM.YYYY')}
                            </Typography>
                            {ev.description && (
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {ev.description}
                              </Typography>
                            )}
                          </Box>
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(ev);
                        }}
                        slotProps={{
                          popper: {
                            modifiers: [
                              {
                                name: 'offset',
                                options: {
                                  offset: [0, -5],
                                },
                              },
                            ],
                          },
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            top: slot * 23,
                            left: 0,
                            right: 0,
                            bgcolor: ev.color,
                            px: 1,
                            ml: isStart ? 1 : '-1px',
                            mr: isEnd ? 1 : '-1px',
                            fontSize: '0.7rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: isStart || isEnd ? 'white' : 'transparent',
                            borderTopLeftRadius: isStart ? 10 : 0,
                            borderBottomLeftRadius: isStart ? 10 : 0,
                            borderTopRightRadius: isEnd ? 10 : 0,
                            borderBottomRightRadius: isEnd ? 10 : 0,
                            cursor: 'pointer',
                            textAlign: isStart ? 'left' : 'right',
                          }}
                          className={`${!ev.employee.status && 'italic line-through'}`}
                        >
                          <Typography
                            sx={{
                              fontSize: 'inherit',
                              fontWeight: 500,
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              display: { xs: 'none', sm: 'block' },
                            }}
                          >
                            {ev.employee.name}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 'inherit',
                              fontWeight: 500,
                              display: { xs: 'block', sm: 'none' },
                            }}
                          >
                            {getInitials(ev.employee.name)}
                          </Typography>
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Box>
                {events.length > 1 && (
                  <Link
                    component="button"
                    underline="none"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDialog({ type: 'moreEvents', day: calendarDay });
                    }}
                    sx={{
                      fontSize: { xs: '0.70rem', md: '0.75rem' },
                      ':hover': { color: 'purple' },
                      width: '100%',
                      display: 'block',
                      position: 'absolute',
                      bottom: 2,
                      left: 0,
                      right: 0,
                    }}
                  >
                    więcej
                  </Link>
                )}
              </Grid>
            );
          })
        )}
      </Grid>
    );
  }
);

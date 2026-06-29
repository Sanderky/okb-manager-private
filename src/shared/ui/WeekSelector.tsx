import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Popover,
  IconButton,
  Tooltip,
  type Theme,
} from '@mui/material';
import { CalendarMonth, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { Stack } from '@mui/system';
import { useTranslation } from 'react-i18next';
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isoWeek from 'dayjs/plugin/isoWeek';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

dayjs.extend(isBetween);
dayjs.extend(isoWeek);

function getStartOfWeek(date: Date): Date {
  return dayjs(date).startOf('isoWeek').toDate();
}

function getEndOfWeek(date: Date): Date {
  return dayjs(date).endOf('isoWeek').toDate();
}

function formatDate(date: Date, short: boolean = false): string {
  return dayjs(date).format(short ? 'DD.MM.YY' : 'DD.MM.YYYY');
}

interface WeekSelectorProps {
  value: Date;
  onChange: (date: Date) => void;
  renderQuickActions?: boolean;
  disabled?: boolean;
  comparisonDate?: Date;
  small?: boolean;
}

const WeekSelector: React.FC<WeekSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  comparisonDate,
  small = false,
}) => {
  const { t, i18n } = useTranslation('common');
  const currentLang = i18n.language.substring(0, 2).toLowerCase();

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [hoveredWeek, setHoveredWeek] = useState<Date | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(
    dayjs(value).startOf('month')
  );

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setHoveredWeek(null);
  };

  const handleWeekSelect = (weekStart: Date) => {
    onChange(weekStart);
    handleClose();
  };

  const dayNames = useMemo(() => {
    return [1, 2, 3, 4, 5, 6, 7].map((d) => dayjs().isoWeekday(d).format('dd'));
  }, [i18n.language]);

  const calendarWeeks = useMemo(() => {
    const year = selectedMonth.year();
    const month = selectedMonth.month();

    const weeks = [];
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let currentWeekStart = getStartOfWeek(firstDayOfMonth);

    for (let i = 0; i < 6; i++) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(currentWeekStart.getDate() + 6);

      const weekDays = [];
      for (let j = 0; j < 7; j++) {
        const day = new Date(currentWeekStart);
        day.setDate(currentWeekStart.getDate() + j);
        weekDays.push(day);
      }

      weeks.push({
        start: new Date(currentWeekStart),
        end: weekEnd,
        days: weekDays,
        isCurrentMonth: currentWeekStart.getMonth() === month,
      });

      currentWeekStart = new Date(currentWeekStart);
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);

      if (currentWeekStart > lastDayOfMonth && i >= 3) break;
    }

    return weeks;
  }, [selectedMonth]);

  const handleMonthChange = (newMonth: Dayjs | null) => {
    if (newMonth) {
      setSelectedMonth(newMonth.startOf('month'));
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? 'week-selector-popover' : undefined;

  const isStart = dayjs(value).isBefore(comparisonDate);
  const isEnd = dayjs(value).isAfter(comparisonDate);

  return (
    <>
      <Tooltip title={t('weekSelector.selectWeek')}>
        <span>
          <Button
            variant="outlined"
            startIcon={!small && <CalendarMonth />}
            onClick={handleClick}
            disabled={disabled}
            size="small"
            sx={(theme) => ({
              borderColor: theme.palette.primary.light,
            })}
          >
            {`${formatDate(value, small)} - ${formatDate(getEndOfWeek(value), small)}`}
          </Button>
        </span>
      </Tooltip>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        sx={{
          '& .MuiPopover-paper': { borderRadius: '8px', overflow: 'hidden' },
        }}
      >
        <Box
          sx={{
            width: 320,
            py: 2,
            px: 1,
            maxWidth: '100vw',
            boxSizing: 'border-box',
          }}
        >
          <Stack direction={'row'} sx={{ alignItems: 'center' }}>
            <IconButton
              onClick={() =>
                setSelectedMonth((prev) => dayjs(prev).subtract(1, 'month'))
              }
            >
              <ChevronLeft />
            </IconButton>

            <LocalizationProvider
              dateAdapter={AdapterDayjs}
              adapterLocale={currentLang}
            >
              <DatePicker
                openTo="month"
                views={['year', 'month']}
                value={selectedMonth}
                onChange={handleMonthChange}
                sx={{
                  width: '100%',
                  '& .MuiPickersSectionList-root': {
                    padding: '7px 0',
                    width: 'auto',
                  },
                }}
              />
            </LocalizationProvider>

            <IconButton
              onClick={() =>
                setSelectedMonth((prev) => dayjs(prev).add(1, 'month'))
              }
            >
              <ChevronRight />
            </IconButton>
          </Stack>

          <TableContainer
            component={Box}
            sx={{
              maxHeight: 300,
              '& .MuiTableCell-root': {
                border: 'none',
                padding: '4px 2px',
                textAlign: 'center',
                fontSize: '0.8rem',
                lineHeight: '1.2',
                background: 'none',
              },
            }}
          >
            <Table
              size="small"
              sx={{
                borderCollapse: 'separate',
                borderSpacing: '0 5px',
                tableLayout: 'fixed',
                width: '100%',
              }}
            >
              <TableHead>
                <TableRow>
                  {dayNames.map((dayName, index) => (
                    <TableCell
                      key={index}
                      sx={{
                        fontWeight: 'bold',
                        fontSize: '0.7rem',
                        py: 1,
                        textTransform: 'capitalize',
                      }}
                    >
                      {dayName}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {calendarWeeks.map((week, weekIndex) => {
                  const weekStartTs = week.start.getTime();
                  const valueTs = value.getTime();
                  const isSelected = weekStartTs === valueTs;

                  const isComparison =
                    comparisonDate &&
                    weekStartTs === getStartOfWeek(comparisonDate).getTime();

                  const isInRange =
                    comparisonDate &&
                    ((weekStartTs > valueTs &&
                      weekStartTs < getStartOfWeek(comparisonDate).getTime()) ||
                      (weekStartTs < valueTs &&
                        weekStartTs >
                          getStartOfWeek(comparisonDate).getTime()));

                  const isHovered =
                    hoveredWeek && weekStartTs === hoveredWeek.getTime();

                  return (
                    <TableRow
                      key={weekIndex}
                      sx={{
                        cursor: 'pointer',
                        position: 'relative',
                        marginTop: '5px !important',
                        height: '32px',
                        overflow: 'hidden',
                        display: 'table-row',
                      }}
                      onMouseEnter={() => setHoveredWeek(week.start)}
                      onMouseLeave={() => setHoveredWeek(null)}
                      onClick={() => handleWeekSelect(week.start)}
                    >
                      {week.days.map((day, dayIndex) => {
                        const isCurrentMonth =
                          day.getMonth() === selectedMonth.month();
                        const isToday =
                          day.toDateString() === new Date().toDateString();

                        const getTextColor = (theme: Theme) => {
                          if (isSelected) return 'primary.contrastText';
                          if (!isCurrentMonth)
                            return theme.palette.text.disabled;
                          return isToday ? 'primary.main' : 'text.primary';
                        };

                        const getBgColor = (theme: Theme) => {
                          if (isSelected) {
                            if (isHovered) return theme.palette.primary.dark;
                            return theme.palette.primary.main;
                          }
                          if (isInRange || isComparison) {
                            if (isHovered)
                              return theme.palette.mode === 'light'
                                ? theme.palette.action.active
                                : theme.palette.action.hover;
                            return theme.palette.action.selected;
                          }
                          if (isHovered) return theme.palette.tableHover;
                          return 'transparent';
                        };

                        return (
                          <TableCell
                            key={dayIndex}
                            sx={(theme) => ({
                              fontWeight: isToday ? 'bold' : 'normal',
                              color: getTextColor(theme),
                              py: 0.5,
                              backgroundColor: `${getBgColor(theme)} !important`,
                              textDecoration: isToday ? 'underline' : 'none',

                              ...(!comparisonDate &&
                                isSelected &&
                                dayIndex === 6 && {
                                  borderTopRightRadius: '10px',
                                  borderBottomRightRadius: '10px',
                                }),
                              ...(((isComparison && !isStart) ||
                                (!isComparison && isSelected && isStart)) &&
                                dayIndex === 0 && {
                                  borderTopLeftRadius: '10px',
                                  borderBottomLeftRadius: '10px',
                                }),
                              ...(((isComparison && !isEnd) ||
                                (!isComparison && isSelected && isEnd)) &&
                                dayIndex === 6 && {
                                  borderTopRightRadius: '10px',
                                  borderBottomRightRadius: '10px',
                                }),
                            })}
                          >
                            {day.getDate()}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Stack direction={'row'} justifyContent={'flex-end'} mt={1}>
            <Button
              size="small"
              variant="text"
              onClick={() => {
                const today = new Date();
                setSelectedMonth(dayjs(today).startOf('month'));
                handleWeekSelect(getStartOfWeek(today));
              }}
            >
              {t('weekSelector.currentWeek')}
            </Button>
          </Stack>
        </Box>
      </Popover>
    </>
  );
};

export default WeekSelector;

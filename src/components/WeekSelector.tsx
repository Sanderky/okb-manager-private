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
} from '@mui/material';
import { CalendarMonth, ChevronLeft, ChevronRight } from '@mui/icons-material';

import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { plPL } from '@mui/x-date-pickers/locales';
import 'dayjs/locale/pl';
import { Stack } from '@mui/system';

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const newDate = new Date(d);
  newDate.setDate(diff);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

dayjs.extend(isBetween);

interface WeekSelectorProps {
  value: Date;
  onChange: (date: Date) => void;
  renderQuickActions?: boolean;
  disabled?: boolean;
}

const WeekSelector: React.FC<WeekSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
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

  const dayNames = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];

  return (
    <>
      <Tooltip title="Wybierz tydzień">
        <span>
          <Button
            variant="outlined"
            startIcon={<CalendarMonth />}
            onClick={handleClick}
            disabled={disabled}
          >
            {`${formatDate(value)} - ${formatDate(getEndOfWeek(value))}`}
          </Button>
        </span>
      </Tooltip>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box
          sx={{
            width: 320,
            py: 2,
            px: 1,
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
              adapterLocale="pl"
              // localeText={{
              //   cancelButtonLabel: "Anuluj"
              // }}
              localeText={
                plPL.components.MuiLocalizationProvider.defaultProps.localeText
              }
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
              },
            }}
          >
            <Table
              size="small"
              sx={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}
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
                      }}
                    >
                      {dayName}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {calendarWeeks.map((week, weekIndex) => {
                  const isSelected = week.start.getTime() === value.getTime();
                  const isHovered =
                    hoveredWeek &&
                    week.start.getTime() === hoveredWeek.getTime();

                  return (
                    <TableRow
                      key={weekIndex}
                      sx={{
                        cursor: 'pointer',
                        position: 'relative',
                        marginTop: '5px !important',
                        zIndex: 10,
                        '&:hover &:after': {
                          backgroundColor: isSelected
                            ? 'primary.main'
                            : 'action.hover',
                        },
                        '&:after': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          backgroundColor: isSelected
                            ? 'primary.main'
                            : isHovered
                              ? 'action.hover'
                              : 'transparent',
                          color: isSelected
                            ? 'primary.contrastText'
                            : 'text.primary',
                          transition: 'background-color 0.2s',
                          zIndex: -1,
                          display: 'block',
                          width: '100%',
                          height: '100%',
                          borderRadius: '10px',
                        },
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

                        return (
                          <TableCell
                            key={dayIndex}
                            sx={{
                              fontWeight: isToday ? 'bold' : 'normal',
                              opacity: isCurrentMonth ? 1 : 0.4,
                              color: isSelected
                                ? 'primary.contrastText'
                                : isToday
                                  ? 'primary.main'
                                  : 'text.primary',
                              py: 0.8,
                            }}
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
              <Stack direction={"row"} justifyContent={"flex-end"} mt={2}>

            <Button
                  size="small"
                  variant="text"
                  // fullWidth
                  onClick={() => {
                    const today = new Date();
                    setSelectedMonth(dayjs(today).startOf('month'));
                    handleWeekSelect(getStartOfWeek(today));
                  }}
                >
                  Bieżący tydzień
                </Button>
              </Stack>
        </Box>
      </Popover>
    </>
  );
};

export default WeekSelector;

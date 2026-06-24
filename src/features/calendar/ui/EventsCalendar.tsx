import React from 'react';
import {
  Box,
  CircularProgress,
  Grid,
  IconButton,
  Typography,
  Popover,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import { useEventColor } from '@/entities/events';
import {
  EVENT_CATEGORIES,
  getCategoryLabel,
  type EventCategory,
} from '@/entities/events';
import useContainerBreakpoint from '@/shared/lib/useContainerWidth';
import { useCalendarContext } from '../model/providers/CalendarContext';
import { BaseCalendarControls } from '@/shared/ui/calendar/BaseCalendarControls';
import { BaseCalendarGrid } from '@/shared/ui/calendar/BaseCalendarGrid';
import { WEEK_DAYS } from '@/shared/config/days';
import { AddEventDialog } from './dialogs/AddEventDialog';
import { EditEventDialog } from './dialogs/EditEventDialog';
import { EventListDialog } from './dialogs/EventListDialog';

export const EventsCalendar: React.FC = () => {
  const [containerRef, width] = useContainerBreakpoint();
  const { state, actions } = useCalendarContext();
  const { getEventColor, getEventTextColor } = useEventColor();

  const activeDayData = state.activeDayDate
    ? state.monthGrid
        .flat()
        .find((d) => d.date.isSame(state.activeDayDate, 'day')) || null
    : null;

  const handleFilterChange = (category: EventCategory) => {
    actions.setters.setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((s) => s !== category)
        : [...prev, category]
    );
  };

  const popoverId = state.dialogs.isFilterOpen
    ? 'calendar-filters-popover'
    : undefined;

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {state.status.loading && (
        <Box
          sx={(t) => ({
            position: 'absolute',
            inset: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: t.palette.loadingOverlay,
            zIndex: 100,
          })}
        >
          <CircularProgress />
        </Box>
      )}

      <IconButton
        size="large"
        sx={{
          color: 'red',
          position: 'fixed',
          bottom: 25,
          right: 25,
          zIndex: 100,
          display: { xs: state.selectDay ? 'flex' : 'none', sm: 'none' },
        }}
        className="border bg-red-100"
        onClick={actions.resetOnClose}
      >
        <CloseIcon />
      </IconButton>

      <BaseCalendarControls
        currentMonth={state.currentMonth}
        containerWidth={width}
        isFiltered={
          state.filters.selectedCategories.length < EVENT_CATEGORIES.length
        }
        handleMonthChange={(action) => {
          let newMonth = state.currentMonth.clone();
          if (action === 'today') newMonth = dayjs().startOf('month');
          else if (action === 'prev') newMonth = newMonth.subtract(1, 'month');
          else if (action === 'next') newMonth = newMonth.add(1, 'month');
          actions.changeMonth(newMonth);
        }}
        handleDatePickerChange={(val) => val && actions.changeMonth(val)}
        popoverId={popoverId}
        onOpenFilters={() => actions.setters.setIsFilterOpen(true)}
        filtersContent={
          <Popover
            id={popoverId}
            open={state.dialogs.isFilterOpen}
            onClose={() => actions.setters.setIsFilterOpen(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            anchorReference="anchorPosition"
            anchorPosition={{ top: 100, left: 200 }}
          >
            <FormGroup sx={{ p: 2 }}>
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ mb: 1, display: 'block' }}
              >
                Pokaż typy wydarzeń:
              </Typography>
              {EVENT_CATEGORIES.map((sev) => (
                <FormControlLabel
                  key={sev}
                  control={
                    <Checkbox
                      checked={state.filters.selectedCategories.includes(sev)}
                      onChange={() => handleFilterChange(sev)}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      {getCategoryLabel(sev)}
                    </Typography>
                  }
                />
              ))}
            </FormGroup>
          </Popover>
        }
      />

      <Box sx={(t) => ({ borderBottom: `1px solid ${t.palette.divider}` })}>
        <Grid container>
          {WEEK_DAYS.map((day, i) => (
            <Grid
              size={{ xs: 12 / 7 }}
              key={i}
              sx={{ textAlign: 'center', p: 1 }}
            >
              <Typography
                variant="caption"
                fontWeight="bold"
                color="textSecondary"
              >
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <BaseCalendarGrid
          monthGrid={state.monthGrid}
          currentMonth={state.currentMonth}
          selectDay={state.selectDay}
          onDayClick={actions.handleDayClick}
          isDayInRange={actions.isDayInRange}
          onMoreClick={(data) => {
            actions.setters.setActiveDayDate(data.date);
            actions.setters.setEventsDialogOpen(true);
          }}
          onEventClick={actions.handleEventClick}
          isEventHidden={(ev, slot, maxSlots) => slot >= maxSlots}
          renderEventChip={(
            ev,
            { isStart, isEnd, isWeekStart, showName, height }
          ) => {
            const eventColor = getEventColor(ev.color);
            const textColor = getEventTextColor(ev.color);

            return (
              <Box
                sx={{
                  bgcolor: eventColor,
                  color: showName ? textColor : 'transparent',
                  height: '100%',
                  px: { xs: 0.5, md: 1 },
                  ml: { xs: isStart ? 0 : '-1px', md: isStart ? 1 : '-1px' },
                  mr: { xs: isEnd ? 0 : '-1px', md: isEnd ? 1 : '-1px' },
                  fontSize: '0.7rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  borderTopLeftRadius: isStart ? 10 : 0,
                  borderBottomLeftRadius: isStart ? 10 : 0,
                  borderTopRightRadius: isEnd ? 10 : 0,
                  borderBottomRightRadius: isEnd ? 10 : 0,
                  textAlign: showName ? 'left' : 'right',
                }}
              >
                <Typography
                  sx={{
                    fontSize: 'inherit',
                    fontWeight: 500,
                    lineHeight: `${height}px`,
                    display: { xs: 'none', sm: showName ? 'block' : 'none' },
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
          }}
        />
      </Box>

      <AddEventDialog
        open={state.dialogs.addDialogOpen}
        currentEvent={state.currentEvent}
        validationError={state.validationError}
        employees={state.employees}
        constructions={state.constructions}
        handleModalClose={actions.closeDialogs.add}
        handleAddEvent={actions.mutations.handleAddEvent}
        loading={state.status.actionLoading}
      />
      <EditEventDialog
        handleResetError={() => actions.setters.setValidationError('')}
        open={state.dialogs.editDialogOpen}
        currentEvent={state.currentEvent}
        setCurrentEvent={actions.setters.setCurrentEvent}
        validationError={state.validationError}
        employees={state.employees}
        constructions={state.constructions}
        handleModalClose={actions.closeDialogs.edit}
        handleDeleteEvent={actions.mutations.handleDeleteEvent}
        handleEditEvent={actions.mutations.handleEditEvent}
        loading={state.status.actionLoading}
      />
      <EventListDialog
        loading={state.status.loading}
        onAddButtonClick={actions.handleOnAddEventButtonClick}
        open={state.dialogs.eventsDialogOpen}
        onClose={() => actions.setters.setEventsDialogOpen(false)}
        selectedDayData={activeDayData}
        onEventClick={actions.handleEventClick}
      />
    </Box>
  );
};

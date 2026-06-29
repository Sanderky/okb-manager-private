import React from 'react';
import {
  Box,
  CircularProgress,
  Grid,
  IconButton,
  Typography,
  useTheme,
  darken,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import useContainerBreakpoint from '@/shared/lib/useContainerWidth';
import { getInitials } from '@/shared/lib/string';
import { WEEK_DAYS } from '@/shared/config/days';
import { useVacationsContext } from '../model/providers/VacationsContext';
import { BaseCalendarControls } from '@/shared/ui/calendar/BaseCalendarControls';
import { BaseCalendarGrid } from '@/shared/ui/calendar/BaseCalendarGrid';
import { FilterDialog } from './dialogs/FilterDialog';
import { AddVacationDialog } from './dialogs/AddVacationDialog';
import { EditVacationDialog } from './dialogs/EditVacationDialog';
import { EventListDialog } from './dialogs/EventListDialog';
import { VacationReportDialog } from './dialogs/VacationReportDialog';

export const VacationsCalendar: React.FC = () => {
  const theme = useTheme();
  const [containerRef, width] = useContainerBreakpoint();

  const { state, actions } = useVacationsContext();

  const activeDayData = state.activeDayDate
    ? state.monthGrid
        .flat()
        .find((d) => d.date.isSame(state.activeDayDate, 'day')) || null
    : null;

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
          sx={(theme) => ({
            position: 'absolute',
            inset: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.palette.loadingOverlay,
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
          display: {
            xs: state.selectDay ? 'flex' : 'none',
            sm: 'none',
          },
        }}
        className="border bg-red-100"
        onClick={actions.resetOnClose}
      >
        <CloseIcon />
      </IconButton>

      <BaseCalendarControls
        currentMonth={state.currentMonth}
        containerWidth={width}
        isFiltered={state.filters.selectedEmployeeIds.length > 0}
        handleMonthChange={(action) => {
          let newMonth = state.currentMonth.clone();
          if (action === 'today') newMonth = dayjs().startOf('month');
          else if (action === 'prev') newMonth = newMonth.subtract(1, 'month');
          else if (action === 'next') newMonth = newMonth.add(1, 'month');
          actions.changeMonth(newMonth);
        }}
        handleDatePickerChange={(val) => val && actions.changeMonth(val)}
        onOpenFilters={() => actions.setters.setIsFilterOpen(true)}
        filtersContent={null}
      />

      <Box sx={(t) => ({ borderBottom: `1px solid ${t.palette.divider}` })}>
        <Grid container>
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
        </Grid>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          overflowX: 'hidden',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
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
          isEventHidden={(ev, slot, maxSlots) =>
            slot >= maxSlots || !ev.employeeId
          }
          renderEventChip={(
            ev,
            { isStart, isEnd, isWeekStart, showName, height }
          ) => {
            const isLightColor =
              theme.palette.getContrastText(ev.color) !== '#fff';
            const textColor = isLightColor ? darken(ev.color, 0.55) : '#ffffff';

            return (
              <Box
                className={`${!ev.employeeActive && 'italic line-through'}`}
                sx={{
                  bgcolor: ev.color,
                  color: showName ? textColor : 'transparent',
                  height: '100%',
                  px: 1,
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
                  {ev.employeeName}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 'inherit',
                    fontWeight: 600,
                    lineHeight: `${height}px`,
                    display: { xs: showName ? 'block' : 'none', sm: 'none' },
                  }}
                >
                  {getInitials(ev.employeeName)}
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

      <FilterDialog
        showInactive={state.filters.showInactive}
        setShowInactive={actions.setters.setShowInactive}
        isFilterOpen={state.dialogs.isFilterOpen}
        setIsFilterOpen={actions.setters.setIsFilterOpen}
        employees={state.employees}
        selectedEmployees={state.filters.selectedEmployeeIds}
        setSelectedEmployees={actions.setters.setSelectedEmployeeIds}
      />

      <AddVacationDialog
        open={state.dialogs.addDialogOpen}
        currentEvent={state.currentEvent}
        validationError={state.validationError}
        employees={state.employees}
        handleModalClose={actions.closeDialogs.add}
        handleAddEvent={actions.mutations.handleAddEvent}
        loading={state.status.actionLoading}
      />

      <EditVacationDialog
        handleResetError={() => actions.setters.setValidationError('')}
        open={state.dialogs.editDialogOpen}
        currentEvent={state.currentEvent}
        validationError={state.validationError}
        employees={state.employees}
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

      <VacationReportDialog
        open={state.dialogs.isVacationReportOpen}
        onClose={() => actions.setters.setIsVacationReportOpen(false)}
        employees={state.employees}
        vacations={state.vacations}
        showInactive={state.filters.showInactive}
        setShowInactive={actions.setters.setShowInactive}
      />
    </Box>
  );
};

import React from 'react';
import {
  Stack,
  Typography,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import type { Dayjs } from 'dayjs';
import BaseDialog from '@/shared/ui/BaseDialog';
import { getCategoryLabel, useEventColor } from '@/entities/events';
import type { UiCalendarEvent } from '../../model/types';
import type { CalendarDay } from '@/shared/model/types';
import dayjs from 'dayjs';

interface EventListDialogProps {
  open: boolean;
  onClose: () => void;
  onEventClick?: (event: UiCalendarEvent) => void;
  selectedDayData: CalendarDay<UiCalendarEvent> | null;
  loading?: boolean;
  onAddButtonClick: (date?: Dayjs) => void;
}

export const EventListDialog: React.FC<EventListDialogProps> = ({
  onEventClick,
  open,
  onClose,
  selectedDayData,
  onAddButtonClick,
  loading,
}) => {
  const events = selectedDayData?.events ?? [];
  const { getEventColor, getEventTextColor } = useEventColor();

  const getDate = (event: UiCalendarEvent) => {
    if (!event || !event.startDate || !event.endDate) return '';

    const start = dayjs(event.startDate);
    const end = dayjs(event.endDate);

    if (start.isSame(end, 'day')) return start.format('DD.MM');
    return `${start.format('DD.MM')} - ${end.format('DD.MM')}`;
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6">Wydarzenia ({events.length})</Typography>
          <span>-</span>
          <Chip
            color="primary"
            label={selectedDayData?.date.format('DD.MM.YYYY')}
          />
        </Stack>
      }
      showConfirm={false}
      cancelText="Zamknij"
      maxWidth="md"
      contentSx={{ p: 0 }}
      actions={
        <Button
          key="add"
          variant="contained"
          startIcon={<Add />}
          disabled={loading}
          onClick={() => onAddButtonClick(selectedDayData?.date)}
        >
          Dodaj
        </Button>
      }
    >
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ maxHeight: 600, overflowX: 'auto' }}
      >
        <Table size="small" stickyHeader sx={{ minWidth: 'max-content' }}>
          <TableHead>
            <TableRow>
              <TableCell>Tytuł / Opis</TableCell>
              <TableCell align="center">Typ</TableCell>
              <TableCell align="center">Data</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event) => (
              <TableRow
                key={event.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => onEventClick && onEventClick(event)}
              >
                <TableCell sx={{ maxWidth: '300px' }}>
                  <Typography fontWeight={500}>{event.title}</Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {event.description}
                  </Typography>
                  {(event.employeeIds.length > 0 ||
                    event.constructionIds.length > 0) && (
                    <Typography variant="caption" color="text.secondary">
                      {event.employeeIds.length > 0 &&
                        `Osoby: ${event.employeeIds.length} `}
                      {event.constructionIds.length > 0 &&
                        `Budowy: ${event.constructionIds.length}`}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={getCategoryLabel(event.category)}
                    size="small"
                    sx={{
                      minWidth: '50px',
                      bgcolor: getEventColor(event.color),
                      color: getEventTextColor(event.color),
                      fontWeight: 500,
                      fontSize: '0.7rem',
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">{getDate(event)}</Typography>
                </TableCell>
              </TableRow>
            ))}
            {events.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  Brak wydarzeń
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </BaseDialog>
  );
};

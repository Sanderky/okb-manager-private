import React, { useMemo } from 'react';
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
import BaseDialog from '@/shared/ui/BaseDialog';
import { type CalendarDay, type CalendarEvent } from '../../model/types';
import { Add } from '@mui/icons-material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Dayjs } from 'dayjs';
import { getDateStr } from '@/shared/lib/string';

interface EventListDialogProps {
  open: boolean;
  onClose: () => void;
  onEventClick: (event: CalendarEvent) => void;
  selectedDayData: CalendarDay | null;
  loading?: boolean;
  onAddButtonClick: (date?: Dayjs | undefined) => void;
}

export const EventListDialog: React.FC<EventListDialogProps> = ({
  onEventClick,
  open,
  onClose,
  selectedDayData,
  onAddButtonClick,
  loading,
}) => {
  const sortedEvents = useMemo(() => {
    if (!selectedDayData) return [];

    const events = selectedDayData?.events ?? [];

    return events.sort((a, b) => {
      const aIsStart = selectedDayData.date.isSame(a.startDate, 'day');
      const aIsEnd = selectedDayData.date.isSame(a.endDate, 'day');
      const bIsStart = selectedDayData.date.isSame(b.startDate, 'day');
      const bIsEnd = selectedDayData.date.isSame(b.endDate, 'day');

      if (aIsStart && !aIsEnd && !(bIsStart && !bIsEnd)) return -1;
      if (bIsStart && !bIsEnd && !(aIsStart && !aIsEnd)) return 1;

      if (!aIsStart && aIsEnd && !(!bIsStart && bIsEnd)) return -1;
      if (!bIsStart && bIsEnd && !(!aIsStart && aIsEnd)) return 1;

      if (!aIsStart && !aIsEnd && (bIsStart || bIsEnd)) return 1;
      if (!bIsStart && !bIsEnd && (aIsStart || aIsEnd)) return -1;

      return a.startDate.valueOf() - b.startDate.valueOf();
    });
  }, [selectedDayData]);

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={
        <Stack direction={'row'} alignItems={'center'} spacing={1}>
          <Typography variant="h6">
            Urlopy ({selectedDayData?.events.length})
          </Typography>
          <span>-</span>
          <Chip
            color="primary"
            label={selectedDayData?.date.format('DD.MM.YYYY')}
          />
        </Stack>
      }
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
      showConfirm={false}
      cancelText="Zamknij"
      maxWidth="md"
      contentSx={{
        p: 0,
      }}
    >
      <Stack direction="column" spacing={1}>
        <TableContainer
          component={Paper}
          className="rounded-none shadow-none"
          sx={{ maxHeight: 600, overflow: 'auto' }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Pracownik</TableCell>
                <TableCell>Okres urlopu</TableCell>
                <TableCell>Długość</TableCell>
                <TableCell>Kolor</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedEvents.length > 0 && selectedDayData ? (
                sortedEvents.map((event) => {
                  const isStart = selectedDayData?.date.isSame(
                    event.startDate,
                    'day'
                  );
                  const isEnd = selectedDayData?.date.isSame(
                    event.endDate,
                    'day'
                  );
                  const duration =
                    event.endDate.diff(event.startDate, 'day') + 1;

                  return (
                    <TableRow
                      key={event.id}
                      hover
                      onClick={() => onEventClick(event)}
                      sx={{
                        cursor: 'pointer',
                      }}
                    >
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight="500"
                          noWrap
                          sx={{
                            textDecoration: event.employeeActive
                              ? 'none'
                              : 'line-through',
                          }}
                        >
                          {event.employeeName}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <PlayArrowIcon
                            sx={{
                              width: 15,
                              visibility: isStart ? 'visible' : 'hidden',
                            }}
                          />

                          <Typography variant="body2">
                            {getDateStr(event.startDate, event.endDate)}
                          </Typography>

                          <PlayArrowIcon
                            sx={{
                              width: 15,
                              transform: 'rotate(180deg)',
                              visibility: isEnd ? 'visible' : 'hidden',
                            }}
                          />
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {duration} {duration < 2 ? 'dzień' : 'dni'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          sx={{
                            background: event.color,
                            minWidth: '50px',
                            borderRadius: 1,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell className="!py-3" colSpan={4}>
                    <Typography variant="body2" fontWeight="500" align="center">
                      Brak wpisów...
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </BaseDialog>
  );
};

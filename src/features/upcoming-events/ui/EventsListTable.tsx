import {
  Badge,
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
  IconButton,
  Popover,
  Stack,
  TableBody,
  TableRow,
  Typography,
} from '@mui/material';
import { FilterList, Notifications } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import {
  EVENT_CATEGORIES,
  getCategoryLabel,
  useEventColor,
  type InfoEvent,
} from '@/entities/events';
import { getDateStr } from '@/shared/lib/string';
import { useUpcomingEventsFacade } from '../model/services/useUpcomingEventsFacade';

interface EventsListTableProps {
  events: InfoEvent[];
  type?: 'all' | 'employee' | 'construction';
}

export const EventsListTable = ({
  type = 'all',
  events,
}: EventsListTableProps) => {
  const { t } = useTranslation(['calendar']);
  const {
    filteredEvents,
    getTitle,
    filtersActive,
    selectedCategories,
    handleFilterChange,
    handleEventClick,
    popoverId,
    popoverOpen,
    anchorEl,
    handleOpenPopover,
    handleClosePopover,
  } = useUpcomingEventsFacade({ type, events });

  const { getEventColor, getEventTextColor } = useEventColor();

  return (
    <table className="w-full">
      <thead>
        <TableRow sx={(theme) => ({ background: theme.palette.accent.main })}>
          <th className="px-4 py-3 text-left">
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              justifyContent="space-between"
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Notifications sx={{ color: 'accent.superDark' }} />
                <Typography variant="subtitle2" fontWeight="600">
                  {`${getTitle()} (${filteredEvents.length}):`}
                </Typography>
              </Stack>

              <Badge
                color="primary"
                variant="dot"
                badgeContent={filtersActive ? 1 : 0}
              >
                <IconButton
                  aria-describedby={popoverId}
                  onClick={handleOpenPopover}
                  sx={{ p: 0.5 }}
                >
                  <FilterList fontSize="small" />
                </IconButton>
              </Badge>

              <Popover
                id={popoverId}
                open={popoverOpen}
                anchorEl={anchorEl}
                onClose={handleClosePopover}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              >
                <FormGroup sx={{ p: 1 }}>
                  {EVENT_CATEGORIES.map((cat) => (
                    <FormControlLabel
                      key={cat}
                      control={
                        <Checkbox
                          checked={selectedCategories.includes(cat)}
                          onChange={() => handleFilterChange(cat)}
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="body2">
                          {getCategoryLabel(cat, t)}
                        </Typography>
                      }
                    />
                  ))}
                </FormGroup>
              </Popover>
            </Stack>
          </th>
        </TableRow>
      </thead>
      <TableBody
        sx={(theme) => ({
          '& > tr:not(:last-child) > td, & > tr:not(:last-child) > th': {
            borderBottom: `1px solid ${theme.palette.divider}`,
          },
          '& > tr:last-child > td, & > tr:last-child > th': {
            borderBottom: 'none',
          },
        })}
      >
        {filteredEvents && filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <TableRow
              key={event.id}
              onClick={() => handleEventClick(event)}
              className="cursor-pointer transition-colors"
              sx={(theme) => ({
                ':hover': { background: theme.palette.accent.light },
                ':active': { background: theme.palette.accent.main },
              })}
            >
              <td className="px-4 py-3">
                <Stack direction="column">
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Typography
                      variant="body2"
                      className="font-medium"
                      color="textSecondary"
                    >
                      {event.title}
                    </Typography>
                    <Chip
                      label={getCategoryLabel(event.category, t)}
                      sx={{
                        color: getEventTextColor(event.color),
                        background: getEventColor(event.color),
                        minWidth: '50px',
                      }}
                      size="small"
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {getDateStr(event.startDate, event.endDate, true)}
                  </Typography>
                </Stack>
              </td>
            </TableRow>
          ))
        ) : (
          <tr>
            <td className="px-4 py-3">
              <Typography variant="body2" color="textSecondary">
                {t('calendar:upcoming.emptyState')}
              </Typography>
            </td>
          </tr>
        )}
      </TableBody>
    </table>
  );
};

import { useState } from 'react';
import {
  alpha,
  Badge,
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
  IconButton,
  List,
  ListItem,
  Popover,
  Stack,
  Typography,
} from '@mui/material';
import {
  Done,
  ExpandLess,
  ExpandMore,
  FilterList,
  Notifications,
} from '@mui/icons-material';
import {
  EVENT_CATEGORIES,
  getCategoryLabel,
  useEventColor,
  type InfoEvent,
} from '@/entities/events';
import { getDateStr } from '@/shared/lib/string';
import Loading from '@/shared/ui/Loading';
import { useUpcomingEventsFacade } from '../model/services/useUpcomingEventsFacade';

interface EventsBoxProps {
  events: InfoEvent[];
  type?: 'all' | 'employee' | 'construction';
  isLoading?: boolean;
}

const MAX_VISIBLE_ITEMS = 2;

export const EventsBox = ({
  events,
  isLoading,
  type = 'all',
}: EventsBoxProps) => {
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

  const [isExpanded, setIsExpanded] = useState(false);
  const { getEventColor, getEventTextColor } = useEventColor();

  const hasMoreItems = filteredEvents.length > MAX_VISIBLE_ITEMS;
  const toggleExpanded = () => setIsExpanded(!isExpanded);

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 1 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Notifications color="primary" />
          <Typography variant="body1" className="font-medium">
            {getTitle()}
          </Typography>
          {hasMoreItems && (
            <Chip
              label={`${filteredEvents.length} ${filteredEvents.length > 4 ? 'wydarzeń' : 'wydarzenia'}`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          )}
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
                    {getCategoryLabel(cat)}
                  </Typography>
                }
              />
            ))}
          </FormGroup>
        </Popover>
      </Stack>

      {isLoading ? (
        <Stack direction="row" spacing={1} className="my-5">
          <Loading size={25} message="" />
        </Stack>
      ) : (
        <Box
          sx={(theme) => ({
            position: 'relative',
            '&:after': {
              content: '""',
              pointerEvents: 'none',
              display: isExpanded && !isLoading ? 'none' : 'block',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: 'calc(100% - 34px)',
              boxShadow: hasMoreItems
                ? `inset 0px -25px 10px -15px ${alpha(theme.palette.background.paper, 1)}`
                : 'none',
            },
          })}
        >
          <Box
            sx={{
              maxHeight: isExpanded ? 'none' : 176,
              overflow: 'auto',
              position: 'relative',
            }}
          >
            <List className="mb-2">
              {filteredEvents.length === 0 ? (
                <Stack direction="row" spacing={1}>
                  <Done />
                  <Typography color="textSecondary">
                    Brak nadchodzących wydarzeń
                  </Typography>
                </Stack>
              ) : (
                filteredEvents.map((event) => (
                  <ListItem
                    key={event.groupId}
                    onClick={() => handleEventClick(event, true)}
                    sx={(theme) => ({
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      alignItems: 'flex-start',
                      mb: 1,
                      border: `1px solid ${theme.palette.divider}`,
                      background: theme.palette.accent.light,
                      ':hover': { background: theme.palette.accent.main },
                    })}
                    className="rounded-md last:mb-0"
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      width="100%"
                      alignItems="center"
                    >
                      <Typography variant="subtitle2">{event.title}</Typography>
                      <Chip
                        label={getCategoryLabel(event.category)}
                        variant="filled"
                        sx={{
                          color: getEventTextColor(event.color),
                          backgroundColor: getEventColor(event.color),
                          minWidth: '50px',
                        }}
                        size="small"
                      />
                    </Stack>
                    <Typography variant="body2">
                      {getDateStr(event.startDate, event.endDate, true)}
                    </Typography>
                  </ListItem>
                ))
              )}
            </List>
          </Box>
          {hasMoreItems && (
            <Box sx={{ textAlign: 'center', mb: 1 }}>
              <IconButton onClick={toggleExpanded} size="small">
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

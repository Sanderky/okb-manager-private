import React, { useState, useEffect, useMemo } from 'react';
import {
  TextField,
  Stack,
  Typography,
  Autocomplete,
  Chip,
  Alert,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
  Divider,
  FormControl,
  Checkbox,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import BaseDialog from '../../../components/BaseDialog';
import {
  getCategoryLabel,
  type CalendarEvent,
  type CalendarDay,
  AVAILABLE_CATEGORIES,
} from './CalendarHelpers';
import type {
  Construction,
  Employee,
  EventCategory,
  EventColor,
} from '../../../types';
import { plPL } from '@mui/x-date-pickers/locales';
import { useEventColor } from './useEventColor';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonIcon from '@mui/icons-material/Person';
import ConstructionIcon from '@mui/icons-material/Construction';
import { useNavigate } from 'react-router-dom';
import { Add } from '@mui/icons-material';
import type { Dayjs } from 'dayjs';
import { getDateStr } from '../Vacations/VacationsHelpers';

const COLORS_LIST: EventColor[] = [
  'red',
  'orange',
  'blue',
  'green',
  'primary',
  'secondary',
];

interface EventDetailsProps {
  event: Partial<CalendarEvent>;
  employees: Employee[];
  constructions: Construction[];
}

const EventDetails: React.FC<EventDetailsProps> = ({
  event,
  employees,
  constructions,
}) => {
  const navigate = useNavigate();

  const handleEmployeeClick = (id: string) => navigate(`/employees/${id}`);
  const handleConstructionClick = (id: string) =>
    navigate(`/constructions/${id}`);

  const assignedEmployees = employees.filter((e) =>
    event.employeeIds?.includes(e.id)
  );
  const assignedConstructions = constructions.filter((c) =>
    event.constructionIds?.includes(c.id)
  );

  return (
    <Stack spacing={2.5} sx={{ mt: 1 }}>
      <Stack spacing={1}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems={'center'}
          gap={1}
        >
          <Chip
            label={getCategoryLabel(event.category || 'info')}
            size="small"
            variant="outlined"
            sx={{
              minWidth: '50px',
            }}
          />
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            color="text.secondary"
          >
            <CalendarMonthIcon fontSize="small" />
            <Typography variant="body2" fontWeight={500}>
              {getDateStr(event.startDate, event.endDate, true)}
            </Typography>
          </Stack>
        </Stack>
        <Divider />
        <Box>
          <Typography variant="subtitle1" fontWeight={500} gutterBottom>
            {event.title || 'Bez tytułu'}
          </Typography>
          {event.description ? (
            <Typography
              variant="body2"
              sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary' }}
            >
              {event.description}
            </Typography>
          ) : (
            <Typography
              variant="body2"
              color="text.disabled"
              fontStyle="italic"
            >
              Brak dodatkowego opisu
            </Typography>
          )}
        </Box>
      </Stack>

      {assignedEmployees.length > 0 && (
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <PersonIcon color="action" fontSize="small" />
            <Typography variant="subtitle2" color="text.secondary">
              Powiązani pracownicy:
            </Typography>
          </Stack>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {assignedEmployees.map((emp) => (
              <Chip
                key={emp.id}
                label={emp.name}
                variant="outlined"
                size="small"
                onClick={() => handleEmployeeClick(emp.id)}
                sx={{
                  cursor: 'pointer',
                  transform: 'scale 0.5s ease',
                  ':hover': {
                    scale: '1.05',
                  },
                  textDecoration: emp.status ? '' : 'line-through',
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {assignedConstructions.length > 0 && (
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <ConstructionIcon color="action" fontSize="small" />
            <Typography variant="subtitle2" color="text.secondary">
              Powiązane budowy:
            </Typography>
          </Stack>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {assignedConstructions.map((constr) => (
              <Chip
                key={constr.id}
                label={constr.name}
                variant="outlined"
                size="small"
                onClick={() => handleConstructionClick(constr.id)}
                sx={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                  ':hover': {
                    transform: 'scale(1.05)',
                  },
                  textDecoration: constr.status ? '' : 'line-through',
                }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Stack>
  );
};

interface EventFormProps {
  currentEvent: Partial<CalendarEvent>;
  setEvent: (updates: Partial<CalendarEvent>) => void;
  employees: Employee[];
  constructions: Construction[];
  validationError: string;
  loading: boolean;
}

const EventForm: React.FC<EventFormProps> = ({
  currentEvent,
  setEvent,
  employees,
  constructions,
  validationError,
  loading,
}) => {
  const selectedEmployeeIds = currentEvent.employeeIds || [];
  const selectedConstructionIds = currentEvent.constructionIds || [];
  const { getEventColor } = useEventColor();

  const constructionsOptions = useMemo(() => {
    return constructions.filter((c) => c.status);
  }, [constructions]);
  const employeesOptions = useMemo(() => {
    return employees.filter((e) => e.status);
  }, [employees]);
  return (
    <Stack rowGap={2} sx={{ mt: 1 }}>
      <TextField
        select
        label="Kategoria *"
        size="small"
        value={currentEvent.category || 'other'}
        onChange={(e) =>
          setEvent({ category: e.target.value as EventCategory })
        }
        disabled={loading}
        sx={{ flex: 1 }}
      >
        {AVAILABLE_CATEGORIES.map((cat) => (
          <MenuItem key={cat} value={cat}>
            {getCategoryLabel(cat)}
          </MenuItem>
        ))}
      </TextField>

      <Box>
        <Typography variant="caption" color="textSecondary" p={0} m={0}>
          Wybierz kolor *
        </Typography>

        <Stack direction="row" gap={1} flexWrap="wrap" mt={1}>
          {COLORS_LIST.map((color) => (
            <Box
              key={color}
              sx={(theme) => ({
                width: 25,
                height: 25,
                backgroundColor: getEventColor(color || 'blue'),
                cursor: 'pointer',
                borderRadius: 1,
                border:
                  currentEvent.color === color
                    ? `2px solid ${theme.palette.text.primary}`
                    : '',
              })}
              onClick={() => setEvent({ color: color })}
            />
          ))}
        </Stack>
      </Box>

      <TextField
        label="Tytuł wydarzenia *"
        size="small"
        value={currentEvent.title || ''}
        onChange={(e) => setEvent({ title: e.target.value })}
        disabled={loading}
        error={!!validationError && !currentEvent.title}
        autoFocus
      />

      <TextField
        label="Opis"
        multiline
        size="small"
        minRows={4}
        value={currentEvent.description || ''}
        onChange={(e) => setEvent({ description: e.target.value })}
        disabled={loading}
        slotProps={{
          input: {
            spellCheck: 'false',
          },
        }}
      />

      <LocalizationProvider
        localeText={
          plPL.components.MuiLocalizationProvider.defaultProps.localeText
        }
        dateAdapter={AdapterDayjs}
        adapterLocale="pl"
      >
        <Stack direction="row" spacing={2}>
          <DatePicker
            label="Od *"
            value={currentEvent.startDate || null}
            onChange={(date) => date && setEvent({ startDate: date })}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
            disabled={loading}
          />
          <DatePicker
            label="Do *"
            value={currentEvent.endDate || null}
            onChange={(date) => date && setEvent({ endDate: date })}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
            minDate={currentEvent.startDate || undefined}
            disabled={loading}
          />
        </Stack>
      </LocalizationProvider>

      <FormControl sx={{ width: '100%', maxWidth: '100%' }}>
        <Autocomplete
          size="small"
          multiple
          disabled={loading}
          disableCloseOnSelect
          options={employeesOptions}
          getOptionLabel={(option) => option.name}
          value={employees.filter((e) => selectedEmployeeIds.includes(e.id))}
          onChange={(_, newValue) => {
            setEvent({ employeeIds: newValue.map((e) => e.id) });
          }}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          renderOption={(props, option, { selected }) => {
            const { key, ...optionProps } = props;
            return (
              <li key={key} {...optionProps}>
                <Checkbox checked={selected} />
                {option.name}
                {!option.status && (
                  <Chip
                    label="Nieaktywny"
                    size="small"
                    color="default"
                    variant="outlined"
                    sx={{ ml: 1, height: 20 }}
                  />
                )}
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField {...params} label="Powiązani pracownicy" size="small" />
          )}
        />
      </FormControl>

      <FormControl sx={{ width: '100%', maxWidth: '100%' }}>
        <Autocomplete
          size="small"
          multiple
          disabled={loading}
          disableCloseOnSelect
          options={constructionsOptions}
          getOptionLabel={(option) => option.name}
          value={constructions.filter((c) =>
            selectedConstructionIds.includes(c.id)
          )}
          onChange={(_, newValue) => {
            setEvent({ constructionIds: newValue.map((c) => c.id) });
          }}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          renderOption={(props, option, { selected }) => {
            const { key, ...optionProps } = props;
            return (
              <li key={key} {...optionProps}>
                <Checkbox checked={selected} />
                {option.name}
                {!option.status && (
                  <Chip
                    label="Zakończona"
                    size="small"
                    color="default"
                    variant="outlined"
                    sx={{ ml: 1, height: 20 }}
                  />
                )}
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField {...params} label="Powiązane budowy" size="small" />
          )}
        />
      </FormControl>

      {validationError && <Alert severity="error">{validationError}</Alert>}
    </Stack>
  );
};

interface AddEventDialogProps {
  open: boolean;
  currentEvent: Partial<CalendarEvent>;
  validationError: string;
  employees: Employee[];
  constructions: Construction[];
  handleModalClose: () => void;
  handleAddEvent: (eventData: Partial<CalendarEvent>) => void;
  loading?: boolean;
}

export const AddEventDialog: React.FC<AddEventDialogProps> = ({
  open,
  currentEvent,
  ...props
}) => {
  const [internalEvent, setInternalEvent] =
    useState<Partial<CalendarEvent>>(currentEvent);

  useEffect(() => {
    if (open) {
      setInternalEvent(currentEvent);
    }
  }, [open, currentEvent]);

  const handleUpdate = (updates: Partial<CalendarEvent>) => {
    setInternalEvent((prev) => ({ ...prev, ...updates }));
  };

  const { getEventColor, getEventTextColor } = useEventColor();

  return (
    <BaseDialog
      open={open}
      onClose={props.handleModalClose}
      onConfirm={() => props.handleAddEvent(internalEvent)}
      confirmText="Dodaj"
      titleSx={{
        background: getEventColor(internalEvent.color ?? 'blue'),
        '& .MuiButtonBase-root': {
          color: getEventTextColor(internalEvent.color ?? 'blue'),
        },
      }}
      title={
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography
            variant="h6"
            sx={{
              color: getEventTextColor(internalEvent.color ?? 'blue'),
            }}
          >
            Nowe wydarzenie
          </Typography>
        </Stack>
      }
      loading={props.loading}
      showCancel={false}
    >
      <EventForm
        currentEvent={internalEvent}
        setEvent={handleUpdate}
        employees={props.employees}
        constructions={props.constructions}
        validationError={props.validationError}
        loading={!!props.loading}
      />
    </BaseDialog>
  );
};

interface EditEventDialogProps {
  currentEvent: Partial<CalendarEvent>;
  setCurrentEvent: React.Dispatch<React.SetStateAction<Partial<CalendarEvent>>>;
  validationError: string;
  employees: Employee[];
  constructions: Construction[];
  handleResetError: () => void;
  handleModalClose: () => void;
  open: boolean;
  handleDeleteEvent: () => void;
  handleEditEvent: (eventData: Partial<CalendarEvent>) => void;
  loading?: boolean;
}

export const EditEventDialog: React.FC<EditEventDialogProps> = ({
  open,
  currentEvent,
  // setCurrentEvent,
  handleResetError,
  ...props
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const [internalEvent, setInternalEvent] =
    useState<Partial<CalendarEvent>>(currentEvent);

  useEffect(() => {
    if (open) {
      setInternalEvent(currentEvent);
      setIsEditing(false);
    }
  }, [open, currentEvent]);

  const handleUpdateInternal = (updates: Partial<CalendarEvent>) => {
    setInternalEvent((prev) => ({ ...prev, ...updates }));
  };

  const handleStartEditing = () => {
    setInternalEvent(currentEvent);
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setInternalEvent(currentEvent);
    setIsEditing(false);
    handleResetError();
  };

  const handleSave = () => {
    props.handleEditEvent(internalEvent);
  };

  const { getEventColor, getEventTextColor } = useEventColor();

  return (
    <BaseDialog
      open={open}
      onClose={props.handleModalClose}
      titleSx={{
        background: getEventColor(internalEvent.color ?? 'blue'),
        '& .MuiButtonBase-root': {
          color: getEventTextColor(internalEvent.color ?? 'blue'),
        },
      }}
      title={
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography
            variant="h6"
            sx={{
              color: getEventTextColor(internalEvent.color ?? 'blue'),
            }}
          >
            {isEditing ? 'Edycja wydarzenia' : 'Szczegóły wydarzenia'}
          </Typography>
        </Stack>
      }
      loading={props.loading}
      actions={
        isEditing ? (
          <>
            <Button
              key={'cancel'}
              onClick={handleCancelEditing}
              disabled={props.loading}
              color="inherit"
              variant="outlined"
              sx={{ mr: 'auto' }}
            >
              Anuluj
            </Button>
            <Button
              key="save"
              variant="contained"
              onClick={handleSave}
              disabled={props.loading}
            >
              Zapisz
            </Button>
          </>
        ) : (
          <>
            <Button
              color="error"
              onClick={props.handleDeleteEvent}
              disabled={props.loading}
              variant="outlined"
              sx={{ mr: 'auto' }}
            >
              Usuń
            </Button>
            <Button variant="outlined" onClick={handleStartEditing}>
              Edytuj
            </Button>
          </>
        )
      }
    >
      {isEditing ? (
        <EventForm
          currentEvent={internalEvent}
          setEvent={handleUpdateInternal}
          employees={props.employees}
          constructions={props.constructions}
          validationError={props.validationError}
          loading={!!props.loading}
        />
      ) : (
        <EventDetails
          event={internalEvent}
          employees={props.employees}
          constructions={props.constructions}
        />
      )}
    </BaseDialog>
  );
};

interface EventListDialogProps {
  open: boolean;
  onClose: () => void;
  onEventClick?: (event: CalendarEvent) => void;
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
  const events = selectedDayData?.events ?? [];
  const { getEventColor, getEventTextColor } = useEventColor();

  const getDate = (event: CalendarEvent) => {
    if (!event) return '';
    if (event.startDate.isSame(event.endDate))
      return event.startDate.format('DD.MM');
    return `${event.startDate.format('DD.MM')} - ${event.endDate.format('DD.MM')}`;
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={
        <Stack direction={'row'} alignItems={'center'} spacing={1}>
          <Typography variant="h6">
            Wydarzenia ({selectedDayData?.events.length})
          </Typography>
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

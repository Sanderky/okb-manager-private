import React, { useMemo } from 'react';
import {
  TextField,
  Stack,
  Typography,
  Autocomplete,
  Chip,
  Alert,
  Box,
  MenuItem,
  FormControl,
  Checkbox,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { plPL } from '@mui/x-date-pickers/locales';
import type { Construction } from '@/entities/construction';
import type { Employee } from '@/entities/employee';
import {
  EVENT_CATEGORIES,
  EVENT_COLORS,
  getCategoryLabel,
  useEventColor,
  type EventCategory,
} from '@/entities/events';
import type { UiCalendarEvent } from '../../../model/types';
import dayjs from 'dayjs';

interface EventFormProps {
  currentEvent: Partial<UiCalendarEvent>;
  setEvent: (updates: Partial<UiCalendarEvent>) => void;
  employees: Employee[];
  constructions: Construction[];
  validationError: string;
  loading: boolean;
}

export const EventForm: React.FC<EventFormProps> = ({
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
        {EVENT_CATEGORIES.map((cat) => (
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
          {EVENT_COLORS.map((color) => (
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
        slotProps={{ input: { spellCheck: 'false' } }}
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
            value={
              currentEvent.startDate ? dayjs(currentEvent.startDate) : null
            }
            onChange={(date) => date && setEvent({ startDate: date })}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
            disabled={loading}
          />
          <DatePicker
            label="Do *"
            value={currentEvent.endDate ? dayjs(currentEvent.endDate) : null}
            onChange={(date) => date && setEvent({ endDate: date })}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
            minDate={
              currentEvent.startDate ? dayjs(currentEvent.startDate) : undefined
            }
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
          onChange={(_, newValue) =>
            setEvent({ employeeIds: newValue.map((e) => e.id) })
          }
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
          onChange={(_, newValue) =>
            setEvent({ constructionIds: newValue.map((c) => c.id) })
          }
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

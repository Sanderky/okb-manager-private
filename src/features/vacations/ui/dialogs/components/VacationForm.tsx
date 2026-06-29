import React from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  FormLabel,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useTranslation } from 'react-i18next';
import type { Employee } from '@/entities/employee';
import { employeeColors } from '@/entities/vacations';
import { stringToColor } from '@/shared/lib/stringToColor';
import type { CalendarEvent } from '../../../model/types';

interface VacationFormProps {
  currentEvent: CalendarEvent;
  setEvent: (updates: Partial<CalendarEvent>) => void;
  employees: Employee[];
  validationError: string;
  loading: boolean;
  isNew: boolean;
}

export const VacationForm: React.FC<VacationFormProps> = ({
  currentEvent,
  setEvent,
  employees,
  validationError,
  loading,
  isNew,
}) => {
  const { t, i18n } = useTranslation('vacations');
  const theme = useTheme();

  const currentLang = i18n.language.substring(0, 2).toLowerCase();

  const generatedColor = currentEvent.employeeId
    ? stringToColor(currentEvent.employeeId)
    : theme.palette.background.paper;

  const selectedEmployee =
    employees.find((e) => e.id === currentEvent.employeeId) || null;

  return (
    <Stack spacing={2} sx={{ mt: 1 }}>
      {isNew ? (
        <Autocomplete
          size="small"
          options={employees.filter((e) => e.status)}
          getOptionLabel={(opt) => opt?.name || ''}
          value={selectedEmployee}
          onChange={(_, newValue) => {
            if (newValue) {
              const newColor = stringToColor(newValue.id);
              setEvent({
                employeeId: newValue.id,
                employeeName: newValue.name,
                employeeActive: newValue.status,
                color: currentEvent.color || newColor,
              });
            } else {
              setEvent({
                employeeId: '',
                employeeName: '',
                employeeActive: false,
              });
            }
          }}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('dialogs.vacationForm.employeeRequired')}
              error={!!validationError && !currentEvent.employeeId}
              helperText={
                validationError && !currentEvent.employeeId
                  ? validationError
                  : ''
              }
              disabled={loading}
            />
          )}
          disabled={loading}
        />
      ) : (
        <TextField
          size="small"
          label={t('dialogs.vacationForm.employee')}
          value={currentEvent.employeeName ?? ''}
          fullWidth
          slotProps={{ input: { readOnly: true } }}
          sx={(theme) => ({
            '& .MuiInputBase-root': {
              background: theme.palette.action.disabledBackground,
            },
          })}
        />
      )}

      <TextField
        label={t('dialogs.vacationForm.description')}
        multiline
        minRows={4}
        slotProps={{ input: { spellCheck: false } }}
        value={currentEvent.description || ''}
        onChange={(e) => setEvent({ description: e.target.value })}
        disabled={loading}
      />

      <LocalizationProvider
        dateAdapter={AdapterDayjs}
        adapterLocale={currentLang}
      >
        <Stack direction="row" spacing={{ xs: 1, sm: 2 }}>
          <DatePicker
            label={t('dialogs.vacationForm.startDate')}
            openTo="month"
            views={['year', 'month', 'day']}
            value={currentEvent.startDate || null}
            onChange={(date) => date && setEvent({ startDate: date })}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
            disabled={loading}
          />
          <DatePicker
            label={t('dialogs.vacationForm.endDate')}
            openTo="month"
            views={['year', 'month', 'day']}
            value={currentEvent.endDate || null}
            onChange={(date) => date && setEvent({ endDate: date })}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
            minDate={currentEvent.startDate || undefined}
            disabled={loading}
          />
        </Stack>
      </LocalizationProvider>

      <Box>
        <FormLabel>{t('dialogs.vacationForm.selectColor')}</FormLabel>
        {!currentEvent.color && validationError && (
          <Typography
            variant="caption"
            color="error"
            sx={{ display: 'block', mt: 0.5 }}
          >
            {validationError}
          </Typography>
        )}
        <Stack direction="row" gap={1} flexWrap="wrap" mt={1}>
          <Box
            sx={{
              width: 35,
              height: 25,
              backgroundColor: generatedColor,
              cursor: 'pointer',
              borderRadius: 1,
              border:
                currentEvent.color === generatedColor || !currentEvent.color
                  ? `2px solid ${theme.palette.text.primary}`
                  : !currentEvent.employeeId
                    ? `1px solid ${theme.palette.divider}`
                    : '',
            }}
            onClick={() => setEvent({ color: generatedColor })}
          />
          {employeeColors.map((color) => (
            <Box
              key={color}
              sx={(theme) => ({
                width: 25,
                height: 25,
                backgroundColor: color,
                cursor: 'pointer',
                borderRadius: 1,
                border:
                  currentEvent.color === color
                    ? `2px solid ${theme.palette.text.primary}`
                    : '',
              })}
              onClick={() => setEvent({ color })}
            />
          ))}
        </Stack>
      </Box>

      {validationError && currentEvent.employeeId && currentEvent.color && (
        <Alert severity="error">{validationError}</Alert>
      )}
    </Stack>
  );
};

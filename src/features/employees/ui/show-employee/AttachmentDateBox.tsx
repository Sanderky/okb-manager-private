// features/employees/ui/AttachmentDateBox.tsx
import React from 'react';
import { Grid, Stack, Typography, Alert, useTheme } from '@mui/material';
import dayjs from 'dayjs';
import type { Employee, EmployeeAlert } from '@/entities/employee';

interface AttachmentDateBoxProps {
  dateKey: keyof Employee;
  label: string;
  employeeData: Employee | null;
  alerts: EmployeeAlert[];
}

export const AttachmentDateBox = ({
  dateKey,
  label,
  employeeData,
  alerts,
}: AttachmentDateBoxProps) => {
  const theme = useTheme();

  if (!employeeData) return null;

  const dateValue = employeeData[dateKey];
  const isContractEndDate = dateKey === 'contractEndDate';
  const isA1EndDate = dateKey === 'a1EndDate';
  const isPermanent = isContractEndDate
    ? Boolean(employeeData.contractIsPermanent)
    : false;

  let displayValue: React.ReactNode;

  let activeAlert = alerts.find(
    (a) => a.id.includes(employeeData.id) && a.id.includes(dateKey)
  );

  let textColor = theme.palette.text.primary;
  let borderColor = theme.palette.text.primary;
  let bgColor = '';

  if (isContractEndDate && isPermanent) {
    displayValue = 'Umowa na czas nieokreślony';
  } else if (dateValue instanceof Date) {
    displayValue = dayjs(dateValue).format('DD.MM.YYYY');

    const alertSuffix = isContractEndDate
      ? '_contract'
      : isA1EndDate
        ? '_a1'
        : '';

    if (alertSuffix) {
      activeAlert = alerts.find(
        (a) => a.id === `${employeeData.id}${alertSuffix}`
      );
    }
  } else {
    textColor = theme.palette.text.disabled;
    borderColor = theme.palette.text.disabled;
    displayValue = <em>Brak</em>;
  }

  if (activeAlert) {
    if (activeAlert.severity === 'error') {
      textColor = theme.palette.error.main;
      borderColor = theme.palette.error.main;
      // bgColor = alpha(theme.palette.error.main, 0.1);
      bgColor = '';
    } else if (activeAlert.severity === 'warning') {
      textColor = theme.palette.warning.main;
      borderColor = theme.palette.warning.main;
      // bgColor = alpha(theme.palette.warning.main, 0.1);
      bgColor = '';
    }
  } else if (isPermanent) {
    textColor = theme.palette.text.primary;
    borderColor = theme.palette.text.primary;
  }

  return (
    <Grid key={dateKey} size={{ xs: 12 }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        justifyContent="flex-start"
        alignItems={{ xs: 'flex-start', lg: 'center' }}
        spacing={{ xs: 1, lg: 2 }}
        sx={{ width: '100%' }}
      >
        <Typography variant="body2" className="font-medium">
          {label}:
        </Typography>
        <Typography
          variant="body2"
          className={`rounded px-3 py-1`}
          sx={{
            border: `1px solid ${borderColor}`,
            background: bgColor,
            color: textColor,
          }}
        >
          {displayValue}
        </Typography>
      </Stack>

      {activeAlert && (
        <Alert
          severity={activeAlert.severity}
          sx={{
            width: '100%',
            mt: 2,
            borderColor: `${activeAlert.severity}.main`,
            borderWidth: '1px',
          }}
        >
          <Typography variant="body2">{activeAlert.message}</Typography>
        </Alert>
      )}
    </Grid>
  );
};

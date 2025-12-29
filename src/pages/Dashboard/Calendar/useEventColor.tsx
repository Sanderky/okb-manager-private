import { darken, useTheme } from '@mui/material';
import { useCallback } from 'react';
import type { InfoEventSeverity } from '../../../types';

export const useEventColor = () => {
  const theme = useTheme();

  const getEventColor = useCallback(
    (severity: InfoEventSeverity) => {
      switch (severity) {
        case 'error':
          return theme.palette.error.light;
        case 'warning':
          return theme.palette.warning.light;
        case 'success':
          return theme.palette.success.light;
        case 'info':
          return theme.palette.info.light;
        case 'hotel':
          return theme.palette.secondary.light;
        case 'employee':
          return theme.palette.background.default;
        default:
          return theme.palette.primary.main;
      }
    },
    [theme]
  );

  const getEventTextColor = useCallback(
    (severity: InfoEventSeverity) => {
      switch (severity) {
        case 'error':
          return theme.palette.error.contrastText;
        case 'warning':
          return theme.palette.warning.contrastText;
        case 'success':
          return theme.palette.success.contrastText;
        case 'info':
          return theme.palette.info.contrastText;
        case 'hotel':
          return theme.palette.secondary.contrastText;
        case 'employee':
          return theme.palette.text.primary;
        case 'other':
          return theme.palette.primary.contrastText;
        default:
          return theme.palette.text.primary;
      }
    },
    [theme]
  );
  // const getEventTextColor = useCallback(
  //   (severity: InfoEventSeverity) => {
  //     const eventColor = getEventColor(severity);
  //     const isLightColor = theme.palette.getContrastText(eventColor) !== '#fff';
  //     return isLightColor ? darken(eventColor, 0.55) : '#ffffff';
  //   },
  //   [theme]
  // );

  return { getEventColor, getEventTextColor };
};

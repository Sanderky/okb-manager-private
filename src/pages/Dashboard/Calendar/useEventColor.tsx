import { useTheme } from '@mui/material';
import { useCallback } from 'react';
import type { EventColor } from '../../../types';

export const useEventColor = () => {
  const theme = useTheme();

  const getEventColor = useCallback(
    (color: EventColor): string => {
      switch (color) {
        case 'primary':
          return theme.palette.primary.main;
        case 'secondary':
          return theme.palette.secondary.main;
        case 'red':
          return theme.palette.event.red;
        case 'orange':
          return theme.palette.event.orange;
        case 'green':
          return theme.palette.event.green;
        case 'blue':
          return theme.palette.event.blue;
        default:
          return theme.palette.primary.main;
      }
    },
    [theme]
  );

  const getEventTextColor = useCallback(
    (color: EventColor): string => {
      const bgColor = getEventColor(color);

      return theme.palette.getContrastText(bgColor);
    },
    [theme, getEventColor]
  );

  return { getEventColor, getEventTextColor };
};

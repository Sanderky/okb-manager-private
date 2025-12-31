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
          return theme.palette.error.main;
        case 'orange':
          return theme.palette.warning.main;
        case 'green':
          return theme.palette.success.main;
        case 'blue':
          return theme.palette.info.main;
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

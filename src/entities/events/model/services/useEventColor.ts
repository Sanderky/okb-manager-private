import type { EventColor } from '@/entities/events';
import { useTheme } from '@mui/material';
import { useCallback, useMemo } from 'react';

export const useEventColor = () => {
  const theme = useTheme();

  const colorMap = useMemo<Record<EventColor, string>>(
    () => ({
      primary: theme.palette.primary.main,
      secondary: theme.palette.secondary.main,
      red: theme.palette.event.red,
      orange: theme.palette.event.orange,
      green: theme.palette.event.green,
      blue: theme.palette.event.blue,
    }),
    [theme]
  );

  const getEventColor = useCallback(
    (color: EventColor): string => {
      return colorMap[color] ?? theme.palette.primary.main;
    },
    [colorMap, theme]
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

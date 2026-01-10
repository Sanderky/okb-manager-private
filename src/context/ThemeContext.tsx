import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  createTheme,
  ThemeProvider,
  type PaletteMode,
  alpha,
} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

declare module '@mui/material/styles' {
  interface Palette {
    hours: { warning: string; error: string };
    loadingOverlay: string;
    tableHover: string;
    vacation: string;
    location: string;
    schedule: {
      past: string;
      current: string;
      accent: string;
      hoverRow: string;
      hoverCell: string;
    };
    calendar: {
      hoverDay: string;
      selectedDay: string;
      hoverSelectedDay: string;
      dayOut: string;
      currentDay: string;
    };
    status: {
      employee: Status;
      construction: Status;
    };
    accent: {
      light: string;
      main: string;
      dark: string;
      superDark: string;
    };
    event: {
      red: string;
      orange: string;
      green: string;
      blue: string;
    };
  }

  interface Theme {
    hoursTable: { borderBold: string };
  }

  interface ThemeOptions {
    hoursTable: { borderBold: string };
  }

  interface Status {
    active: { text: string; background: string };
    inactive: { text: string; background: string };
  }

  interface PaletteOptions {
    loadingOverlay: string;
    tableHover: string;
    accent: { light: string; main: string; dark: string; superDark: string };
    vacation: string;
    location: string;
    schedule?: {
      past: string;
      current: string;
      accent: string;
      hoverRow: string;
      hoverCell: string;
    };
    hours: { warning: string; error: string };
    calendar?: {
      hoverDay: string;
      selectedDay: string;
      hoverSelectedDay: string;
      dayOut: string;
      currentDay: string;
    };
    status: { employee: Status; construction: Status };
    event?: {
      red: string;
      orange: string;
      green: string;
      blue: string;
    };
  }

  interface TypeBackground {
    default: string;
    paper: string;
    grid: string;
    gradient: string;
  }
}

const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // ==============================
          // LIGHT MODE
          // ==============================
          text: {
            primary: 'rgba(0, 0, 0, 0.87)',
            secondary: 'rgba(0, 0, 0, 0.6)',
          },
          error: {
            main: '#d32f2f',
            light: '#ffcdd2',
            dark: '#c62828',
            contrastText: '#fff',
          },
          warning: {
            main: '#ed6c02',
            light: '#ffcc80',
            dark: '#e65100',
            contrastText: '#fff',
          },
          info: {
            main: '#0288d1',
            light: '#b3e5fc',
            dark: '#01579b',
            contrastText: '#fff',
          },
          success: {
            main: '#2e7d32',
            light: '#a5d6a7',
            dark: '#1b5e20',
            contrastText: '#fff',
          },

          hours: {
            error: alpha('#d50000', 0.3),
            warning: alpha('#ef6c00', 0.3),
          },
          tableHover: '#deeaf6',
          loadingOverlay: 'rgba(255, 255, 255, 0.5)',
          action: {
            hover: '#deeaf6',
          },

          primary: {
            main: '#6366F1',
            light: '#8184F5',
            dark: '#4548A8',
            contrastText: '#FFFFFF',
          },
          secondary: {
            main: '#ffd85f',
            light: '#FEEA84',
            dark: '#A16207',
            contrastText: '#000000',
          },

          vacation: '#b45309',
          location: '#60a5fa',
          // location: '#000080',

          accent: {
            light: '#eff6ff80',
            main: '#dbeafe',
            dark: '#1d4ed840',
            superDark: '#1e40af',
          },
          background: {
            paper: '#fff',
            default: '#f5f5f4',
            grid: 'linear-gradient(to right, #e4e4e780 1px, transparent 1px), linear-gradient(to bottom, #e4e4e780 1px, transparent 1px)',
            gradient: 'linear-gradient(150deg, #fcfbf5 30%, #ffd85f80 100%)',
          },
          schedule: {
            past: '#fecaca',
            current: '#bbf7d0',
            accent: '#bfdbfe',
            hoverRow: '#deeaf6',
            hoverCell: '#5c6dff8',
          },
          calendar: {
            hoverDay: '#deeaf6',
            selectedDay: '#dbeafe',
            hoverSelectedDay: '#87CEFA',
            dayOut: '#fafafa',
            currentDay: '#1d4ed8',
          },
          status: {
            employee: {
              active: { text: '#16a34a', background: alpha('#86efac', 0.5) },
              inactive: { text: '#dc2626', background: alpha('#fca5a5', 0.5) },
            },
            construction: {
              active: { text: '#2563eb', background: alpha('#93c5fd', 0.5) },
              inactive: { text: '#d97706', background: alpha('#fcd34d', 0.5) },
            },
          },
          event: {
            red: '#d23a3a',
            orange: '#f7a33a',
            green: '#5fd79a',
            blue: '#60afff',
          },
        }
      : {
          // ==============================
          // DARK MODE
          // ==============================
          text: {
            primary: '#e4e4e7',
            secondary: '#a1a1aa',
          },
          error: {
            main: '#d32f2f',
            light: '#ffcdd2',
            dark: '#c62828',
            contrastText: '#fff',
          },
          warning: {
            main: '#ed6c02',
            light: '#ffcc80',
            dark: '#e65100',
            contrastText: '#fff',
          },
          info: {
            main: '#0288d1',
            light: '#b3e5fc',
            dark: '#01579b',
            contrastText: '#fff',
          },
          success: {
            main: '#2e7d32',
            light: '#a5d6a7',
            dark: '#1b5e20',
            contrastText: '#fff',
          },

          hours: {
            error: 'rgba(211, 47, 47, 0.25)',
            warning: 'rgba(237, 108, 2, 0.25)',
          },
          tableHover: '#27272a',
          action: {
            hover: '#27272a',
          },
          loadingOverlay: 'rgba(0, 0, 0, 0.2)',

          primary: {
            main: '#6366F1',
            light: '#8184F5',
            dark: '#4548A8',
            contrastText: '#FFFFFF',
          },
          secondary: {
            main: '#ffd85f',
            light: '#FEEA84',
            dark: '#A16207',
            contrastText: '#000000',
          },

          vacation: '#d97706',
          location: '#60a5fa',

          accent: {
            light: 'rgba(30, 41, 59, 0.4)',
            main: '#0f172a',
            dark: '#020617',
            superDark: '#e4e4e7',
          },
          background: {
            paper: '#15181b',
            default: '#0f1214',
            grid: 'linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
            gradient: '',
          },
          schedule: {
            past: 'rgba(69, 10, 10, 1)',
            current: 'rgba(5, 46, 22, 1)',
            accent: 'rgba(23, 37, 84, 1)',
            hoverRow: '#27272a',
            hoverCell: 'rgba(255, 255, 255, 0.08)',
          },
          calendar: {
            hoverDay: '#27272a',
            selectedDay: '#312e81',
            hoverSelectedDay: '#3730a3',
            dayOut: '#09090b',
            currentDay: '#4f46e5',
          },
          status: {
            employee: {
              active: { text: '#86efac', background: 'rgba(20, 83, 45, 0.4)' },
              inactive: {
                text: '#fca5a5',
                background: 'rgba(127, 29, 29, 0.4)',
              },
            },
            construction: {
              active: { text: '#93c5fd', background: 'rgba(30, 58, 138, 0.4)' },
              inactive: {
                text: '#fcd34d',
                background: 'rgba(120, 53, 15, 0.4)',
              },
            },
          },
          event: {
            red: '#ff8f9a',
            orange: '#ffc84a',
            green: '#7be3a1',
            blue: '#7fb8fb',
          },
        }),
  },
  hoursTable: {
    borderBold: mode === 'light' ? '1px solid #333' : '1px solid #52525b',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderRadius: '8px',
          textTransform: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiAutocomplete: {
      defaultProps: {
        noOptionsText: 'Brak danych',
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

interface ThemeContextType {
  toggleColorMode: () => void;
  mode: PaletteMode;
}

const ColorModeContext = createContext<ThemeContextType>({
  toggleColorMode: () => {},
  mode: 'light',
});

export const useColorMode = () => useContext(ColorModeContext);

export const ThemeContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [mode, setMode] = useState<PaletteMode>(() => {
    try {
      const storedMode = localStorage.getItem('themeMode');
      return storedMode === 'dark' || storedMode === 'light'
        ? storedMode
        : 'light';
    } catch (e) {
      return 'light';
    }
  });

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('themeMode', newMode);
          return newMode;
        });
      },
      mode,
    }),
    [mode]
  );

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

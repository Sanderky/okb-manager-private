declare module '@mui/material/styles' {
  interface Status {
    active: { text: string; background: string };
    inactive: { text: string; background: string };
  }

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

  interface Theme {
    hoursTable: { borderBold: string };
  }

  interface ThemeOptions {
    hoursTable: { borderBold: string };
  }

  interface TypeBackground {
    default: string;
    paper: string;
    grid: string;
    gradient: string;
  }
}

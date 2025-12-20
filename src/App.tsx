import CssBaseline from '@mui/material/CssBaseline';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom';
import DashboardLayout from './components/dashboard/DashboardLayout';
import Login from './pages/Login/Login';
import PrivateRoute from './routing/PrivateRoute';
import EmployeeShow from './pages/Dashboard/Employees/EmployeeShow';
import ConstructionsList from './pages/Dashboard/Constructions/ConstructionsList';
import NotificationsProvider from './hooks/useNotifications/NotificationsProvider';
import DialogsProvider from './hooks/useDialogs/DialogsProvider';
import ConstructionCreate from './pages/Dashboard/Constructions/ConstructionCreate';
import ConstructionShow from './pages/Dashboard/Constructions/ConstructionShow';
import EmployeeList from './pages/Dashboard/Employees/EmployeeList';
import EmployeeEdit from './pages/Dashboard/Employees/EmployeeEdit';
import EmployeeCreate from './pages/Dashboard/Employees/EmployeeCreate';
import ConstructionEdit from './pages/Dashboard/Constructions/ConstructionEdit';
import Home from './pages/Dashboard/Home/Home';
import VacationCalendar from './pages/Dashboard/Calendar/Calendar';
import Hours from './pages/Dashboard/Hours/Hours';
import Schedule from './pages/Dashboard/Schedule/Schedule';
import PageNotFound from './pages/PageNotFound/PageNotFound';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useAuth } from './context/AuthContext';
import {
  getConstructionList,
  getConstructionStats,
} from './services/constructions';
import { useQuery } from '@tanstack/react-query';
import { getEmployeeList, getEmployeeStats } from './services/employees';
import { getUpcomingVacations } from './services/vacations';
import { getHomeNote } from './services/home';
import { getContractors } from './services/contractors';
import { getEmployeeAlerts } from './services/alerts';
import UpdatePassword from './pages/ForgotPassword/ForgotPassword';
import { LayoutProvider } from './context/LayoutContext';

declare module '@mui/material/styles' {
  // 1. Mówimy, że w gotowym 'theme.palette' będą te nowe pola
  interface Palette {
    schedule: {
      past: string,
      current: string,
      accent: string,
      hoverRow: string,
      hoverCell: string
    },
    calendar: {
      hoverDay: string,
      selectedDay: string,
      hoverSelectedDay: string,
      dayOut: string
    }

  }

  interface Theme {
    hoursTable: {
      borderBold: string
    }
  }

  interface ThemeOptions {
    hoursTable: {
      borderBold: string
    }
  }

  interface PaletteOptions {
    schedule?: {
      past: string,
      current: string,
      accent: string,
      hoverRow: string,
      hoverCell: string
    },
    calendar?: {
      hoverDay: string,
      selectedDay: string,
      hoverSelectedDay: string,
      dayOut: string
    }
  }
}

const customTheme = createTheme({

  palette: {
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
    background: {
      paper: '#fff',
      default: '#f5f5f4'
    },
    schedule: {
      past: '#fecaca',
      current: '#bbf7d0',
      accent: '#bfdbfe',
      hoverRow: "#eff6ff",
      hoverCell: "#dbeafe"
    },
    calendar: {
      hoverDay: '#f0f0f0',
      selectedDay: '#dbeafe',
      hoverSelectedDay: '#87CEFA',
      dayOut: '#fafafa'
    }
    // secondary: {
    //   main: 'rgba(253, 224, 71, 0.35)',
    //   light: 'rgba(254, 234, 132, 0.35)',
    //   dark: 'rgba(161, 98, 7, 1)',
    //   contrastText: '#000000',
    // }
  },
  hoursTable: {
    borderBold: '1px solid #333'
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
  },
});

export default function App() {
  const { user, initialLoading: authLoading } = useAuth();

  const { isLoading: employeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployeeList(),
    enabled: !!user,
  });

  const { isLoading: isContractorsLoading } = useQuery({
    queryKey: ['contractors'],
    queryFn: getContractors,
  });

  const { isLoading: constructionsLoading } = useQuery({
    queryKey: ['constructions'],
    queryFn: () => getConstructionList(),
    enabled: !!user,
  });

  const { isLoading: upcomingVacationsLoading } = useQuery({
    queryKey: ['vacations', 'upcoming-vacations'],
    queryFn: getUpcomingVacations,
    enabled: !!user,
  });

  const { isLoading: employeeStatsLoading } = useQuery({
    queryKey: ['employees', 'stats'],
    queryFn: getEmployeeStats,
  });

  const { isLoading: constructionStatsLoading } = useQuery({
    queryKey: ['constructions', 'stats'],
    queryFn: getConstructionStats,
  });

  const { isLoading: homeNoteLoading } = useQuery({
    queryKey: ['home', 'note'],
    queryFn: getHomeNote,
    enabled: !!user,
  });

  const { isLoading: isAlertsLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: getEmployeeAlerts,
  });

  const isLoading = Boolean(
    authLoading ||
    (user &&
      (constructionsLoading ||
        isAlertsLoading ||
        isContractorsLoading ||
        employeesLoading ||
        upcomingVacationsLoading ||
        homeNoteLoading ||
        employeeStatsLoading ||
        constructionStatsLoading))
  );

  return (
    <ThemeProvider theme={customTheme}>
      <CssBaseline enableColorScheme />
      <LayoutProvider>
        <NotificationsProvider>
          <DialogsProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  element={<PrivateRoute isLoading={isLoading} user={user} />}
                >
                  <Route path="/reset-password" element={<UpdatePassword />} />
                  <Route path="/" element={<DashboardLayout />}>
                    <Route index element={<Navigate replace to="/home" />} />
                    <Route path="home" element={<Home />} />
                    <Route path="employees" element={<EmployeeList />} />
                    <Route
                      path="employees/:employeeId"
                      element={<EmployeeShow />}
                    />
                    <Route
                      path="employees/:employeeId/edit"
                      element={<EmployeeEdit />}
                    />
                    <Route
                      path="employees/create"
                      element={<EmployeeCreate />}
                    />
                    <Route
                      path="constructions"
                      element={<ConstructionsList />}
                    />
                    <Route
                      path="constructions/:constructionId"
                      element={<ConstructionShow />}
                    />
                    <Route
                      path="constructions/:constructionId/edit"
                      element={<ConstructionEdit />}
                    />
                    <Route
                      path="constructions/create"
                      element={<ConstructionCreate />}
                    />
                    <Route path="schedule" element={<Schedule />} />
                    <Route path="calendar" element={<VacationCalendar />} />
                    <Route path="hours" element={<Hours />} />
                    <Route path="*" element={<PageNotFound />} />
                  </Route>
                </Route>
              </Routes>
            </Router>
          </DialogsProvider>
        </NotificationsProvider>
      </LayoutProvider>
    </ThemeProvider>
  );
}

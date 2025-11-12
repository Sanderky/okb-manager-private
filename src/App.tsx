import CssBaseline from '@mui/material/CssBaseline';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom';
import DashboardLayout from './components/dashboard/DashboardLayout';
import Login from './pages/Login/Login';
import { AuthProvider } from './context/AuthContext';
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
import useEmployeesAlert from './hooks/useEmployeeAlert';
import PageNotFound from './pages/PageNotFound/PageNotFound';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const customTheme = createTheme({
  palette: {
    primary: {
      main: '#6366F1',
      light: '#8184F5',
      dark: '#4548A8',
      contrastText: '#FFFFFF',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderRadius: '8px',
          textTransform: 'none',
        },
      },
    },
  },
});

export default function App() {
  useEmployeesAlert();

  return (
    <AuthProvider>
      <ThemeProvider theme={customTheme}>
        <CssBaseline enableColorScheme />
        <NotificationsProvider>
          <DialogsProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<PrivateRoute />}>
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
      </ThemeProvider>
    </AuthProvider>
  );
}

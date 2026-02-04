import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useNavigate,
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
import VacationCalendar from './pages/Dashboard/Vacations/Vacations';
import Hours from './pages/Dashboard/Hours/Hours';
import Schedule from './pages/Dashboard/Schedule/Schedule';
import PageNotFound from './pages/PageNotFound/PageNotFound';
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
import Calendar from './features/calendar/components/Calendar';
import { getNearestUpcomingEvents } from './features/calendar/api';
import LodgingsManager from './pages/Dashboard/Lodgings/Lodgings';
import { ThemeContextProvider } from './context/ThemeContext';
import { useEffect } from 'react';
import { supabase } from './supabase';
import PublicRoute from './routing/PublicRoute';
import Loading from './components/Loading';
import ErrorPage from './pages/Error/ErrorPage';
import { getTodos } from './services/todos';
import { useRealtime } from './hooks/useRealtime';

const AuthListener = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return null;
};

export default function App() {
  const { user, initialLoading: authLoading, error } = useAuth();

  useRealtime();

  const { isLoading: employeesLoading, error: employeesError } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployeeList(),
    enabled: !!user,
  });

  const { isLoading: isContractorsLoading, error: contractorsError } = useQuery(
    {
      queryKey: ['contractors'],
      queryFn: getContractors,
      enabled: !!user,
    }
  );

  const { isLoading: constructionsLoading, error: constructionsError } =
    useQuery({
      queryKey: ['constructions'],
      queryFn: () => getConstructionList(),
      enabled: !!user,
    });

  const { isLoading: upcomingVacationsLoading, error: upcomingVacationsError } =
    useQuery({
      queryKey: ['vacations', 'upcoming-vacations'],
      queryFn: () => getUpcomingVacations(),
      enabled: !!user,
    });

  const { isLoading: employeeStatsLoading, error: employeeStatsError } =
    useQuery({
      queryKey: ['employees', 'stats'],
      queryFn: getEmployeeStats,
      enabled: !!user,
    });

  const { isLoading: constructionStatsLoading, error: constructionStatsError } =
    useQuery({
      queryKey: ['constructions', 'stats'],
      queryFn: getConstructionStats,
      enabled: !!user,
    });

  const { isLoading: homeNoteLoading, error: homeNoteError } = useQuery({
    queryKey: ['home', 'note'],
    queryFn: getHomeNote,
    enabled: !!user,
  });

  const { isLoading: isAlertsLoading, error: alertsError } = useQuery({
    queryKey: ['alerts'],
    queryFn: getEmployeeAlerts,
    enabled: !!user,
  });

  const { isLoading: upcomingEventsLoading, error: upcomingEventsError } =
    useQuery({
      queryKey: ['calendarEvents', 'upcoming', 'all'],
      queryFn: async () => getNearestUpcomingEvents(),
      enabled: !!user,
    });

  const { isLoading: todosLoading, isError: todosError } = useQuery({
    queryKey: ['todos'],
    queryFn: getTodos,
    enabled: !!user,
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
          constructionStatsLoading ||
          todosLoading ||
          upcomingEventsLoading))
  );

  const isError = Boolean(
    error ||
      employeesError ||
      contractorsError ||
      constructionsError ||
      upcomingVacationsError ||
      homeNoteError ||
      employeeStatsError ||
      constructionStatsError ||
      alertsError ||
      upcomingEventsError ||
      todosError
  );

  if (authLoading || isLoading) {
    return (
      <ThemeContextProvider>
        <Loading
          fullScreen
          message={authLoading ? 'Autoryzacja...' : 'Ładowanie danych...'}
        />
      </ThemeContextProvider>
    );
  }

  if (isError) {
    return (
      <ThemeContextProvider>
        <ErrorPage />
      </ThemeContextProvider>
    );
  }

  return (
    <ThemeContextProvider>
      <LayoutProvider>
        <NotificationsProvider>
          <DialogsProvider>
            <Router>
              <AuthListener />
              <Routes>
                <Route element={<PublicRoute user={user} />}>
                  <Route path="/login" element={<Login />} />
                </Route>
                <Route element={<PrivateRoute user={user} />}>
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
                    <Route path="lodgings" element={<LodgingsManager />} />
                    <Route path="schedule" element={<Schedule />} />
                    <Route path="vacations" element={<VacationCalendar />} />
                    <Route path="calendar" element={<Calendar />} />
                    <Route path="hours" element={<Hours />} />
                    <Route path="*" element={<PageNotFound />} />
                  </Route>
                </Route>
              </Routes>
            </Router>
          </DialogsProvider>
        </NotificationsProvider>
      </LayoutProvider>
    </ThemeContextProvider>
  );
}

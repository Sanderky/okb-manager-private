import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import DashboardLayout from './layout/dashboard/DashboardLayout';
import Login from '../features/login/ui/Login';
import PrivateRoute from '../app/router/PrivateRoute';
import EmployeeShow from '../pages/Dashboard/Employees/EmployeeShow';
import ConstructionsList from '../features/constructions/components/ConstructionsList';
import NotificationsProvider from '../shared/ui/notifications/NotificationsProvider';
import DialogsProvider from '../shared/ui/dialogs/DialogsProvider';
import ConstructionCreate from '../features/constructions/components/ConstructionCreate';
import ConstructionShow from '../features/constructions/components/ConstructionShow';
import EmployeeList from '../pages/Dashboard/Employees/EmployeeList';
import EmployeeEdit from '../pages/Dashboard/Employees/EmployeeEdit';
import EmployeeCreate from '../pages/Dashboard/Employees/EmployeeCreate';
import ConstructionEdit from '../features/constructions/components/ConstructionEdit';
import Home from '../pages/Dashboard/Home/Home';
import VacationCalendar from '../pages/Dashboard/Vacations/Vacations';
import Hours from '../pages/Dashboard/Hours/Hours';
import Schedule from '../pages/Dashboard/Schedule/Schedule';
import PageNotFound from '../pages/page-not-found/ui/PageNotFound';
import { useAuth } from '../entities/session/model/AuthContext';
import {
  getConstructionList,
  getConstructionStats,
} from '../api/constructions';
import { useQuery } from '@tanstack/react-query';
import { getEmployeeList, getEmployeeStats } from '../entities/eployees/api/employees';
import { getUpcomingVacations } from '../api/vacations';
import { getHomeNote } from '../api/home';
import { getContractors } from '../api/contractors';
import { getEmployeeAlerts } from '../api/alerts';
import UpdatePassword from '../pages/reset-password/ui/ResetPasswordPage';
import { LayoutProvider } from '../shared/lib/LayoutContext';
import Calendar from '../features/calendar/components/Calendar';
import { ThemeContextProvider } from '../shared/lib/ThemeContext';
import { useEffect } from 'react';
import { supabase } from '../shared/api/supabase';
import PublicRoute from './router/PublicRoute';
import Loading from '../shared/ui/Loading';
import ErrorPage from '../pages/error/ui/ErrorPage';
import { useRealtime } from '../features/real-time/useRealtime';
import { getNearestUpcomingEvents } from '../features/calendar/api';
import LodgingsManager from '../features/lodgings/components/Lodgings';
import { getTodos } from '../features/todo/api';
import PublicLayout from './layout/public/PublicLayout';

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
                  <Route element={<PublicLayout />}>
                    <Route path="/login" element={<Login />} />
                  </Route>
                </Route>
                <Route element={<PrivateRoute user={user} />}>
                  <Route element={<PublicLayout />}>
                    <Route
                      path="/reset-password"
                      element={<UpdatePassword />}
                    />
                  </Route>
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

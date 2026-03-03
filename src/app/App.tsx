import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import DashboardLayout from './layout/dashboard/DashboardLayout';
import PrivateRoute from '../app/router/PrivateRoute';
import NotificationsProvider from '@/shared/ui/notifications/NotificationsProvider';
import DialogsProvider from '@/shared/ui/dialogs/DialogsProvider';
import Home from '@/pages/home/ui/Home';
import { useAuth } from '../entities/session/model/AuthContext';
import { useQuery } from '@tanstack/react-query';
import {
  getEmployeeList,
  getEmployeeStats,
} from '@/entities/employee/api/employees';
import { getHomeNote } from '@/features/home-note/api/home';
import { LayoutProvider } from '@/shared/lib/LayoutContext';
import { ThemeContextProvider } from '@/shared/lib/ThemeContext';
import { useEffect } from 'react';
import { supabase } from '@/shared/api/supabase';
import PublicRoute from './router/PublicRoute';
import Loading from '@/shared/ui/Loading';
import PublicLayout from './layout/public/PublicLayout';
import { ErrorPage } from '@/pages/error';
import { LoginPage } from '@/pages/login';
import { ResetPasswordPage } from '@/pages/reset-password';
import { EmployeesListPage } from '@/pages/employees-list';
import { EmployeeShowPage } from '@/pages/employee-show';
import { EmployeeEditPage } from '@/pages/employee-edit';
import { EmployeeCreatePage } from '@/pages/employee-create';
import { ConstructionsListPage } from '@/pages/constructions-list';
import { ConstructionShowPage } from '@/pages/construction-show';
import { ConstructionEditPage } from '@/pages/construction-edit';
import { LodgingsPage } from '@/pages/lodgings';
import { SchedulePage } from '@/pages/schedule';
import { VacationsPage } from '@/pages/vacations';
import { WorkLogsPage } from '@/pages/work-logs';
import { PageNotFound } from '@/pages/page-not-found';
import { ConstructionApi } from '@/entities/construction';
import { VacationApi } from '@/entities/vacations';
import { getNearestUpcomingEvents } from '@/features/calendar';
import { ConstructionCreatePage } from '@/pages/construction-create';
import { getTodos } from '@/features/todo-list';
import { getEmployeeAlerts } from '@/entities/employee';
import { useRealtime } from '@/features/real-time';
import { getContractors } from '@/entities/contractor';
import { CalendarPage } from '@/pages/calendar';

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
      queryFn: () => ConstructionApi.getConstructionList(),
      enabled: !!user,
    });

  const { isLoading: upcomingVacationsLoading, error: upcomingVacationsError } =
    useQuery({
      queryKey: ['vacations', 'upcoming-vacations'],
      queryFn: () => VacationApi.getUpcomingVacations(),
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
      queryFn: ConstructionApi.getConstructionStats,
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
                    <Route path="/login" element={<LoginPage />} />
                  </Route>
                </Route>
                <Route element={<PrivateRoute user={user} />}>
                  <Route element={<PublicLayout />}>
                    <Route
                      path="/reset-password"
                      element={<ResetPasswordPage />}
                    />
                  </Route>
                  <Route path="/" element={<DashboardLayout />}>
                    <Route index element={<Navigate replace to="/home" />} />
                    <Route path="home" element={<Home />} />
                    <Route path="employees" element={<EmployeesListPage />} />
                    <Route
                      path="employees/:employeeId"
                      element={<EmployeeShowPage />}
                    />
                    <Route
                      path="employees/:employeeId/edit"
                      element={<EmployeeEditPage />}
                    />
                    <Route
                      path="employees/create"
                      element={<EmployeeCreatePage />}
                    />
                    <Route
                      path="constructions"
                      element={<ConstructionsListPage />}
                    />
                    <Route
                      path="constructions/:constructionId"
                      element={<ConstructionShowPage />}
                    />
                    <Route
                      path="constructions/:constructionId/edit"
                      element={<ConstructionEditPage />}
                    />
                    <Route
                      path="constructions/create"
                      element={<ConstructionCreatePage />}
                    />
                    <Route path="lodgings" element={<LodgingsPage />} />
                    <Route path="schedule" element={<SchedulePage />} />
                    <Route path="vacations" element={<VacationsPage />} />
                    <Route path="calendar" element={<CalendarPage />} />
                    <Route path="hours" element={<WorkLogsPage />} />
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

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
import { Home } from '@/pages/home';
import { useAuth } from '@/entities/auth';
import { useQuery } from '@tanstack/react-query';
import { EmployeeApi } from '@/entities/employee';
import { useHomeNote } from '@/features/home-note';
import { LayoutProvider } from '@/shared/lib/LayoutContext';
import { ThemeContextProvider } from '@/shared/lib/ThemeContext';
import { useEffect } from 'react';
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
import { WorkLogsPage } from '@/pages/work-logs';
import { PageNotFound } from '@/pages/page-not-found';
import { ConstructionApi } from '@/entities/construction';
import { VacationApi } from '@/entities/vacations';
import { ConstructionCreatePage } from '@/pages/construction-create';
import { getTodos } from '@/features/todo-list';
import { getEmployeeAlerts } from '@/entities/employee';
import { CalendarPage } from '@/pages/calendar';
import { AuthApi } from '@/entities/auth';
import { useRealtime } from './real-time/useRealtime';
import { useContractors } from '@/entities/contractor';
import { getNearestUpcomingEvents } from '@/entities/events';
import { VacationsPage } from '@/pages/vacations';

const useInitData = () => {
  const { user, initialLoading: authLoading, error } = useAuth();

  const { isLoading: employeesLoading, error: employeesError } = useQuery({
    queryKey: ['employees'],
    queryFn: () => EmployeeApi.getEmployeeList(),
    enabled: !!user,
  });

  const { isLoading: isContractorsLoading, isError: contractorsError } = useContractors(!!user);

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
      queryFn: EmployeeApi.getEmployeeStats,
      enabled: !!user,
    });

  const { isLoading: constructionStatsLoading, error: constructionStatsError } =
    useQuery({
      queryKey: ['constructions', 'stats'],
      queryFn: ConstructionApi.getConstructionStats,
      enabled: !!user,
    });

  const { isLoading: homeNoteLoading, isError: homeNoteError } = useHomeNote(!!user);

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

  return {
    user,
    authLoading,
    isLoading,
    isError,
  };
};

export const PasswordRecoveryListener = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = AuthApi.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return null;
};

export default function App() {
  const { user, authLoading, isError, isLoading } = useInitData();
  useRealtime();

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
              <PasswordRecoveryListener />
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

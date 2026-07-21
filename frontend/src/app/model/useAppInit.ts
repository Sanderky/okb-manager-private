import { useAuth } from '@/entities/auth';
import {
  useEmployeeAlerts,
  useEmployees,
  useEmployeeStats,
} from '@/entities/employee';
import {
  useConstructions,
  useConstructionStats,
} from '@/entities/construction';
import { useUpcomingVacations } from '@/entities/vacations';
import { useHomeNote } from '@/features/home-note';
import { useUpcomingEvents } from '@/entities/events';
import { useTodo } from '@/features/todo-list';
import { useContractors } from '@/entities/contractor';

export const useAppInit = () => {
  const { user, initialLoading: authLoading, error: authError } = useAuth();

  const { isLoading: employeesLoading, isError: employeesError } =
    useEmployees(!!user);

  const { isLoading: isContractorsLoading, isError: contractorsError } =
    useContractors(!!user);

  const { isLoading: constructionsLoading, isError: constructionsError } =
    useConstructions(!!user);

  const {
    isLoading: upcomingVacationsLoading,
    isError: upcomingVacationsError,
  } = useUpcomingVacations(!!user);

  const { isLoading: employeeStatsLoading, isError: employeeStatsError } =
    useEmployeeStats(!!user);

  const {
    isLoading: constructionStatsLoading,
    isError: constructionStatsError,
  } = useConstructionStats(!!user);

  const { isLoading: homeNoteLoading, isError: homeNoteError } =
    useHomeNote(!!user);

  const { isLoading: isAlertsLoading, isError: alertsError } =
    useEmployeeAlerts(!!user);

  const { isLoading: upcomingEventsLoading, isError: upcomingEventsError } =
    useUpcomingEvents(!!user);

  const { isLoading: todosLoading, isError: todosError } = useTodo(!!user);

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
    authError ||
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

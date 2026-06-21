import {
  useConstruction,
  useUpdateConstructionNote,
} from '@/entities/construction';
import { useEmployeesByScheduledConstruction } from '@/entities/employee';
import { useUpcomingEventsForConstruction } from '@/entities/events';
import useLoading from '@/shared/lib/useLoading';
import useNotifications from '@/shared/ui/notifications/useNotifications';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const useShowConstruction = (constructionId: string) => {
  const navigate = useNavigate();
  const {
    // loading: actionLoading,
    startLoading: startActionLoading,
    stopLoading: stopActionLoading,
  } = useLoading(false);

  const [notFound, setNotFound] = useState(false);
  const notifications = useNotifications();

  const {
    construction,
    isLoading: isLoadingConstruction,
    isError: errorConstruction,
  } = useConstruction(constructionId);

  const {
    data: scheduleEmployees,
    isLoading: isScheduleEmployeesLoading,
    isError: errorScheduleEmployees,
  } = useEmployeesByScheduledConstruction(constructionId);

  const { data: upcomingEvents = [], isLoading: isUpcomingEventsLoading } =
    useUpcomingEventsForConstruction(constructionId);

  const updateNoteMutation = useUpdateConstructionNote();

  useEffect(() => {
    if (construction) {
      setNotFound(false);
    } else if (!isLoadingConstruction) {
      setNotFound(true);
    }
  }, [construction, isLoadingConstruction]);

  const handleSaveNote = useCallback(
    async (note: string) => {
      startActionLoading();
      try {
        await updateNoteMutation.mutateAsync({ constructionId, note });
        notifications.show('Notatka została zaktualizowana.', {
          severity: 'success',
          autoHideDuration: 5000,
        });
      } catch {
        notifications.show('Wystąpił błąd podczas zapisywania notatki.', {
          severity: 'error',
          autoHideDuration: 5000,
        });
      } finally {
        stopActionLoading();
      }
    },
    [updateNoteMutation, startActionLoading, stopActionLoading, notifications]
  );

  const handleNavigateToConstructionEdit = useCallback(() => {
    navigate(`/constructions/${constructionId}/edit`);
  }, [navigate, constructionId]);

  const handleNavigateBack = useCallback(() => {
    navigate('/constructions');
  }, [navigate]);

  const handleNavigateToContractor = useCallback(
    (id: string) => {
      if (!id) return;
      navigate(`/constructions?view=contractors&contractorId=${id}`);
    },
    [navigate]
  );
  
  const handleNavigateToEmployee = useCallback(
    (id: string) => {
      if (!id) return;
      navigate(`/employees/${id}`);
    },
    [navigate]
  );

  const isInProgress = construction?.status ?? false;

  const activeScheduleEmployees = useMemo(() => {
    if (scheduleEmployees) {
      return scheduleEmployees[0].employees?.filter((e) => e.status);
    } else {
      return [];
    }
  }, [scheduleEmployees]);

  const error = errorConstruction || errorScheduleEmployees;
  const loading =
    isLoadingConstruction ||
    isScheduleEmployeesLoading ||
    isUpcomingEventsLoading;

  return {
    construction,
    isSavingNote: updateNoteMutation.isPending,
    isInProgress,
    activeScheduleEmployees,
    error,
    loading,
    handleNavigateBack,
    handleNavigateToConstructionEdit,
    handleNavigateToContractor,
    handleNavigateToEmployee,
    handleSaveNote,
    upcomingEvents,
    notFound,
  };
};

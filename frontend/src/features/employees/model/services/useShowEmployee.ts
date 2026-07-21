import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import useNotifications from '@/shared/ui/notifications/useNotifications';
import useLoading from '@/shared/lib/useLoading';
import { useScroll } from '@/shared/lib/ScrollContext';
import { useEmployee, useUpdateEmployeeNote } from '@/entities/employee';
import { useEmployeeUpcomingVacations } from '@/entities/vacations';
import { useUpcomingEventsForEmployee } from '@/entities/events';
import type { FileItem } from '@/shared/model/types';
import { useTranslation } from 'react-i18next';

export const useShowEmployee = (employeeId: string) => {
  const { t } = useTranslation('employees');
  const navigate = useNavigate();
  const notifications = useNotifications();
  const { scrollToTop } = useScroll();

  const { startLoading: startActionLoading, stopLoading: stopActionLoading } =
    useLoading(false);

  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState(0);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  const {
    employee,
    isLoading: isEmployeeLoading,
    isError: errorEmployee,
  } = useEmployee(employeeId);
  const {
    data: employeeVacation,
    isLoading: isEmployeeVacationLoading,
    isError: errorEmployeeVacation,
  } = useEmployeeUpcomingVacations(employeeId);
  const { data: upcomingEvents = [], isLoading: isUpcomingEventsLoading } =
    useUpcomingEventsForEmployee(employeeId);

  useEffect(() => {
    if (employee) setNotFound(false);
    else if (!isEmployeeLoading) setNotFound(true);
  }, [employee, isEmployeeLoading]);

  const updateNoteMutation = useUpdateEmployeeNote();

  const handleSaveNote = useCallback(
    async (note: string) => {
      startActionLoading();
      try {
        await updateNoteMutation.mutateAsync({ employeeId, note });
        notifications.show(t('notifications.noteUpdated'), {
          severity: 'success',
          autoHideDuration: 5000,
        });
      } catch {
        notifications.show(t('notifications.noteUpdateError'), {
          severity: 'error',
          autoHideDuration: 5000,
        });
      } finally {
        stopActionLoading();
      }
    },
    [
      updateNoteMutation,
      startActionLoading,
      stopActionLoading,
      t,
      notifications,
      employeeId,
    ]
  );

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) =>
    setTab(newValue);
  const handleEmployeeEdit = useCallback(
    () => navigate(`/employees/${employeeId}/edit`),
    [navigate, employeeId]
  );
  const handleBack = useCallback(() => navigate('/employees'), [navigate]);

  const handleVacationClick = useCallback(
    (vacation: any) => {
      const startMonth = dayjs(vacation.startDate).format('YYYY-MM');
      navigate(`/vacations?month=${startMonth}&vacationId=${vacation.id}`);
      scrollToTop();
    },
    [navigate, scrollToTop]
  );

  const handleOpenPreview = useCallback((file: FileItem | null | undefined) => {
    if (!file) return;
    setPreviewFile(file);
    setIsPreviewOpen(true);
  }, []);

  const handleClosePreview = useCallback(() => setIsPreviewOpen(false), []);

  const error = errorEmployee || errorEmployeeVacation;
  const loading =
    isEmployeeLoading || isEmployeeVacationLoading || isUpcomingEventsLoading;

  return {
    employee,
    employeeId,
    employeeVacation,
    upcomingEvents,
    loading,
    error,
    notFound,
    tab,
    previewFile,
    isPreviewOpen,
    isSavingNote: updateNoteMutation.isPending,
    handleTabChange,
    handleEmployeeEdit,
    handleBack,
    handleVacationClick,
    handleSaveNote,
    handleOpenPreview,
    handleClosePreview,
  };
};

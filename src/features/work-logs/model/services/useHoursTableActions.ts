import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { WorkHours } from '../types';
import {
  enrichAndFilterNewWorkHours,
  parseHoursInput,
  updateSingleWorkHour,
} from '../utils/hoursTableUtils';
import useNotifications from '@/shared/ui/notifications/useNotifications';
import { useDialogs } from '@/shared/ui/dialogs/useDialogs';
import { useCopyFromSourceWeek } from '../api/mutations/useCopyFromSourceWeek';
import { useFillWithSchedule } from '../api/mutations/useFillWithSchedule';
import { useSaveWorkLogs } from '../api/mutations/useSave';
import {
  getNextWeek,
  getPreviousWeek,
  getStartOfWeek,
} from '@/shared/lib/date';
import type { Construction } from '@/entities/construction';
import type { Employee } from '@/entities/employee';

export interface UseHoursTableActionsProps {
  setLocalWorkHours: React.Dispatch<React.SetStateAction<WorkHours[]>>;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentWeek: React.Dispatch<React.SetStateAction<Date>>;
  workHoursFromDB: WorkHours[];
  currentWeek: Date;
  localWorkHours: WorkHours[];
  isEmployeeOnVacation: (employeeId: string, date: Date) => boolean;
  editMode: boolean;
  hasUnsavedChanges: boolean;
  constructions: Construction[];
  employees: Employee[];
}

export const useHoursTableActions = ({
  setLocalWorkHours,
  setHasUnsavedChanges,
  setEditMode,
  setCurrentWeek,
  workHoursFromDB,
  currentWeek,
  localWorkHours,
  isEmployeeOnVacation,
  editMode,
  hasUnsavedChanges,
  constructions,
  employees,
}: UseHoursTableActionsProps) => {
  const dialogs = useDialogs();
  const notifications = useNotifications();
  const { t } = useTranslation(['workLogs', 'common']);

  const fillScheduleMutation = useFillWithSchedule(
    currentWeek,
    isEmployeeOnVacation,
    (res) => {
      setLocalWorkHours(res);
      setHasUnsavedChanges(true);
      notifications.show(
        t('workLogs:notifications.scheduleLoaded', { count: res.length }),
        {
          severity: 'success',
        }
      );
    },
    () => {
      notifications.show(t('workLogs:notifications.scheduleError'), {
        severity: 'error',
      });
    }
  );

  const copyMutation = useCopyFromSourceWeek(
    currentWeek,
    isEmployeeOnVacation,
    (res) => {
      setLocalWorkHours(res);
      setHasUnsavedChanges(true);
      notifications.show(t('workLogs:notifications.dataCopied'), {
        severity: 'success',
      });
    },
    () => {
      notifications.show(t('workLogs:notifications.copyError'), {
        severity: 'error',
      });
    }
  );

  const saveMutation = useSaveWorkLogs(
    () => {
      setHasUnsavedChanges(false);
      notifications.show(t('workLogs:notifications.hoursSaved'), {
        severity: 'success',
      });
    },
    () =>
      notifications.show(t('workLogs:notifications.saveError'), {
        severity: 'error',
      })
  );

  const handleCancelEdit = useCallback(async () => {
    if (hasUnsavedChanges) {
      const isConfirmed = await dialogs.confirm(
        t('workLogs:dialogs.cancelEdit.description'),
        {
          cancelText: t('workLogs:dialogs.cancelEdit.cancelBtn'),
          title: t('workLogs:dialogs.cancelEdit.title'),
        }
      );
      if (!isConfirmed) return;
    }

    setLocalWorkHours(workHoursFromDB);
    setHasUnsavedChanges(false);
    setEditMode(false);
  }, [
    hasUnsavedChanges,
    dialogs,
    setLocalWorkHours,
    workHoursFromDB,
    setHasUnsavedChanges,
    setEditMode,
    t,
  ]);

  const handleToggleEditMode = useCallback(
    async (forceValue?: boolean | React.MouseEvent) => {
      const isExplicitBoolean = typeof forceValue === 'boolean';
      const targetMode = isExplicitBoolean ? forceValue : !editMode;

      if (!targetMode && hasUnsavedChanges) {
        try {
          await saveMutation.mutateAsync({
            workHours: localWorkHours,
            currentWeek,
          });
        } catch {
          return;
        }
      }
      setEditMode(targetMode);
    },
    [
      editMode,
      hasUnsavedChanges,
      localWorkHours,
      currentWeek,
      saveMutation,
      setEditMode,
    ]
  );

  const handleCopyFromSourceWeek = useCallback(
    async (sourceDate: Date) => {
      if (localWorkHours.length > 0) {
        const isConfirmed = await dialogs.confirm(
          t('workLogs:dialogs.copyData.description'),
          {
            cancelText: t('common:buttons.cancel'),
            title: t('workLogs:dialogs.copyData.title'),
          }
        );
        if (!isConfirmed) return;
      }
      copyMutation.mutate(sourceDate);
      setEditMode(true);
    },
    [copyMutation, localWorkHours, dialogs, setEditMode, t]
  );

  const handleFillWithSchedule = useCallback(async () => {
    if (localWorkHours.length > 0) {
      const isConfirmed = await dialogs.confirm(
        t('workLogs:dialogs.fillSchedule.description'),
        {
          cancelText: t('common:buttons.cancel'),
          title: t('workLogs:dialogs.fillSchedule.title'),
        }
      );
      if (!isConfirmed) return;
    }
    fillScheduleMutation.mutate();
    setEditMode(true);
  }, [fillScheduleMutation, localWorkHours, dialogs, setEditMode, t]);

  const handleWeekChange = useCallback(
    async (target: 'prev' | 'current' | 'next' | Date) => {
      let newDate: Date;
      if (target === 'prev') newDate = getPreviousWeek(currentWeek);
      else if (target === 'current') newDate = getStartOfWeek(new Date());
      else if (target === 'next') newDate = getNextWeek(currentWeek);
      else newDate = target;

      if (hasUnsavedChanges) {
        const isConfirmed = await dialogs.confirm(
          t('workLogs:dialogs.changeWeek.description'),
          {
            cancelText: t('common:buttons.cancel'),
            title: t('workLogs:dialogs.changeWeek.title'),
          }
        );
        if (!isConfirmed) return;
      }
      setCurrentWeek(newDate);
      setEditMode(false);
    },
    [currentWeek, hasUnsavedChanges, dialogs, setCurrentWeek, setEditMode, t]
  );

  const handleHoursChange = useCallback(
    (id: string, idx: number, val: number | string | null) => {
      const parsedValue = parseHoursInput(val);
      setLocalWorkHours((prev) => {
        const nextState = updateSingleWorkHour(prev, id, idx, parsedValue);
        if (nextState !== prev) setHasUnsavedChanges(true);
        return nextState;
      });
    },
    [setLocalWorkHours, setHasUnsavedChanges]
  );

  const handleEmployeesAdded = useCallback(
    (arr: WorkHours[]) => {
      setLocalWorkHours((prev) => {
        const nextState = enrichAndFilterNewWorkHours(
          prev,
          arr,
          currentWeek,
          constructions,
          employees,
          isEmployeeOnVacation
        );
        if (nextState !== prev) {
          setHasUnsavedChanges(true);
          setEditMode(true);
        }
        return nextState;
      });
    },
    [
      currentWeek,
      constructions,
      employees,
      isEmployeeOnVacation,
      setLocalWorkHours,
      setHasUnsavedChanges,
    ]
  );

  const handleConstructionWithEmployeeAdded = handleEmployeesAdded;

  const handleDeleteEmployee = useCallback(
    async (id: string, employeeName: string, constructionName: string) => {
      const confirmed = await dialogs.confirm(
        t('workLogs:dialogs.deleteEmployee.description', {
          employeeName,
          constructionName,
        }),
        {
          severity: 'error',
          okText: t('common:buttons.delete'),
          cancelText: t('common:buttons.cancel'),
          title: t('workLogs:dialogs.deleteEmployee.title'),
        }
      );
      if (confirmed) {
        setLocalWorkHours((prev) => {
          const nextState = prev.filter((x) => x.id !== id);
          if (nextState.length !== prev.length) setHasUnsavedChanges(true);
          return nextState;
        });
      }
    },
    [dialogs, setLocalWorkHours, setHasUnsavedChanges, t]
  );

  const handleDeleteConstruction = useCallback(
    async (constructionId: string, constructionName: string) => {
      const confirmed = await dialogs.confirm(
        t('workLogs:dialogs.deleteConstruction.description', {
          constructionName,
        }),
        {
          severity: 'error',
          okText: t('common:buttons.delete'),
          cancelText: t('common:buttons.cancel'),
          title: t('workLogs:dialogs.deleteConstruction.title'),
        }
      );
      if (confirmed) {
        setLocalWorkHours((prev) => {
          const nextState = prev.filter(
            (x) => x.constructionId !== constructionId
          );
          if (nextState.length !== prev.length) setHasUnsavedChanges(true);
          return nextState;
        });
      }
    },
    [dialogs, setLocalWorkHours, setHasUnsavedChanges, t]
  );

  return {
    handleToggleEditMode,
    handleWeekChange,
    handleCancelEdit,
    handleHoursChange,
    handleCopyFromSourceWeek,
    handleFillWithSchedule,
    handleDeleteEmployee,
    handleDeleteConstruction,
    handleEmployeesAdded,
    handleConstructionWithEmployeeAdded,
    isCoping: copyMutation.isPending,
    isFilling: fillScheduleMutation.isPending,
    isSaving: saveMutation.isPending,
  };
};

import { useState, useMemo, useCallback, useEffect } from 'react';
import type {
  Construction,
  Employee,
  WorkHours,
  WorkLogEntry,
} from '../../../types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getEmployeeList } from '../../../services/employees';
import { getConstructionList } from '../../../services/constructions';
import {
  getWorkLogs,
  overrideWorkLogsForWeek,
  fetchWorkLogsForCopy,
} from '../../../services/workLogs';
import { getVacationListForMonths } from '../../../services/vacations';
import { getScheduleListForWeek } from '../../../services/schedules';

import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/pl';
import {
  getMonthKeysFromWeek,
  getNextWeek,
  getPreviousWeek,
  getStartOfWeek,
  getWeekDates,
} from './HoursHelpers';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useDialogs } from '../../../hooks/useDialogs/useDialogs';
import useNotifications from '../../../hooks/useNotifications/useNotifications';

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

const STORAGE_KEY = 'hours_table_filters';

interface StoredFilters {
  selectedConstructionIds: string[];
  selectedEmployeeIds: string[];
  showInactiveEmployees: boolean;
  showInactiveConstructions: boolean;
}

export interface ConstructionsWithWorkHours {
  id: string;
  name: string;
  isActive: boolean;
  workHours: {
    id: string;
    employeeId: string;
    employeeName: string;
    isActive: boolean;
    hours: number[];
    total: number;
    isOnVacation: boolean[];
  }[];
  totalHours: number;
}

const useHoursTable = (startWeek?: Date) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [currentWeek, setCurrentWeek] = useState<Date>(
    startWeek ?? getStartOfWeek(new Date())
  );

  const [localWorkHours, setLocalWorkHours] = useState<WorkHours[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [showInactiveEmployees, setShowInactiveEmployees] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved).showInactiveEmployees ?? false;
      } catch {
        console.log('Loading saved filters error');
      }
    }
    return false;
  });

  const [showInactiveConstructions, setShowInactiveConstructions] = useState(
    () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved).showInactiveConstructions ?? false;
        } catch {
          console.log('Loading saved filters error');
        }
      }
      return false;
    }
  );

  const [selectedConstructionIds, setSelectedConstructionIds] = useState<
    string[]
  >(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved).selectedConstructionIds ?? [];
      } catch {
        console.log('Loading saved filters error');
      }
    }
    return [];
  });

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>(
    () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved).selectedEmployeeIds ?? [];
        } catch {
          console.log('Loading saved filters error');
        }
      }
      return [];
    }
  );

  const {
    data: employees = [],
    isLoading: loadingEmployees,
    error: employeesError,
  } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployeeList(),
  });

  const {
    data: constructions = [],
    isLoading: loadingConstructions,
    error: constructionsError,
  } = useQuery({
    queryKey: ['constructions'],
    queryFn: () => getConstructionList(),
  });

  useEffect(() => {
    const dataToSave: StoredFilters = {
      selectedEmployeeIds,
      selectedConstructionIds,
      showInactiveEmployees,
      showInactiveConstructions,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [
    selectedEmployeeIds,
    selectedConstructionIds,
    showInactiveEmployees,
    showInactiveConstructions,
  ]);

  const selectedConstructions = useMemo(() => {
    return constructions.filter((c) => selectedConstructionIds.includes(c.id));
  }, [constructions, selectedConstructionIds]);

  const selectedEmployees = useMemo(() => {
    return employees.filter((e) => selectedEmployeeIds.includes(e.id));
  }, [employees, selectedEmployeeIds]);

  const onSelectedConstructionsChange = useCallback(
    (constructions: Construction[]) => {
      setSelectedConstructionIds(constructions.map((c) => c.id));
    },
    []
  );

  const onSelectedEmployeesChange = useCallback((employees: Employee[]) => {
    setSelectedEmployeeIds(employees.map((e) => e.id));
  }, []);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const handleNavigation = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      if (link && hasUnsavedChanges) {
        const href = link.getAttribute('href');
        if (href && href.startsWith('/') && !href.startsWith('#')) {
          if (!window.confirm('Masz niezapisane zmiany. Czy wyjść?')) {
            event.preventDefault();
            event.stopPropagation();
          }
        }
      }
    };
    document.addEventListener('click', handleNavigation, true);
    return () => document.removeEventListener('click', handleNavigation, true);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (startWeek) setCurrentWeek(startWeek);
  }, [startWeek]);
  const dialogs = useDialogs();
  const notifications = useNotifications();

  useEffect(() => {
    if (currentWeek.getTime() !== getStartOfWeek(new Date()).getTime())
      setEditMode(false);
    setLocalWorkHours([]);
    setHasUnsavedChanges(false);
  }, [currentWeek]);

  const [selectedConstructionForEmployee, setSelectedConstructionForEmployee] =
    useState<Construction | null>(null);

  const {
    data: workLogsRaw = [],
    isLoading: workHoursLoading,
    error: workHoursError,
  } = useQuery({
    queryKey: ['workLogs', currentWeek.toISOString()],
    queryFn: async () => {
      const weekEnd = dayjs(currentWeek).add(6, 'day').toDate();
      return await getWorkLogs(currentWeek, weekEnd);
    },
  });

  const workHoursFromDB = useMemo(() => {
    if (!workLogsRaw) return [];

    const grouped = new Map<string, WorkHours>();
    const weekDates = getWeekDates(currentWeek);

    workLogsRaw.forEach((log) => {
      const key = `${log.constructionId}_${log.employeeId}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: `${log.constructionId}_${log.employeeId}_${currentWeek.getTime()}`,
          constructionId: log.constructionId,
          employeeId: log.employeeId,
          weekStart: currentWeek,
          hours: [0, 0, 0, 0, 0, 0, 0],
          employeeName: log.employeeName,
          employeeActive: log.employeeActive,
          constructionName: log.constructionName,
          constructionActive: log.constructionActive,
        });
      }
      const entry = grouped.get(key)!;
      const dIndex = weekDates.findIndex(
        (d) =>
          dayjs(d).format('YYYY-MM-DD') === dayjs(log.date).format('YYYY-MM-DD')
      );
      if (dIndex !== -1) entry.hours[dIndex] = log.hours;
    });
    return Array.from(grouped.values());
  }, [workLogsRaw, currentWeek]);

  useEffect(() => {
    if (!hasUnsavedChanges) setLocalWorkHours(workHoursFromDB);
  }, [workHoursFromDB, hasUnsavedChanges]);

  const {
    data: vacations = [],
    isLoading: vacationsLoading,
    error: vacationsError,
  } = useQuery({
    queryKey: ['vacations', currentWeek.toISOString()],
    queryFn: () => getVacationListForMonths(getMonthKeysFromWeek(currentWeek)),
  });

  const vacationMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    vacations.forEach((v) => {
      let c = dayjs(v.startDate);
      const e = dayjs(v.endDate);
      if (!map.has(v.employeeId)) map.set(v.employeeId, new Set());
      while (c.isSameOrBefore(e)) {
        map.get(v.employeeId)!.add(c.format('YYYY-MM-DD'));
        c = c.add(1, 'day');
      }
    });
    return map;
  }, [vacations]);

  const queryClient = useQueryClient();

  const saveWorkHoursMutation = useMutation({
    mutationFn: async (whs: WorkHours[]) => {
      const dates = getWeekDates(currentWeek);
      const logs: Omit<WorkLogEntry, 'id'>[] = [];
      whs.forEach((w) =>
        w.hours.forEach((h, i) => {
          if (h >= 0)
            logs.push({
              employeeId: w.employeeId,
              constructionId: w.constructionId,
              date: dayjs(dates[i]).format('YYYY-MM-DD'),
              hours: h,
            });
        })
      );
      await overrideWorkLogsForWeek(currentWeek, logs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workLogs', currentWeek.toISOString()],
      });
      setHasUnsavedChanges(false);
      notifications.show('Zapisano godziny pracy', { severity: 'success' });
    },
    onError: () => notifications.show('Błąd zapisu', { severity: 'error' }),
  });

  const copyFromPreviousWeekMutation = useMutation({
    mutationFn: async (sourceWeek: Date) => {
      const logs = await fetchWorkLogsForCopy(sourceWeek);
      const grouped = new Map<string, WorkHours>();
      const sDates = getWeekDates(sourceWeek);
      logs.forEach((l) => {
        const k = `${l.constructionId}_${l.employeeId}`;
        if (!grouped.has(k))
          grouped.set(k, {
            id: `${l.constructionId}_${l.employeeId}_${currentWeek.getTime()}`,
            constructionId: l.constructionId,
            employeeId: l.employeeId,
            weekStart: currentWeek,
            hours: [0, 0, 0, 0, 0, 0, 0],
            employeeName: l.employeeName,
            employeeActive: l.employeeActive,
            constructionName: l.constructionName,
            constructionActive: l.constructionActive,
          });
        const idx = sDates.findIndex(
          (d) =>
            dayjs(d).format('YYYY-MM-DD') === dayjs(l.date).format('YYYY-MM-DD')
        );
        if (idx !== -1) grouped.get(k)!.hours[idx] = l.hours;
      });
      return Array.from(grouped.values());
    },
    onSuccess: (res) => {
      setLocalWorkHours(res);
      setHasUnsavedChanges(true);
      notifications.show('Skopiowano dane', { severity: 'success' });
    },
    onError: () => notifications.show('Błąd kopiowania', { severity: 'error' }),
  });

  const fillWithScheduleMutation = useMutation({
    mutationFn: async () => {
      const schedules = await getScheduleListForWeek(currentWeek);
      const newWh: WorkHours[] = [];
      const DEFAULT = 10;

      schedules.forEach((grp) => {
        const cMap = new Map<string, number[]>();
        const cNames = new Map<string, { name: string; active: boolean }>();

        grp.constructions.forEach((c) => {
          if (!cMap.has(c.id)) {
            cMap.set(c.id, []);
            cNames.set(c.id, { name: c.name, active: c.active });
          }
          cMap.get(c.id)!.push(c.dayIndex);
        });

        cMap.forEach((days, cId) => {
          const h = Array(7).fill(0);
          days.forEach((d) => (h[d] = DEFAULT));
          const cm = cNames.get(cId)!;
          newWh.push({
            id: `${cId}_${grp.employeeId}_${currentWeek.getTime()}`,
            constructionId: cId,
            employeeId: grp.employeeId,
            weekStart: currentWeek,
            hours: h,
            employeeName: grp.employeeName,
            employeeActive: grp.employeeActive,
            constructionName: cm.name,
            constructionActive: cm.active,
          });
        });
      });
      return newWh;
    },
    onSuccess: (res) => {
      setLocalWorkHours(res);
      setHasUnsavedChanges(true);
      notifications.show(`Załadowano ${res.length} z harmonogramu`, {
        severity: 'success',
      });
    },
    onError: () =>
      notifications.show('Błąd harmonogramu', { severity: 'error' }),
  });

  const handleCopyFromSourceWeek = useCallback(
    (d: Date) => {
      if (localWorkHours.length > 0)
        dialogs
          .confirm('Kopiowanie nadpisze obecnie wprowadzone dane', {
            cancelText: 'Anuluj',
            title: 'Kopiowanie danych',
          })
          .then((ok) => ok && copyFromPreviousWeekMutation.mutate(d));
      else copyFromPreviousWeekMutation.mutate(d);
    },
    [copyFromPreviousWeekMutation, localWorkHours, dialogs]
  );

  const handleFillWithSchedule = useCallback(async () => {
    if (
      localWorkHours.length > 0 &&
      !(await dialogs.confirm(
        'Uzupełnienie z harmonogramu nadpisze obecnie wprowadzone dane',
        { cancelText: 'Anuluj', title: 'Proponowane dane' }
      ))
    )
      return;
    fillWithScheduleMutation.mutate();
  }, [fillWithScheduleMutation, localWorkHours, dialogs]);

  const onWeeekChange = (d: Date) => {
    if (hasUnsavedChanges)
      dialogs
        .confirm('Utracisz niezapisane zmiany', {
          cancelText: 'Anuluj',
          title: 'Zmiana tygodnia',
        })
        .then((ok) => ok && (setCurrentWeek(d), setEditMode(false)));
    else setCurrentWeek(d);
  };
  const onSelectedConstructionForEmployeeChange = (id: string) =>
    setSelectedConstructionForEmployee(
      constructions?.find((c) => c.id === id) || null
    );

  const handleToggleEditMode = async (forceValue?: boolean) => {
    if (forceValue === undefined) {
      if (editMode) {
        if (hasUnsavedChanges)
          await saveWorkHoursMutation.mutateAsync(localWorkHours);
        setEditMode(false);
      } else setEditMode(true);
    } else {
      if (!forceValue && hasUnsavedChanges)
        await saveWorkHoursMutation.mutateAsync(localWorkHours);
      setEditMode(forceValue);
    }
  };

  const handleToggleExpand = () => setIsExpanded((p) => !p);

  const handleHoursChange = useCallback((id: string, idx: number, val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) || 0 : val;

    setLocalWorkHours((prevWorkHours) => {
      const index = prevWorkHours.findIndex((w) => w.id === id);
      if (index === -1) return prevWorkHours;

      const item = prevWorkHours[index];

      if (item.hours[idx] === num) return prevWorkHours;

      const newHours = [...item.hours];
      newHours[idx] = num;

      const simpleTotal = newHours.reduce((acc, curr) => acc + curr, 0);

      const newWorkHours = [...prevWorkHours];
      newWorkHours[index] = {
        ...item,
        hours: newHours,
        total: simpleTotal
      };

      return newWorkHours;
    });

    setHasUnsavedChanges(true);
  }, []);

  const handleWeekChange = (dir: 'prev' | 'current' | 'next') => {
    const go = () => {
      if (dir === 'prev') setCurrentWeek(getPreviousWeek(currentWeek));
      if (dir === 'current') setCurrentWeek(getStartOfWeek(new Date()));
      if (dir === 'next') setCurrentWeek(getNextWeek(currentWeek));
      setEditMode(false);
    };
    if (hasUnsavedChanges)
      dialogs
        .confirm('Utracisz niezapisane zmiany', {
          cancelText: 'Anuluj',
          title: 'Zmiana tygodnia',
        })
        .then((ok) => ok && go());
    else go();
  };
  const isEmployeeOnVacation = (id: string, d: Date) =>
    vacationMap.get(id)?.has(dayjs(d).format('YYYY-MM-DD')) ?? false;

  const handleDeleteEmployee = async (id: string, en: string, cn: string) => {
    const confirmed = await dialogs.confirm(
      `Usunąć pracownika ${en} z budowy ${cn}?`,
      {
        severity: 'error',
        okText: 'Usuń',
        cancelText: 'Anuluj',
        title: 'Usuwanie pracownika',
      }
    );

    if (confirmed) {
      setLocalWorkHours((p) => p.filter((x) => x.id !== id));
      setHasUnsavedChanges(true);
    }
  };

  const handleDeleteConstruction = async (id: string, n: string) => {
    const confirmed = await dialogs.confirm(
      `Usunąć budowę ${n} łącznie ze wszystkimi pracownikami?`,
      {
        severity: 'error',
        okText: 'Usuń',
        cancelText: 'Anuluj',
        title: 'Usuwanie budowy',
      }
    );

    if (confirmed) {
      setLocalWorkHours((p) => p.filter((x) => x.constructionId !== id));
      setHasUnsavedChanges(true);
    }
  };

  const handleEmployeesAdded = (arr: WorkHours[]) => {
    setLocalWorkHours((p) => {
      const s = new Set(p.map((x) => `${x.constructionId}_${x.employeeId}`));
      const f = arr.filter(
        (x) => !s.has(`${x.constructionId}_${x.employeeId}`)
      );

      const enriched = f.map((wh) => {
        const cDef = constructions?.find((c) => c.id === wh.constructionId);
        const eDef = employees?.find((e) => e.id === wh.employeeId);
        return {
          ...wh,
          employeeName: eDef?.name,
          employeeActive: eDef?.status,
          constructionName: cDef?.name,
          constructionActive: cDef?.status,
        };
      });
      return [...p, ...enriched];
    });
    setHasUnsavedChanges(true);
  };
  const handleConstructionWithEmployeeAdded = handleEmployeesAdded;
  const handleCancelEdit = async () => {
    if (
      hasUnsavedChanges &&
      !(await dialogs.confirm('Masz niezapisane zmiany. Anulować edycję?', {
        cancelText: 'Wróć',
        title: 'Anulowanie edycji',
      }))
    )
      return;
    setLocalWorkHours(workHoursFromDB);
    setHasUnsavedChanges(false);
    setEditMode(false);
  };

  const displayedWorkHours = editMode ? localWorkHours : workHoursFromDB;

  const totalHoursData = useMemo(() => {
    if (!displayedWorkHours)
      return { dailyTotals: [0, 0, 0, 0, 0, 0, 0], grandTotal: 0 };
    const dt = [0, 0, 0, 0, 0, 0, 0];
    let gt = 0;
    const dates = getWeekDates(currentWeek);
    const sE = new Set(selectedEmployees.map((x) => x.id));
    const sC = new Set(selectedConstructions.map((x) => x.id));
    displayedWorkHours.forEach((w) => {
      if (sE.size && !sE.has(w.employeeId)) return;
      if (sC.size && !sC.has(w.constructionId)) return;
      w.hours.forEach((h, i) => {
        if (!isEmployeeOnVacation(w.employeeId, dates[i])) {
          dt[i] += h;
          gt += h;
        }
      });
    });
    return { dailyTotals: dt, grandTotal: gt };
  }, [
    displayedWorkHours,
    currentWeek,
    selectedEmployees,
    selectedConstructions,
    vacationMap,
  ]);

  const constructionsWithWorkHours = useMemo(() => {
    if (!displayedWorkHours) return [];
    const map = new Map<string, ConstructionsWithWorkHours>();
    const dates = getWeekDates(currentWeek);
    const sE = new Set(selectedEmployees.map((x) => x.id));
    const sC = new Set(selectedConstructions.map((x) => x.id));

    displayedWorkHours.forEach((wh) => {
      if (sE.size && !sE.has(wh.employeeId)) return;
      if (sC.size && !sC.has(wh.constructionId)) return;

      const cName = wh.constructionName || 'Nieznana budowa';
      const cAct = wh.constructionActive ?? true;
      const eName = wh.employeeName || 'Nieznany pracownik';
      const eAct = wh.employeeActive ?? true;

      if (!map.has(wh.constructionId))
        map.set(wh.constructionId, {
          id: wh.constructionId,
          name: cName,
          isActive: cAct,
          workHours: [],
          totalHours: 0,
        });
      const g = map.get(wh.constructionId)!;
      const vac = dates.map((d) => isEmployeeOnVacation(wh.employeeId, d));
      const tot = wh.hours.reduce((s, h, i) => (vac[i] ? s : s + h), 0);
      g.workHours.push({
        id: wh.id,
        employeeId: wh.employeeId,
        employeeName: eName,
        isActive: eAct,
        hours: wh.hours,
        total: tot,
        isOnVacation: vac,
      });
      g.totalHours += tot;
    });

    const res = Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    res.forEach((g) =>
      g.workHours.sort((a, b) => a.employeeName.localeCompare(b.employeeName))
    );
    return res;
  }, [
    displayedWorkHours,
    currentWeek,
    selectedEmployees,
    selectedConstructions,
    vacationMap,
  ]);

  const availableConstructionsOptions = useMemo(() => {
    const list = constructions;

    const usedIds = constructionsWithWorkHours.map((c) => c.id);
    return list.filter((c) => !usedIds.includes(c.id));
  }, [constructions, constructionsWithWorkHours]);

  const getAvailableConstructions = useCallback(
    () => availableConstructionsOptions,
    [availableConstructionsOptions]
  );

  const getActiveEmployees = useCallback(() => {
    return employees.filter((e) => e.status);
  }, [employees]);

  const getAvailableEmployeesForConstruction = useCallback(
    (cId: string | undefined) => {
      if (!employees || !cId) return [];
      const group = constructionsWithWorkHours.find((c) => c.id === cId);
      const usedIds = group ? group.workHours.map((w) => w.employeeId) : [];

      return employees.filter((e) => {
        return e.status && !usedIds.includes(e.id);
      });
    },
    [employees, constructionsWithWorkHours]
  );

  return {
    isLoading:
      loadingEmployees ||
      loadingConstructions ||
      workHoursLoading ||
      vacationsLoading,
    loadingError:
      workHoursError || employeesError || vacationsError || constructionsError,
    totalHoursData,
    handleEmployeesAdded,
    handleDeleteConstruction,
    handleCopyFromSourceWeek,
    handleDeleteEmployee,
    handleHoursChange,
    editMode,
    handleToggleExpand,
    handleConstructionWithEmployeeAdded,
    weekDates: getWeekDates(currentWeek),
    selectedConstructionForEmployee,
    currentWeek,
    handleWeekChange,
    handleToggleEditMode,
    onWeeekChange,
    isExpanded,
    isCoping: copyFromPreviousWeekMutation.isPending,
    constructionsWithWorkHours,
    onSelectedConstructionForEmployeeChange,
    onSelectedConstructionsChange,
    selectedConstructions,
    handleFillWithSchedule,
    isFilling: fillWithScheduleMutation.isPending,
    hasUnsavedChanges,
    isSaving: saveWorkHoursMutation.isPending,
    handleCancelEdit,
    selectedEmployees,
    onSelectedEmployeesChange,
    getAvailableEmployeesForConstruction,
    getAvailableConstructions,
    getActiveEmployees,

    showInactiveConstructions,
    setShowInactiveConstructions,
    showInactiveEmployees,
    setShowInactiveEmployees,

    employees,
    constructions,
  };
};

export default useHoursTable;

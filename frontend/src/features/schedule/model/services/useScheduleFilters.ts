import { useState, useEffect } from 'react';
import dayjs from 'dayjs';

const SCHEDULE_FILTERS_STORAGE_KEY = 'scheduleFilters';

export const useScheduleFilters = () => {
  const [fromWeek, setFromWeek] = useState<Date>(() => {
    const saved = localStorage.getItem('scheduleFromWeek');
    return saved ? new Date(saved) : dayjs().startOf('isoWeek').toDate();
  });

  const [toWeek, setToWeek] = useState<Date>(() => {
    const saved = localStorage.getItem('scheduleToWeek');
    return saved
      ? new Date(saved)
      : dayjs().add(2, 'week').startOf('isoWeek').toDate();
  });

  const [selectedEmployees, setSelectedEmployees] = useState<string[]>(() => {
    const saved = localStorage.getItem(SCHEDULE_FILTERS_STORAGE_KEY);
    return saved ? (JSON.parse(saved).selectedEmployeeIds ?? []) : [];
  });

  const [showInactive, setShowInactive] = useState<boolean>(() => {
    const saved = localStorage.getItem(SCHEDULE_FILTERS_STORAGE_KEY);
    return saved ? (JSON.parse(saved).showInactive ?? false) : false;
  });

  const [selectedConstructions, setSelectedConstructions] = useState<string[]>(
    () => {
      const saved = localStorage.getItem(SCHEDULE_FILTERS_STORAGE_KEY);
      return saved ? (JSON.parse(saved).selectedConstructionIds ?? []) : [];
    }
  );

  const [showInactiveConstructions, setShowInactiveConstructions] =
    useState<boolean>(() => {
      const saved = localStorage.getItem(SCHEDULE_FILTERS_STORAGE_KEY);
      return saved
        ? (JSON.parse(saved).showInactiveConstructions ?? false)
        : false;
    });

  useEffect(() => {
    localStorage.setItem('scheduleFromWeek', fromWeek.toISOString());
    localStorage.setItem('scheduleToWeek', toWeek.toISOString());
  }, [fromWeek, toWeek]);

  useEffect(() => {
    localStorage.setItem(
      SCHEDULE_FILTERS_STORAGE_KEY,
      JSON.stringify({
        selectedEmployeeIds: selectedEmployees,
        showInactive,
        selectedConstructionIds: selectedConstructions,
        showInactiveConstructions,
      })
    );
  }, [
    selectedEmployees,
    showInactive,
    selectedConstructions,
    showInactiveConstructions,
  ]);

  return {
    fromWeek,
    setFromWeek,
    toWeek,
    setToWeek,
    selectedEmployees,
    setSelectedEmployees,
    showInactive,
    setShowInactive,
    selectedConstructions,
    setSelectedConstructions,
    showInactiveConstructions,
    setShowInactiveConstructions,
  };
};

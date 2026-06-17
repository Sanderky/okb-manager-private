import { useCallback, useState } from 'react';

const STORAGE_KEY = 'hours_table_filters';

interface StoredFilters {
  selectedConstructionIds: string[];
  selectedEmployeeIds: string[];
  showInactiveEmployees: boolean;
  showInactiveConstructions: boolean;
}

export const useSavedFilters = () => {
  const [filters, setFilters] = useState<StoredFilters>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          selectedConstructionIds: parsed.selectedConstructionIds ?? [],
          selectedEmployeeIds: parsed.selectedEmployeeIds ?? [],
          showInactiveEmployees: parsed.showInactiveEmployees ?? false,
          showInactiveConstructions: parsed.showInactiveConstructions ?? false,
        };
      } catch {
        console.log('Błąd ładowania filtrów z localStorage');
      }
    }
    return {
      selectedConstructionIds: [],
      selectedEmployeeIds: [],
      showInactiveEmployees: false,
      showInactiveConstructions: false,
    };
  });

  const updateFilter = useCallback(
    <K extends keyof StoredFilters>(key: K, value: StoredFilters[K]) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  return { filters, updateFilter };
};

import { db, auth } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import type {
  MRT_VisibilityState,
  MRT_DensityState,
} from 'material-react-table';
import dayjs from 'dayjs';

interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

interface ColumnFilter {
  id: string;
  value: any;
}

const DensityDefault: MRT_DensityState = 'compact';

export const useTableState = (
  tableName: string,
  defaultFilters: ColumnFilter[] = []
) => {
  const [columnVisibility, setColumnVisibility] = useState<MRT_VisibilityState>(
    {}
  );
  const [density, setDensity] = useState<MRT_DensityState>(DensityDefault);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [columnFilters, setColumnFilters] =
    useState<ColumnFilter[]>(defaultFilters);
  const [isLoading, setIsLoading] = useState(true);

  const isInitialLoad = useRef(true);

  useEffect(() => {
    const loadPreferences = () => {
      try {
        const saved = localStorage.getItem(`table-preferences-${tableName}`);
        if (saved) {
          const preferences = JSON.parse(saved);
          setColumnVisibility(preferences.columnVisibility || {});
          setDensity(preferences.density || DensityDefault);
          setPagination(
            preferences.pagination || { pageIndex: 0, pageSize: 10 }
          );
          setColumnFilters(preferences.columnFilters || []);
        }
      } catch (error) {
        console.error(
          'Error loading table preferences from local storage:',
          error
        );
      } finally {
        setIsLoading(false);
        isInitialLoad.current = false;
      }
    };

    loadPreferences();
  }, [tableName]);

  useEffect(() => {
    if (isLoading || isInitialLoad.current) return;

    const savePreferences = () => {
      try {
        const preferencesData = {
          columnVisibility,
          density,
          pagination,
          columnFilters,
          lastUpdated: new Date().toISOString(),
        };
        localStorage.setItem(
          `table-preferences-${tableName}`,
          JSON.stringify(preferencesData)
        );
      } catch (error) {
        console.error(
          'Error saving table preferences to local storage:',
          error
        );
      }
    };

    const timeoutId = setTimeout(savePreferences, 300);
    return () => clearTimeout(timeoutId);
  }, [
    columnVisibility,
    density,
    pagination,
    columnFilters,
    tableName,
    isLoading,
  ]);

  const handleSetColumnVisibility = (
    visibility: React.SetStateAction<MRT_VisibilityState>
  ) => {
    setColumnVisibility((prev) => {
      const newVisibility =
        typeof visibility === 'function' ? visibility(prev) : visibility;
      return { ...prev, ...newVisibility };
    });
  };

  const handleSetDensity = (
    newDensity: React.SetStateAction<MRT_DensityState>
  ) => {
    setDensity((prev) => {
      return typeof newDensity === 'function' ? newDensity(prev) : newDensity;
    });
  };

  const handleSetPagination = (
    newPagination: React.SetStateAction<PaginationState>
  ) => {
    setPagination((prev) => {
      return typeof newPagination === 'function'
        ? newPagination(prev)
        : newPagination;
    });
  };

  const handleSetColumnFilters = (
    filters: React.SetStateAction<ColumnFilter[]>
  ) => {
    setColumnFilters((prev) => {
      return typeof filters === 'function' ? filters(prev) : filters;
    });
  };

  const resetState = () => {
    setColumnVisibility({});
    setDensity(DensityDefault);
    setPagination({ pageIndex: 0, pageSize: 10 });
    setColumnFilters(defaultFilters);
    localStorage.removeItem(`table-preferences-${tableName}`);
  };

  return {
    setColumnVisibility: handleSetColumnVisibility,
    setDensity: handleSetDensity,
    setPagination: handleSetPagination,
    setColumnFilters: handleSetColumnFilters,
    columnVisibility,
    density,
    pagination,
    columnFilters,
    resetState,
    isLoading,
    isError: false,
  };
};

export const useFormFilters = <T extends object>(
  storageKey: string,
  defaultFilters: T
) => {
  const [filters, setFilters] = useState<T>(defaultFilters);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const loadFormFilters = () => {
      try {
        const saved = localStorage.getItem(`form-filters-${storageKey}`);
        if (saved) {
          const parsedFilters = JSON.parse(saved);

          const filtersWithDates: any = { ...parsedFilters };
          Object.keys(filtersWithDates).forEach((key) => {
            if (
              key.includes('Date') &&
              filtersWithDates[key] &&
              typeof filtersWithDates[key] === 'string'
            ) {
              filtersWithDates[key] = dayjs(filtersWithDates[key]);
            }
          });

          setFilters(filtersWithDates);
        }
      } catch (error) {
        console.error('Error loading form filters from local storage:', error);
      } finally {
        setIsLoading(false);
        isInitialLoad.current = false;
      }
    };

    loadFormFilters();
  }, [storageKey]);

  useEffect(() => {
    if (isLoading || isInitialLoad.current) {
      return;
    }

    const saveFormFilters = () => {
      try {
        const filtersToSave: any = { ...filters };
        Object.keys(filtersToSave).forEach((key) => {
          if (dayjs.isDayjs(filtersToSave[key])) {
            filtersToSave[key] = filtersToSave[key].toISOString();
          }
        });

        localStorage.setItem(
          `form-filters-${storageKey}`,
          JSON.stringify(filtersToSave)
        );
      } catch (error) {
        console.error('Error saving form filters to local storage:', error);
      }
    };

    const timeoutId = setTimeout(saveFormFilters, 300);
    return () => clearTimeout(timeoutId);
  }, [filters, storageKey, isLoading]);

  const handleSetFilters = (newFilters: React.SetStateAction<T>) => {
    setFilters((prev) => {
      return typeof newFilters === 'function' ? newFilters(prev) : newFilters;
    });
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    localStorage.removeItem(`form-filters-${storageKey}`);
  };

  return {
    filters,
    setFilters: handleSetFilters,
    resetFilters,
    isLoading,
  };
};

export const useTableStateFirebase = (tableName: string) => {
  const userId = auth.currentUser?.uid;

  const [columnVisibility, setColumnVisibility] = useState<MRT_VisibilityState>(
    {}
  );
  const [density, setDensity] = useState<MRT_DensityState>(DensityDefault);

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const isInitialLoad = useRef(true);

  useEffect(() => {
    const loadPreferences = async () => {
      if (!userId || !tableName) return;

      setIsLoading(true);
      try {
        const userDocRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const tablePrefs = data.preferences?.tables?.[tableName];

          if (tablePrefs) {
            setColumnVisibility(tablePrefs.columnVisibility || {});
            setDensity(tablePrefs.density || DensityDefault);
          }
        }
      } catch (error) {
        console.error('Error loading table preferences:', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
        isInitialLoad.current = false;
      }
    };

    loadPreferences();
  }, [userId, tableName]);

  useEffect(() => {
    if (!userId || !tableName || isLoading || isInitialLoad.current) return;

    const savePreferences = async () => {
      try {
        const userDocRef = doc(db, 'users', userId);
        const preferencesData = {
          columnVisibility,
          density,
          lastUpdated: new Date(),
        };

        await setDoc(
          userDocRef,
          {
            preferences: {
              tables: {
                [tableName]: preferencesData,
              },
            },
          },
          { merge: true }
        );
      } catch (error) {
        console.error('Error saving table preferences:', error);
        setIsError(true);
      }
    };

    const timeoutId = setTimeout(savePreferences, 500);
    return () => clearTimeout(timeoutId);
  }, [columnVisibility, density, userId, tableName, isLoading]);

  const handleSetColumnVisibility = (
    visibility: React.SetStateAction<MRT_VisibilityState>
  ) => {
    setColumnVisibility((prev) => {
      const newVisibility =
        typeof visibility === 'function' ? visibility(prev) : visibility;
      return { ...prev, ...newVisibility };
    });
  };

  const handleSetDensity = (
    newDensity: React.SetStateAction<MRT_DensityState>
  ) => {
    setDensity((prev) => {
      return typeof newDensity === 'function' ? newDensity(prev) : newDensity;
    });
  };

  const resetState = () => {
    setColumnVisibility({});
    setDensity(DensityDefault);
  };

  return {
    setColumnVisibility: handleSetColumnVisibility,
    setDensity: handleSetDensity,
    columnVisibility,
    density,
    resetState,
    isLoading,
    isError,
  };
};

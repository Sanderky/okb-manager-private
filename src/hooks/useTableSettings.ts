import { db, auth } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import type {
  MRT_VisibilityState,
  MRT_DensityState,
} from 'material-react-table';

export const useTableState = (tableName: string) => {
  const [columnVisibility, setColumnVisibility] = useState<MRT_VisibilityState>(
    {}
  );
  const [density, setDensity] = useState<MRT_DensityState>('comfortable');
  const [isLoading, setIsLoading] = useState(true);

  const isInitialLoad = useRef(true);

  useEffect(() => {
    const loadPreferences = () => {
      try {
        const saved = localStorage.getItem(`table-preferences-${tableName}`);
        if (saved) {
          const preferences = JSON.parse(saved);
          setColumnVisibility(preferences.columnVisibility || {});
          setDensity(preferences.density || 'comfortable');
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
  }, [columnVisibility, density, tableName, isLoading]);

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
    setDensity('comfortable');
    localStorage.removeItem(`table-preferences-${tableName}`);
  };

  return {
    setColumnVisibility: handleSetColumnVisibility,
    setDensity: handleSetDensity,
    columnVisibility,
    density,
    resetState,
    isLoading,
    isError: false,
  };
};

export const useTableStateFirebase = (tableName: string) => {
  const userId = auth.currentUser?.uid;

  const [columnVisibility, setColumnVisibility] = useState<MRT_VisibilityState>(
    {}
  );
  const [density, setDensity] = useState<MRT_DensityState>('comfortable');

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
            setDensity(tablePrefs.density || 'comfortable');
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
    setDensity('comfortable');
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

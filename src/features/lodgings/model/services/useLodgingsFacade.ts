import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployees } from '@/entities/employee';
import { useConstructions } from '@/entities/construction';
import { useViewMode } from './useViewMode';
import { useManageLodging } from './useManageLodgings';
import { useLodgings } from './useLodgings';

export const useLodgingsFacade = () => {
  const navigate = useNavigate();

  const { onSetDefaultView, setViewMode, viewMode, defaultViewMode } =
    useViewMode();
  const { isOpen, editingLodging, openAdd, openEdit, close } =
    useManageLodging();
  const { lodgings, isLoading: loadingLodgings } = useLodgings();
  const { employees, isLoading: loadingEmployees } = useEmployees();
  const { constructions, isLoading: loadingSites } = useConstructions();

  const handleClickOnConstruction = useCallback(
    (id: string | undefined) => {
      if (!id || id === 'orphan') return;
      navigate(`/constructions/${id}`);
    },
    [navigate]
  );

  const handleEmployeeClick = useCallback(
    (id: string) => {
      navigate(`/employees/${id}`);
    },
    [navigate]
  );

  const isLoading = loadingLodgings || loadingEmployees || loadingSites;

  return {
    viewMode,
    defaultViewMode,
    setViewMode,
    onSetDefaultView,
    isOpen,
    editingLodging,
    openAdd,
    openEdit,
    close,

    lodgings,
    employees,
    constructions,
    isLoading,

    handleClickOnConstruction,
    handleEmployeeClick,
  };
};

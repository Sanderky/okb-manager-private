import { useState, useCallback } from 'react';
import type { Lodging } from './types';

export const useManageLodging = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingLodging, setEditingLodging] = useState<Lodging | undefined>(
    undefined
  );

  const openAdd = useCallback(() => {
    setEditingLodging(undefined);
    setIsOpen(true);
  }, []);

  const openEdit = useCallback((lodging: Lodging) => {
    setEditingLodging(lodging);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setEditingLodging(undefined);
  }, []);

  return {
    isOpen,
    editingLodging,
    openAdd,
    openEdit,
    close,
  };
};

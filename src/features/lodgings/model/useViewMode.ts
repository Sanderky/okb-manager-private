import { useState } from 'react';
import type { ViewMode } from './types';

export const useViewMode = () => {
  const [defaultViewMode, setDefaultViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('lodgings_view_mode');
    return saved === 'grid' || saved === 'timeline' ? saved : 'timeline';
  });
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('lodgings_view_mode');
    return saved === 'grid' || saved === 'timeline' ? saved : 'timeline';
  });

  const onSetDefaultView = () => {
    localStorage.setItem('lodgings_view_mode', viewMode);
    setDefaultViewMode(viewMode);
  };

  return {
    viewMode,
    setViewMode,
    defaultViewMode,
    onSetDefaultView,
  };
};

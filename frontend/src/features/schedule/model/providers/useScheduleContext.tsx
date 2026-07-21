import React, { createContext, useContext } from 'react';
import { useScheduleManager } from '../services/useScheduleManager';

type ScheduleContextType = ReturnType<typeof useScheduleManager>;

const ScheduleContext = createContext<ScheduleContextType | null>(null);

export const useScheduleContext = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error(
      'useScheduleContext must be used within a ScheduleProvider'
    );
  }
  return context;
};

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const scheduleState = useScheduleManager();

  return (
    <ScheduleContext.Provider value={scheduleState}>
      {children}
    </ScheduleContext.Provider>
  );
};

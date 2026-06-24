import React, { createContext, useContext, type ReactNode } from 'react';
import {
  useCalendarFacade,
  type CalendarFacadeType,
} from '../services/useCalendarFacade';

const CalendarContext = createContext<CalendarFacadeType | null>(null);

export const useCalendarContext = () => {
  const context = useContext(CalendarContext);
  if (!context)
    throw new Error(
      'useCalendarContext must be used within a CalendarProvider'
    );
  return context;
};

export const CalendarProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const facade = useCalendarFacade();
  return (
    <CalendarContext.Provider value={facade}>
      {children}
    </CalendarContext.Provider>
  );
};

import React, { createContext, useContext, type ReactNode } from 'react';
import { useVacationsFacade, type VacationsFacadeType } from '../services/useVacationsFacade';


const VacationsContext = createContext<VacationsFacadeType | null>(null);

export const useVacationsContext = () => {
  const context = useContext(VacationsContext);
  if (!context) {
    throw new Error('useVacationsContext must be used within a VacationsProvider');
  }
  return context;
};

interface VacationsProviderProps {
  children: ReactNode;
}

export const VacationsProvider: React.FC<VacationsProviderProps> = ({ children }) => {
  const facade = useVacationsFacade();

  return (
    <VacationsContext.Provider value={facade}>
      {children}
    </VacationsContext.Provider>
  );
};
import React, { createContext, useContext } from 'react';
import { useLodgingsFacade } from '../services/useLodgingsFacade';

type LodgingsContextType = ReturnType<typeof useLodgingsFacade>;
const LodgingsContext = createContext<LodgingsContextType | null>(null);

export const useLodgingsContext = () => {
  const context = useContext(LodgingsContext);
  if (!context) {
    throw new Error(
      'useLodgingsContext must be used within a LodgingsProvider'
    );
  }
  return context;
};

export const LodgingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const facade = useLodgingsFacade();
  return (
    <LodgingsContext.Provider value={facade}>
      {children}
    </LodgingsContext.Provider>
  );
};

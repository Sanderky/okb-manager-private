import React, { createContext, useContext } from 'react';
import { useShowEmployee } from '../services/useShowEmployee';

type EmployeeShowContextType = ReturnType<typeof useShowEmployee>;
const EmployeeShowContext = createContext<EmployeeShowContextType | null>(null);

export const useEmployeeShowContext = () => {
  const context = useContext(EmployeeShowContext);
  if (!context)
    throw new Error(
      'useEmployeeShowContext must be used within EmployeeShowProvider'
    );
  return context;
};

export const EmployeeShowProvider: React.FC<{
  employeeId: string;
  children: React.ReactNode;
}> = ({ employeeId, children }) => {
  const service = useShowEmployee(employeeId);
  return (
    <EmployeeShowContext.Provider value={service}>
      {children}
    </EmployeeShowContext.Provider>
  );
};

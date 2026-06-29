import React, { createContext, useContext } from 'react';
import { useEditEmployee } from '../services/useEditEmployee';

type EmployeeEditContextType = ReturnType<typeof useEditEmployee>;
const EmployeeEditContext = createContext<EmployeeEditContextType | null>(null);

export const useEmployeeEditContext = () => {
  const context = useContext(EmployeeEditContext);
  if (!context)
    throw new Error(
      'useEmployeeEditContext must be used within EmployeeEditProvider'
    );
  return context;
};

export const EmployeeEditProvider: React.FC<{
  employeeId: string;
  children: React.ReactNode;
}> = ({ employeeId, children }) => {
  const service = useEditEmployee(employeeId);
  return (
    <EmployeeEditContext.Provider value={service}>
      {children}
    </EmployeeEditContext.Provider>
  );
};

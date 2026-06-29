import React, { createContext, useContext } from 'react';
import type { Employee } from '@/entities/employee';
import { useEmployeeList } from '../services/useEmployeesList';

type EmployeeListContextType = ReturnType<typeof useEmployeeList>;
const EmployeeListContext = createContext<EmployeeListContextType | null>(null);

export const useEmployeeListContext = () => {
  const context = useContext(EmployeeListContext);
  if (!context)
    throw new Error(
      'useEmployeeListContext must be used within EmployeeListProvider'
    );
  return context;
};

export const EmployeeListProvider: React.FC<{
  employees: Employee[];
  isLoading: boolean;
  children: React.ReactNode;
}> = ({ employees, isLoading, children }) => {
  const facade = useEmployeeList(employees, isLoading);
  return (
    <EmployeeListContext.Provider value={facade}>
      {children}
    </EmployeeListContext.Provider>
  );
};

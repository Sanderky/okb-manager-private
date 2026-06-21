import React, { createContext, useContext } from 'react';
import { useCreateEmployee } from '../services/useEmployeeCreate';

type AddEmployeeContextType = ReturnType<typeof useCreateEmployee>;

const AddEmployeeContext = createContext<AddEmployeeContextType | null>(null);

export const useAddEmployeeContext = () => {
  const context = useContext(AddEmployeeContext);
  if (!context) {
    throw new Error(
      'useAddEmployeeContext must be used within AddEmployeeProvider'
    );
  }
  return context;
};

export const AddEmployeeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const service = useCreateEmployee();

  return (
    <AddEmployeeContext.Provider value={service}>
      {children}
    </AddEmployeeContext.Provider>
  );
};

import React, { createContext, useContext } from 'react';
import { useConstructionCreateService } from '../services/useCreateConstruction';

type AddConstructionContextType = ReturnType<
  typeof useConstructionCreateService
>;

const AddConstructionContext = createContext<AddConstructionContextType | null>(
  null
);

export const useAddConstructionContext = () => {
  const context = useContext(AddConstructionContext);
  if (!context) {
    throw new Error(
      'useAddConstructionContext must be used within an AddConstructionProvider'
    );
  }
  return context;
};

export const AddConstructionProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const service = useConstructionCreateService();

  return (
    <AddConstructionContext.Provider value={service}>
      {children}
    </AddConstructionContext.Provider>
  );
};

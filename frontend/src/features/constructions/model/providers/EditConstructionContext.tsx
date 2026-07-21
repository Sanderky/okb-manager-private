import React, { createContext, useContext } from 'react';
import { useEditConstruction } from '../services/useEditConstruction';

type ConstructionEditContextType = ReturnType<typeof useEditConstruction> & {
  constructionId: string;
};

const ConstructionEditContext =
  createContext<ConstructionEditContextType | null>(null);

export const useConstructionEditContext = () => {
  const context = useContext(ConstructionEditContext);
  if (!context) {
    throw new Error(
      'useConstructionEditContext must be used within a ConstructionEditProvider'
    );
  }
  return context;
};

export const ConstructionEditProvider: React.FC<{
  constructionId: string;
  children: React.ReactNode;
}> = ({ constructionId, children }) => {
  const service = useEditConstruction(constructionId);

  return (
    <ConstructionEditContext.Provider value={{ ...service, constructionId }}>
      {children}
    </ConstructionEditContext.Provider>
  );
};

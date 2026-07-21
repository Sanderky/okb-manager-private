import React, { createContext, useContext } from 'react';
import { useShowConstruction } from '../services/useShowConstruction';

type ConstructionShowContextType = ReturnType<typeof useShowConstruction> & {
  constructionId: string;
};

const ConstructionShowContext =
  createContext<ConstructionShowContextType | null>(null);

export const useConstructionShowContext = () => {
  const context = useContext(ConstructionShowContext);
  if (!context) {
    throw new Error(
      'useConstructionShowContext must be used within ConstructionShowProvider'
    );
  }
  return context;
};

export const ConstructionShowProvider: React.FC<{
  constructionId: string;
  children: React.ReactNode;
}> = ({ constructionId, children }) => {
  const service = useShowConstruction(constructionId);

  return (
    <ConstructionShowContext.Provider value={{ ...service, constructionId }}>
      {children}
    </ConstructionShowContext.Provider>
  );
};

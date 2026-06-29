import React, { createContext, useContext } from 'react';
import type { Construction } from '@/entities/construction';
import { useConstructionsList } from '../services/useConstructionsList';

type ConstructionsListContextType = ReturnType<typeof useConstructionsList>;
const ConstructionsListContext =
  createContext<ConstructionsListContextType | null>(null);

export const useConstructionsListContext = () => {
  const context = useContext(ConstructionsListContext);
  if (!context)
    throw new Error(
      'useConstructionsListContext must be used within ConstructionsListProvider'
    );
  return context;
};

export const ConstructionsListProvider: React.FC<{
  constructions: Construction[];
  isLoading: boolean;
  children: React.ReactNode;
}> = ({ constructions, isLoading, children }) => {
  const facade = useConstructionsList(constructions, isLoading);
  return (
    <ConstructionsListContext.Provider value={facade}>
      {children}
    </ConstructionsListContext.Provider>
  );
};

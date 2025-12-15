import React, { createContext, useContext, useState, useMemo } from 'react';

interface LayoutContextType {
  headerHeight: number;
  setHeaderHeight: (height: number) => void;

  topBarHeight: number;
  setTopBarHeight: (height: number) => void;
}

const LayoutContext = createContext<LayoutContextType>({
  headerHeight: 0,
  setHeaderHeight: () => {},
  topBarHeight: 0,
  setTopBarHeight: () => {},
});

export const useLayout = () => useContext(LayoutContext);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [topBarHeight, setTopBarHeight] = useState(0);

  const value = useMemo(
    () => ({
      headerHeight,
      setHeaderHeight,
      topBarHeight,
      setTopBarHeight,
    }),
    [headerHeight, topBarHeight]
  );

  return (
    <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
  );
};

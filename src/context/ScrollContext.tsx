import React from 'react';

interface ScrollContextType {
  scrollToTop: () => void;
}

export const ScrollContext = React.createContext<ScrollContextType>({
  scrollToTop: () => {},
});

export const useScroll = () => React.useContext(ScrollContext);

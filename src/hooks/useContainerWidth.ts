import { useState, useRef, useCallback, useEffect } from 'react';

const useContainerBreakpoint = (): [
  React.RefObject<HTMLDivElement | null>,
  number,
] => {
  const [width, setWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    if (!entries || entries.length === 0) return;
    const newWidth = entries[0].contentRect.width;
    setWidth(newWidth);
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.unobserve(element);
    };
  }, [handleResize]);

  return [containerRef, width];
};

export default useContainerBreakpoint;

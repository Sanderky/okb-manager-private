import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
} from 'react';

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

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    if (width === 0) {
      const initialWidth = element.getBoundingClientRect().width;
      setWidth(initialWidth);
    }
  }, [containerRef]);

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

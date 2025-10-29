import { useEffect } from 'react';

const usePrintShortcut = (onPrint: () => void) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isPrintShortcut =
        (event.ctrlKey || event.metaKey) && event.key === 'p';

      if (isPrintShortcut) {
        event.preventDefault();
        event.stopPropagation();
        onPrint();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onPrint]);
};

export default usePrintShortcut;

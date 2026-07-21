import { useEffect } from 'react';

export const useUnsavedChangesWarning = (
  hasUnsavedChanges: boolean,
  warningMessage: string = 'Masz niezapisane zmiany. Czy na pewno chcesz wyjść?'
) => {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = warningMessage;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, warningMessage]);

  useEffect(() => {
    const handleLinkClick = (event: MouseEvent) => {
      if (!hasUnsavedChanges) return;

      const target = event.target as HTMLElement;
      const link = target.closest('a');

      if (link) {
        const href = link.getAttribute('href');

        if (href && href.startsWith('/') && !href.startsWith('#')) {
          if (!window.confirm(warningMessage)) {
            event.preventDefault();
            event.stopPropagation();
          }
        }
      }
    };

    document.addEventListener('click', handleLinkClick, true);
    return () => document.removeEventListener('click', handleLinkClick, true);
  }, [hasUnsavedChanges, warningMessage]);
};

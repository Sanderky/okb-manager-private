import React from 'react';
import { ErrorPage } from '@/pages/error';
import { queryClient } from '../lib/queryClient';
import { ErrorBoundary } from 'react-error-boundary';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/entities/auth';
import { ThemeContextProvider } from '@/shared/lib/theme';
import { LayoutProvider } from '@/shared/lib/LayoutContext';
import NotificationsProvider from '@/shared/ui/notifications/NotificationsProvider';
import DialogsProvider from '@/shared/ui/dialogs/DialogsProvider';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <ErrorBoundary FallbackComponent={ErrorPage}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeContextProvider>
            <LayoutProvider>
              <NotificationsProvider>
                <DialogsProvider>{children}</DialogsProvider>
              </NotificationsProvider>
            </LayoutProvider>
          </ThemeContextProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

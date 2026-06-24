import React from 'react';
import Loading from '@/shared/ui/Loading';
import { ErrorPage } from '@/pages/error';
import { useRealtime } from '../lib/useRealtime';
import { useAppInit } from '../model/useAppInit';

export const AppInitProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { authLoading, isLoading, isError } = useAppInit();

  useRealtime();

  if (authLoading || isLoading) {
    return (
      <Loading
        fullScreen
        message={authLoading ? 'Autoryzacja...' : 'Ładowanie danych...'}
      />
    );
  }

  if (isError) {
    return <ErrorPage />;
  }

  return <>{children}</>;
};

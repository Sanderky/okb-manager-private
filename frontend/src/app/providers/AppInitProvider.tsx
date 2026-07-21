import React from 'react';
import Loading from '@/shared/ui/Loading';
import { ErrorPage } from '@/pages/error';
import { useRealtime } from '../lib/useRealtime';
import { useAppInit } from '../model/useAppInit';
import { useTranslation } from 'react-i18next';

export const AppInitProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { authLoading, isLoading, isError } = useAppInit();
  const { t } = useTranslation('app');

  useRealtime();

  if (authLoading || isLoading) {
    return (
      <Loading
        fullScreen
        message={
          authLoading ? t('loading.authorization') : t('loading.dataLoading')
        }
      />
    );
  }

  if (isError) {
    return <ErrorPage />;
  }

  return <>{children}</>;
};

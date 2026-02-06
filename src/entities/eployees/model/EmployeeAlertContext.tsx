import React, { createContext, useContext, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEmployeeAlerts } from '../../../api/alerts'; // Import serwisu
import type { EmployeeAlert } from '../../../shared/model/types';

interface AlertContextType {
  alerts: EmployeeAlert[];
  loading: boolean;
  refetch: () => void;
  alertsCount: number;
}

const EmployeeAlertContext = createContext<AlertContextType | undefined>(
  undefined
);

export const EmployeeAlertProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const {
    data: alerts = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['alerts'],
    queryFn: getEmployeeAlerts,
  });

  return (
    <EmployeeAlertContext.Provider
      value={{
        alerts,
        loading: isLoading,
        refetch,
        alertsCount: alerts.length,
      }}
    >
      {children}
    </EmployeeAlertContext.Provider>
  );
};

export const useEmployeeAlert = () => {
  const context = useContext(EmployeeAlertContext);
  if (context === undefined) {
    throw new Error(
      'useEmployeeAlert must be used within an EmployeeAlertContext'
    );
  }
  return context;
};

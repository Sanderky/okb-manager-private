import React, {
  createContext,
  useState,
  useContext,
  type ReactNode,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { EmployeeAlert } from '../types';

interface AlertContextType {
  alerts: EmployeeAlert[];
  addAlert: (alert: Omit<EmployeeAlert, 'id'>) => void;
  addAlertWithId: (alert: EmployeeAlert) => void;
  removeAlert: (id: string) => void;
  removeAlertsByEmployee: (employeeId: string) => void;
  getEmployeeAlerts: (employeeId: string) => EmployeeAlert[];
  updateAlert: (
    id: string,
    updates: Partial<Omit<EmployeeAlert, 'id'>>
  ) => void;
  resetAlerts: () => void;
}

const EmployeeAlertContext = createContext<AlertContextType | undefined>(
  undefined
);

export const EmployeeAlertProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [alerts, setAlerts] = useState<EmployeeAlert[]>([]);

  const addAlert = (alert: Omit<EmployeeAlert, 'id'>) => {
    if (!alert) return;
    const id = uuidv4();
    const newAlert: EmployeeAlert = { ...alert, id };
    setAlerts((prev) => [...prev, newAlert]);
  };

  const addAlertWithId = (alert: EmployeeAlert) => {
    setAlerts((prev) => [...prev, alert]);
  };

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const removeAlertsByEmployee = (employeeId: string) => {
    setAlerts((prev) =>
      prev.filter((alert) => alert.employeeId !== employeeId)
    );
  };

  const getEmployeeAlerts = (employeeId: string) => {
    return alerts.filter((alert) => alert.employeeId === employeeId);
  };

  const updateAlert = (
    id: string,
    updates: Partial<Omit<EmployeeAlert, 'id'>>
  ) => {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === id ? { ...alert, ...updates } : alert))
    );
  };

  const resetAlerts = () => setAlerts([]);

  return (
    <EmployeeAlertContext.Provider
      value={{
        alerts,
        addAlert,
        addAlertWithId,
        removeAlert,
        removeAlertsByEmployee,
        getEmployeeAlerts,
        updateAlert,
        resetAlerts,
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

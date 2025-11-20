import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import { getEmployeeList } from '../api/employees';
import { useEmployeeAlert } from '../context/EmployeeAlertContext';
import type { AlertsSettings, Employee, EmployeeAlertSeverity } from '../types';
import { fetchAlertsSettings } from '../api/settings';

export const EmployeeAlertDefault = {
  a1Warning: 30,
  a1Critical: 14,
  contractWarning: 7,
  contractCritical: 2,
};

const generateAgreementAlert = (
  employee: Employee,
  alertsSettings: AlertsSettings
): {
  severity: EmployeeAlertSeverity;
  title: string;
  message: string;
} | null => {
  let dayWord = 'dni';
  const contractEndDate = employee.contractEndDate;
  const isPermanent = contractEndDate
    ? Boolean(employee.contractISPermanent)
    : false;

  if (contractEndDate && !isPermanent && employee.status) {
    const today = dayjs().startOf('day');
    const endDate = dayjs(contractEndDate).startOf('day');
    const daysDiff = endDate.diff(today, 'day');
    if (Math.abs(daysDiff) === 1) dayWord = 'dzień';

    if (daysDiff < 0) {
      return {
        severity: 'error',
        title: `Pracownik ${employee.name}`,
        message: `Umowa wygasła ${Math.abs(daysDiff)} ${dayWord} temu.`,
      };
    }
    if (daysDiff === 0) {
      return {
        severity: 'error',
        title: `Pracownik ${employee.name}`,
        message: 'Umowa wygasa dziś.',
      };
    }

    if (daysDiff <= alertsSettings.contractCritical) {
      return {
        severity: 'error',
        title: `Pracownik ${employee.name}`,
        message: `Umowa kończy się za ${daysDiff} ${dayWord}.`,
      };
    }
    if (daysDiff <= alertsSettings.contractWarning) {
      return {
        severity: 'warning',
        title: `Pracownik ${employee.name}`,
        message: `Umowa kończy się za ${daysDiff} ${dayWord}.`,
      };
    }
  }

  return null;
};

const generateA1Alert = (
  employee: Employee,
  alertsSettings: AlertsSettings
): {
  severity: EmployeeAlertSeverity;
  title: string;
  message: string;
} | null => {
  let dayWord = 'dni';
  const a1EndDate = employee.a1EndDate;

  if (a1EndDate && employee.status) {
    const today = dayjs().startOf('day');
    const endDate = dayjs(a1EndDate).startOf('day');
    const daysDiff = endDate.diff(today, 'day');
    if (Math.abs(daysDiff) === 1) dayWord = 'dzień';

    if (daysDiff < 0) {
      return {
        severity: 'error',
        title: `Pracownik ${employee.name}`,
        message: `A1 wygasła ${Math.abs(daysDiff)} ${dayWord} temu.`,
      };
    }
    if (daysDiff === 0) {
      return {
        severity: 'error',
        title: `Pracownik ${employee.name}`,
        message: 'A1 wygasa dziś.',
      };
    }

    if (daysDiff <= alertsSettings.a1Critical) {
      return {
        severity: 'error',
        title: `Pracownik ${employee.name}`,
        message: `A1 kończy się za ${daysDiff} ${dayWord}.`,
      };
    }
    if (daysDiff <= alertsSettings.a1Warning) {
      return {
        severity: 'warning',
        title: `Pracownik ${employee.name}`,
        message: `A1 kończy się za ${daysDiff} ${dayWord}.`,
      };
    }
  }

  return null;
};

const useEmployeesAlert = () => {
  const { addAlert, resetAlerts } = useEmployeeAlert();

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployeeList(),
  });

  const { data: alertsSettings } = useQuery({
    queryKey: ['alertsSettings'],
    queryFn: fetchAlertsSettings,
  });

  useEffect(() => {
    if (employees) {
      resetAlerts();
      employees.forEach((employee) => {
        const a1Alert = generateA1Alert(
          employee,
          alertsSettings ?? EmployeeAlertDefault
        );
        const agreementAlert = generateAgreementAlert(
          employee,
          alertsSettings ?? EmployeeAlertDefault
        );

        if (a1Alert)
          addAlert({
            employeeId: employee.id,
            employeeName: employee.name,
            severity: a1Alert.severity,
            title: a1Alert.title,
            message: a1Alert.message,
          });

        if (agreementAlert)
          addAlert({
            employeeId: employee.id,
            employeeName: employee.name,
            severity: agreementAlert.severity,
            title: agreementAlert.title,
            message: agreementAlert.message,
          });
      });
    }
  }, [employees, alertsSettings]);
};

export default useEmployeesAlert;

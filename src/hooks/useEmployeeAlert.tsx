import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import { getEmployeeList } from '../api/employees';
import { useEmployeeAlert } from '../context/EmployeeAlertContext';
import type { Employee, EmployeeAlertSeverity } from '../types';

export const EmployeeAlertRange = {
  a1: {
    warning: 30,
    critical: 14,
  },
  contract: {
    warning: 7,
    critical: 2,
  },
};

const generateAgreementAlert = (
  employee: Employee
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

    if (daysDiff <= EmployeeAlertRange.contract.critical) {
      return {
        severity: 'error',
        title: `Pracownik ${employee.name}`,
        message: `Umowa kończy się za ${daysDiff} ${dayWord}.`,
      };
    }
    if (daysDiff <= EmployeeAlertRange.contract.warning) {
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
  employee: Employee
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

    if (daysDiff <= EmployeeAlertRange.a1.critical) {
      return {
        severity: 'error',
        title: `Pracownik ${employee.name}`,
        message: `A1 kończy się za ${daysDiff} ${dayWord}.`,
      };
    }
    if (daysDiff <= EmployeeAlertRange.a1.warning) {
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

  useEffect(() => {
    if (employees) {
      resetAlerts();
      employees.forEach((employee) => {
        const a1Alert = generateA1Alert(employee);
        const agreementAlert = generateAgreementAlert(employee);

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
  }, [employees]);
};

export default useEmployeesAlert;

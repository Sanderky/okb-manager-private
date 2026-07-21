import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getEmployeesByScheduledConstruction } from '../../api/employees';

export const useActiveEmployeesCount = (constructionIds: string[]) => {
  return useQuery({
    queryKey: ['schedules', 'constructionEmployees', constructionIds],
    queryFn: async () => {
      if (!constructionIds || constructionIds.length === 0) return {};

      const employeeCounts: Record<string, number> = {};

      const employeesByConstruction = await getEmployeesByScheduledConstruction(
        constructionIds,
        dayjs().toDate()
      );

      employeesByConstruction.forEach((item) => {
        const activeEmployees = item.employees.filter((e) => e.status);
        employeeCounts[item.constructionId] = activeEmployees.length;
      });

      constructionIds.forEach((id) => {
        if (employeeCounts[id] === undefined) {
          employeeCounts[id] = 0;
        }
      });

      return employeeCounts;
    },
    enabled: !!constructionIds && constructionIds.length > 0,
  });
};

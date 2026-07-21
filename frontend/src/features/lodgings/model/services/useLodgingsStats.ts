import dayjs from 'dayjs';
import type { Lodging } from '../types';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLodgings } from './useLodgings';
import { EmployeeApi } from '@/entities/employee';

export const useLodgingsStats = () => {
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => EmployeeApi.getEmployeeList(),
  });

  const { lodgings } = useLodgings();

  const stats = useMemo(() => {
    const today = dayjs();

    const activeLodgings = lodgings.filter((l) =>
      today.isBetween(dayjs(l.startDate), dayjs(l.endDate), 'day', '[]')
    );

    const accommodatedTodaySet = new Set<string>();

    const accommodatedTotalSet = new Set<string>();

    lodgings.forEach((lodging) => {
      const extLodging = lodging as Lodging;

      if (extLodging.employeeIds) {
        extLodging.employeeIds.forEach((id) => accommodatedTotalSet.add(id));
      }

      if (extLodging.assignments && extLodging.assignments.length > 0) {
        extLodging.assignments.forEach((assign) => {
          const start = dayjs(assign.startDate);
          const end = dayjs(assign.endDate);

          if (today.isBetween(start, end, 'day', '[]')) {
            accommodatedTodaySet.add(assign.employeeId);
          }
        });
      } else {
        const lodgingActive = today.isBetween(
          dayjs(lodging.startDate),
          dayjs(lodging.endDate),
          'day',
          '[]'
        );
        if (lodgingActive) {
          lodging.employeeIds.forEach((id: string) =>
            accommodatedTodaySet.add(id)
          );
        }
      }
    });

    return {
      activeLodgingsCount: activeLodgings.length,
      accommodatedToday: accommodatedTodaySet.size,
      accommodatedTotal: accommodatedTotalSet.size,
      totalEmployees: employees.filter((e) => e.status).length,
      totalLodgings: lodgings.length,
    };
  }, [lodgings, employees]);

  return stats;
};

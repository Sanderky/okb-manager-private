import dayjs from 'dayjs';
import type { Lodging } from './types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteOutdatedLodgings } from '../api';

export const useCleanOutdatedLodgings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteOutdatedLodgings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lodgings'] });
    },
  });
};

export const getOutdatedCount = (lodgings: Lodging[]) => {
  const today = dayjs();
  const outdatedCount = lodgings.filter((l) =>
    dayjs(l.endDate).isBefore(today, 'day')
  ).length;
  return outdatedCount;
};

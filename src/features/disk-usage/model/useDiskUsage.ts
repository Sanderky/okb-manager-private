import { useQuery } from '@tanstack/react-query';
import { getDiskUsage } from '../api';
import { formatToGB } from './formatToGb';

export const useDiskUsage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['disk-usage'],
    queryFn: getDiskUsage,
    staleTime: 60 * 1000 * 15,
  });

  const used = formatToGB(data?.used);
  const total = formatToGB(data?.total);
  const percentage = (used / total) * 100;
  const error = isError || percentage > 100;

  return {
    used,
    total,
    percentage,
    isLoading,
    error,
  };
};

import { mockDb } from '@/shared/api/mock/mockDb';
import type { DiskUsage } from '../model/types';
import { delay } from '@/shared/lib/delay';

export const getDiskUsage = async (): Promise<DiskUsage> => {
  await delay(500);

  return { ...mockDb.metrics.diskUsage };
};

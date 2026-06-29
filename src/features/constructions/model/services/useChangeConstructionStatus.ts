import { useChangeConstructionStatus as useChangeConstructionStatusMutation } from '@/entities/construction';

export const useChangeConstructionStatus = () => {
  const updateMutation = useChangeConstructionStatusMutation();

  const changeConstructionStatus = async (
    constructionId: string,
    status: boolean,
    endDate?: Date | undefined,
    onSuccess?: () => void,
    onError?: () => void
  ) => {
    try {
      await updateMutation.mutateAsync({
        constructionId,
        status,
        endDate,
      });
      onSuccess?.();
    } catch {
      onError?.();
    }
  };

  const isPending = updateMutation.isPending;

  return { changeConstructionStatus, isPending };
};

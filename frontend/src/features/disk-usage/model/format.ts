export const formatToGB = (bytes: number | undefined): number => {
  if (!bytes || bytes === 0) return 0;

  const gb = bytes / Math.pow(1024, 3);

  return Math.ceil(gb);
};

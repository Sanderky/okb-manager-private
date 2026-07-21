export const toNumberOrNull = (value: any): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const num = Number(value);
  return isNaN(num) ? null : num;
};

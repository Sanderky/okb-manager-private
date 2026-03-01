export const shouldBeInactive = (endDate: Date | null | undefined) => {
  if (!endDate) {
    return false;
  }

  const today = new Date().toDateString();
  const end = new Date(endDate).toDateString();

  return new Date(end) <= new Date(today);
};
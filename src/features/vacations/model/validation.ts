import type { Vacation } from "@/entities/vacations";
import dayjs, { Dayjs } from "dayjs";

export const validateVacation = (
  employeeId: string,
  startDate: Dayjs,
  endDate: Dayjs,
  vacations: Vacation[],
  color: string
): { isValid: boolean; error?: string } => {
  if (!employeeId) {
    return { isValid: false, error: 'Wybierz pracownika' };
  }

  if (!startDate || !endDate) {
    return { isValid: false, error: 'Wybierz zakres dat' };
  }

  if (!color) {
    return { isValid: false, error: 'Wybierz kolor urlopu' };
  }

  if (endDate.isBefore(startDate, 'day')) {
    return {
      isValid: false,
      error: 'Data zakończenia nie może być wcześniejsza niż data rozpoczęcia',
    };
  }

  const conflictingDates: string[] = [];

  let currentDate = startDate;
  while (currentDate.isSameOrBefore(endDate, 'day')) {
    const hasConflict = vacations.some((vacation) => {
      if (vacation.employeeId !== employeeId) return false;

      const existingStart = dayjs(vacation.startDate).startOf('day');
      const existingEnd = dayjs(vacation.endDate).startOf('day');
      const day = currentDate.startOf('day');

      return (
        day.isSameOrAfter(existingStart) && day.isSameOrBefore(existingEnd)
      );
    });

    if (hasConflict) {
      conflictingDates.push(currentDate.format('DD.MM.YYYY'));
    }

    currentDate = currentDate.add(1, 'day');
  }

  if (conflictingDates.length > 0) {
    return {
      isValid: false,
      error: `Pracownik ma już urlop w dniach: ${conflictingDates.join(', ')}`,
    };
  }

  return { isValid: true };
};
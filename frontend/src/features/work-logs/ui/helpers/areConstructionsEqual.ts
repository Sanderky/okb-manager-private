import type { ConstructionsWithWorkHours } from "../../model/types";

export const areConstructionsEqual = (
  prev: ConstructionsWithWorkHours,
  next: ConstructionsWithWorkHours
) => {
  if (prev === next) return true;
  if (prev.id !== next.id) return false;
  if (prev.isActive !== next.isActive) return false;
  if (prev.totalHours !== next.totalHours) return false;
  if (prev.workHours.length !== next.workHours.length) return false;

  for (let i = 0; i < prev.workHours.length; i++) {
    const pWh = prev.workHours[i];
    const nWh = next.workHours[i];

    if (pWh.id !== nWh.id) return false;
    if (pWh.total !== nWh.total) return false;
    if (pWh.isActive !== nWh.isActive) return false;

    for (let j = 0; j < 7; j++) {
      if (pWh.hours[j] !== nWh.hours[j]) return false;
      if (pWh.isOnVacation[j] !== nWh.isOnVacation[j]) return false;
    }
  }

  return true;
};
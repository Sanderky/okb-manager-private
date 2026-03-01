import { sortByLastName } from "@/entities/employee";
import type { ConstructionsWithWorkHours } from "./types";

export const sortConstructionsWithWorkHours = (
  data: ConstructionsWithWorkHours[]
): ConstructionsWithWorkHours[] => {
  if (!data || data.length === 0) return data;
  return data
    .map((construction) => ({
      ...construction,
      workHours: [...construction.workHours].sort((a, b) =>
        sortByLastName(a.employeeName, b.employeeName)
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

import type { ScheduleEntry } from "@/entities/shedule";
import type { ScheduleMap } from "../model/types";

export const createScheduleMap = (schedules: ScheduleEntry[]): ScheduleMap => {
  const map = new Map<string, Map<string, ScheduleEntry>>();

  schedules.forEach((entry) => {
    if (!map.has(entry.employeeId)) {
      map.set(entry.employeeId, new Map());
    }

    map.get(entry.employeeId)!.set(entry.date, entry);
  });

  return map;
};



// src/entities/workLogs/api/index.ts (dostosuj ścieżkę)
import * as supabaseApi from './api'; // pamiętaj o zmianie nazwy oryginału!
import * as mockApi from './api.mock';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

export const {
  getWorkLogs,
  fetchWorkLogsForCopy,
  overrideWorkLogsForWeek,
  deleteAllWorkHoursForWeek,
  saveWorkLogDay
} = isMock ? mockApi : supabaseApi;
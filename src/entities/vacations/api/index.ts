import * as supabaseApi from './api';
import * as mockApi from './api.mock';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

export const {
  createVacation,
  updateVacation,
  removeVacation,
  getVacationListForMonths,
  removeEmployeeVacations,
  getUpcomingVacations,
  getUpcomingVacationsForEmployee,
} = isMock ? mockApi : supabaseApi;

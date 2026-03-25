import * as supabaseApi from './api';
import * as mockApi from './api.mock';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

export const {
  createEmployee,
  updateEmployee,
  removeEmployee,
  getEmployeeList,
  getEmployee,
  getEmployeeStats,
  getEmployeesByScheduledConstruction,
} = isMock ? mockApi : supabaseApi;

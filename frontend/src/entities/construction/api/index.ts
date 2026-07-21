import * as supabaseApi from './api';
import * as mockApi from './api.mock';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

export const {
  createConstruction,
  updateConstruction,
  removeConstruction,
  getConstructionList,
  getConstruction,
  getConstructionStats,
} = isMock ? mockApi : supabaseApi;

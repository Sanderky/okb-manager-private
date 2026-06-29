import * as supabaseApi from './api';
import * as mockApi from './api.mock';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

export const {
  login,
  logout,
  resetPassword,
  getSession,
  updatePassword,
  updateDisplayName,
  updateEmail,
  onAuthStateChange,
} = isMock ? mockApi : supabaseApi;

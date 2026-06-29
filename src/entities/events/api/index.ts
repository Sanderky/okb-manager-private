import * as supabaseApi from './api';
import * as mockApi from './api.mock';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

export const {
  createCalendarEvent,
  updateCalendarEvent,
  removeCalendarEvent,
  getCalendarEventsForMonths,
  getNearestUpcomingEvents,
  getUpcomingEventsForEmployee,
  getUpcomingEventsForConstruction,
  getEventsForEmployee,
} = isMock ? mockApi : supabaseApi;

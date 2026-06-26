import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import dayjs from 'dayjs';

import 'dayjs/locale/pl';
import 'dayjs/locale/de';

import commonPl from './locales/pl/common.json';
import authPl from './locales/pl/auth.json';
import app from './locales/pl/app.json';
import workLogsPl from './locales/pl/workLogs.json';
import filtersPl from './locales/pl/filters.json';
import constructionsPl from './locales/pl/constructions.json';
import employeesPl from './locales/pl/employees.json';
import vacationsPl from './locales/pl/vacations.json';
import calendarPl from './locales/pl/calendar.json';
import todoPl from './locales/pl/todo.json';

const resources = {
  'pl-PL': {
    common: commonPl,
    auth: authPl,
    app: app,
    workLogs: workLogsPl,
    filters: filtersPl,
    constructions: constructionsPl,
    employees: employeesPl,
    vacations: vacationsPl,
    calendar: calendarPl,
    todo: todoPl,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pl-PL',
    debug: false,

    defaultNS: 'common',

    interpolation: {
      escapeValue: false,
    },
  });

i18n.on('languageChanged', (lng) => {
  const shortLng = lng.substring(0, 2).toLowerCase();
  dayjs.locale(shortLng);
});

dayjs.locale(i18n.language.substring(0, 2).toLowerCase());

export default i18n;

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { DEFAULT_LANG, getShortLang } from '../languages';

import dayjs from 'dayjs';
import 'dayjs/locale/pl';
import 'dayjs/locale/de';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import isBetween from 'dayjs/plugin/isBetween';
import isoWeek from 'dayjs/plugin/isoWeek';

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
import schedulePl from './locales/pl/schedule.json';
import lodgingsPl from './locales/pl/lodgings.json';
import homePl from './locales/pl/home.json';
import fileBrowserPl from './locales/pl/fileBrowser.json';
import diskUsagePl from './locales/pl/diskUsage.json';
import contractorsPl from './locales/pl/contractors.json';
import settingsPl from './locales/pl/settings.json';

import commonEn from './locales/en/common.json';
import authEn from './locales/en/auth.json';
import appEn from './locales/en/app.json';
import workLogsEn from './locales/en/workLogs.json';
import filtersEn from './locales/en/filters.json';
import constructionsEn from './locales/en/constructions.json';
import employeesEn from './locales/en/employees.json';
import vacationsEn from './locales/en/vacations.json';
import calendarEn from './locales/en/calendar.json';
import todoEn from './locales/en/todo.json';
import scheduleEn from './locales/en/schedule.json';
import lodgingsEn from './locales/en/lodgings.json';
import homeEn from './locales/en/home.json';
import fileBrowserEn from './locales/en/fileBrowser.json';
import diskUsageEn from './locales/en/diskUsage.json';
import contractorsEn from './locales/en/contractors.json';
import settingsEn from './locales/en/settings.json';

import workLogsDe from './locales/de/workLogs.json';

dayjs.extend(localizedFormat);
dayjs.extend(isBetween);
dayjs.extend(isoWeek);

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
    schedule: schedulePl,
    lodgings: lodgingsPl,
    home: homePl,
    fileBrowser: fileBrowserPl,
    diskUsage: diskUsagePl,
    contractors: contractorsPl,
    settings: settingsPl,
  },
  'en-US': {
    common: commonEn,
    auth: authEn,
    app: appEn,
    workLogs: workLogsEn,
    filters: filtersEn,
    constructions: constructionsEn,
    employees: employeesEn,
    vacations: vacationsEn,
    calendar: calendarEn,
    todo: todoEn,
    schedule: scheduleEn,
    lodgings: lodgingsEn,
    home: homeEn,
    fileBrowser: fileBrowserEn,
    diskUsage: diskUsageEn,
    contractors: contractorsEn,
    settings: settingsEn,
  },
  'de-DE': {
    workLogs: workLogsDe,
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANG,
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on('languageChanged', (lng) => {
  dayjs.locale(getShortLang(lng));
});

dayjs.locale(getShortLang(i18n.language || DEFAULT_LANG));

export default i18n;

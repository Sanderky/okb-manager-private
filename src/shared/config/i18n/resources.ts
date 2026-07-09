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

import {
  plPL as corePl,
  deDE as coreDe,
  enUS as coreEn,
} from '@mui/material/locale';
import {
  plPL as pickersPl,
  deDE as pickersDe,
  enUS as pickersEn,
} from '@mui/x-date-pickers/locales';
import { MRT_Localization_PL } from 'material-react-table/locales/pl';
import { MRT_Localization_DE } from 'material-react-table/locales/de';
import { MRT_Localization_EN } from 'material-react-table/locales/en';
import type { MRT_Localization } from 'material-react-table';
import type { LangCode } from './languages';

export const I18N_RESOURCES = {
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
  },
};

export const MUI_LOCALES: Record<LangCode, any[]> = {
  'pl-PL': [corePl, pickersPl],
  'de-DE': [coreDe, pickersDe],
  'en-US': [coreEn, pickersEn],
};

export const MRT_LOCALES: Record<LangCode, MRT_Localization> = {
  'pl-PL': MRT_Localization_PL,
  'de-DE': MRT_Localization_DE,
  'en-US': MRT_Localization_EN,
};

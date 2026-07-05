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

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

export const LANGUAGES = ['pl-PL', 'de-DE', 'en-US'] as const;
export type LangCode = (typeof LANGUAGES)[number];

export const DEFAULT_LANG: LangCode = isMock ? 'en-US' : 'pl-PL';

export const getShortLang = (lang: string) =>
  lang.substring(0, 2).toLowerCase();

export interface LanguageMetadata {
  code: LangCode;
  nativeName: string;
  translationKey: string;
}

export const LANGUAGES_CONFIG: Record<LangCode, LanguageMetadata> = {
  'pl-PL': {
    code: 'pl-PL',
    nativeName: 'Polski',
    translationKey: 'languages.pl-PL',
  },
  'de-DE': {
    code: 'de-DE',
    nativeName: 'Deutsch',
    translationKey: 'languages.de-DE',
  },
  'en-US': {
    code: 'en-US',
    nativeName: 'English',
    translationKey: 'languages.en-US',
  },
};

export const UI_LANGUAGES: LangCode[] = ['pl-PL', 'en-US'];

export const REPORT_LANGUAGES: LangCode[] = ['pl-PL', 'de-DE', 'en-US'];

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

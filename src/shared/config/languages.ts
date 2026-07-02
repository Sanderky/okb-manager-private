import { plPL as corePl, deDE as coreDe } from '@mui/material/locale';
import {
  plPL as pickersPl,
  deDE as pickersDe,
} from '@mui/x-date-pickers/locales';
import { MRT_Localization_PL } from 'material-react-table/locales/pl';
import { MRT_Localization_DE } from 'material-react-table/locales/de';
import type { MRT_Localization } from 'material-react-table';

export const LANGUAGES = ['pl-PL', 'de-DE'] as const;
export type LangCode = (typeof LANGUAGES)[number];

export const DEFAULT_LANG: LangCode = 'pl-PL';
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
};

export const MUI_LOCALES: Record<LangCode, any[]> = {
  'pl-PL': [corePl, pickersPl],
  'de-DE': [coreDe, pickersDe],
};

export const MRT_LOCALES: Record<LangCode, MRT_Localization> = {
  'pl-PL': MRT_Localization_PL,
  'de-DE': MRT_Localization_DE,
};

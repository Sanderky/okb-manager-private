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

import { useTranslation } from 'react-i18next';
import { DEFAULT_LANG, type LangCode } from '../config/i18n/languages';
import { MRT_LOCALES } from '../config/i18n/resources';

export const useMaterialTableLanguage = () => {
  const { i18n } = useTranslation();

  const currentLang = (i18n.language || DEFAULT_LANG) as LangCode;

  return MRT_LOCALES[currentLang] || MRT_LOCALES[DEFAULT_LANG];
};

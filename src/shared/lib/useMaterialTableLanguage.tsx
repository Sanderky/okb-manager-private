import { useTranslation } from 'react-i18next';
import { DEFAULT_LANG, MRT_LOCALES, type LangCode } from '../config/languages';

export const useMaterialTableLanguage = () => {
  const { i18n } = useTranslation();

  const currentLang = (i18n.language || DEFAULT_LANG) as LangCode;

  return MRT_LOCALES[currentLang] || MRT_LOCALES[DEFAULT_LANG];
};

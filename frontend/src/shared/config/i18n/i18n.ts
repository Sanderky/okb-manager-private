import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { DEFAULT_LANG, getShortLang } from './languages';
import { setDayjsLocale } from '../dayjs';
import { I18N_RESOURCES } from './resources';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: I18N_RESOURCES,
    fallbackLng: DEFAULT_LANG,
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  });


setDayjsLocale(getShortLang(i18n.language || DEFAULT_LANG));

i18n.on('languageChanged', (lng) => {
  setDayjsLocale(getShortLang(lng));
});

export default i18n;

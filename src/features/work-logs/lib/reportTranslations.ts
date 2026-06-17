import type { LangCode } from '@/shared/model/types';

export interface ReportTranslations {
  title: string;
  subtitle: string;
  week: string;
  sum: string;
  totalSum: string;
  construction: string;
  employee: string;
  vacation: string;
  noData: string;
  fileNamePrefix: string;
  constructions: string;
  employees: string;
}

const PL: ReportTranslations = {
  title: 'Raport godzin pracy',
  subtitle: 'Okres',
  week: 'Tydzień',
  sum: 'Suma',
  totalSum: 'Suma całkowita',
  construction: 'Budowa',
  employee: 'Pracownik',
  vacation: 'Urlop',
  noData: 'Brak danych',
  fileNamePrefix: 'Raport_godzin_',
  constructions: 'Budowy',
  employees: 'Pracownicy',
};

const DE: ReportTranslations = {
  title: 'Arbeitszeitbericht',
  subtitle: 'Zeitraum',
  week: 'Woche',
  sum: 'Summe',
  totalSum: 'Gesamtsumme',
  construction: 'Baustelle',
  employee: 'Mitarbeiter',
  vacation: 'Urlaub',
  noData: 'Keine Daten',
  fileNamePrefix: 'Arbeitszeitbericht_',
  constructions: 'Baustellen',
  employees: 'Mitarbeiter',
};

const Translations: Record<LangCode, ReportTranslations> = {
  'pl-PL': PL,
  'de-DE': DE,
};

export const getReportTranslations = (lang: LangCode): ReportTranslations => {
  return Translations[lang] || Translations['pl-PL'];
};

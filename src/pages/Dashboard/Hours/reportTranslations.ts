export type LangCode = 'pl-PL' | 'de-DE';

export const Langs: Record<LangCode, string> = {
  'pl-PL': 'Polski',
  'de-DE': 'Niemiecki',
};

interface ReportTranslations {
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
};

const Transations: Record<LangCode, ReportTranslations> = {
  'pl-PL': PL,
  'de-DE': DE,
};

export const getReporTranslations = (lang: LangCode) => Transations[lang];

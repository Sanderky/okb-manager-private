export const SYSTEM_FOLDER_PREFIX = 'system-';

export const FOLDER_NAMES: Record<string, string> = {
  // Root folders
  employees: `${SYSTEM_FOLDER_PREFIX}employees`,
  constructions: `${SYSTEM_FOLDER_PREFIX}constructions`,

  // Attachments
  id_card: `${SYSTEM_FOLDER_PREFIX}id_card`,
  contract: `${SYSTEM_FOLDER_PREFIX}contract`,
  a1: `${SYSTEM_FOLDER_PREFIX}a1`,
  other: `${SYSTEM_FOLDER_PREFIX}other`,
};

export const FOLDER_TRANSLATIONS: Record<string, string> = {
  // Root folders
  [`${SYSTEM_FOLDER_PREFIX}employees`]: 'Pracownicy',
  [`${SYSTEM_FOLDER_PREFIX}constructions`]: 'Budowy',

  // Attachments
  [`${SYSTEM_FOLDER_PREFIX}id_card`]: 'Dowód osobisty',
  [`${SYSTEM_FOLDER_PREFIX}contract`]: 'Umowa',
  [`${SYSTEM_FOLDER_PREFIX}a1`]: 'Zaświadczenie A1',
  [`${SYSTEM_FOLDER_PREFIX}other`]: 'Inne dokumenty',
};

// export const SYSTEM_FOLDER_PREFIX = 'system-';

// // 1. Definiujemy strukturę jako "const" (Readonly)
// export const STORAGE_FOLDERS = {
//   // Root categories
//   EMPLOYEES: `${SYSTEM_FOLDER_PREFIX}employees`,
//   CONSTRUCTIONS: `${SYSTEM_FOLDER_PREFIX}constructions`,

//   // Sub-categories (Attachments)
//   ID_CARD: `${SYSTEM_FOLDER_PREFIX}id_card`,
//   CONTRACT: `${SYSTEM_FOLDER_PREFIX}contract`,
//   A1: `${SYSTEM_FOLDER_PREFIX}a1`,
//   OTHER: `${SYSTEM_FOLDER_PREFIX}other`,
// } as const;

// // 2. Generujemy typ z wartości (np. 'system-employees' | 'system-id_card' ...)
// export type SystemFolderName = typeof STORAGE_FOLDERS[keyof typeof STORAGE_FOLDERS];

// // 3. Tłumaczenia (Labels)
// // Record wymusza, żebyś obsłużył wszystkie klucze zdefiniowane wyżej!
// export const FOLDER_LABELS: Record<SystemFolderName, string> = {
//   [STORAGE_FOLDERS.EMPLOYEES]: 'Pracownicy',
//   [STORAGE_FOLDERS.CONSTRUCTIONS]: 'Budowy',
//   [STORAGE_FOLDERS.ID_CARD]: 'Dowód osobisty',
//   [STORAGE_FOLDERS.CONTRACT]: 'Umowa',
//   [STORAGE_FOLDERS.A1]: 'Zaświadczenie A1',
//   [STORAGE_FOLDERS.OTHER]: 'Inne dokumenty',
// };
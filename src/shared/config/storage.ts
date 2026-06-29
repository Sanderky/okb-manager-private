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
  [`${SYSTEM_FOLDER_PREFIX}employees`]: 'folders.employees',
  [`${SYSTEM_FOLDER_PREFIX}constructions`]: 'folders.constructions',

  // Attachments
  [`${SYSTEM_FOLDER_PREFIX}id_card`]: 'folders.id_card',
  [`${SYSTEM_FOLDER_PREFIX}contract`]: 'folders.contract',
  [`${SYSTEM_FOLDER_PREFIX}a1`]: 'folders.a1',
  [`${SYSTEM_FOLDER_PREFIX}other`]: 'folders.other',
};
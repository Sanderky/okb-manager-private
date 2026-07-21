import { createClient } from '@supabase/supabase-js';

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const PUBLIC_BUCKET_NAME = import.meta.env.VITE_PUBLIC_BUCKET_NAME;
const DEFAULT_PUBLIC_BUCKET_NAME = 'system';
const PRIVATE_BUCKET_NAME = import.meta.env.VITE_FILES_BUCKET_NAME;
const DEFAULT_PRIVATE_BUCKET_NAME = 'files';
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  (IS_MOCK ? 'https://mock.supabase.com' : '');
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || (IS_MOCK ? 'mock-key' : '');

export const STORAGE_BUCKET = PRIVATE_BUCKET_NAME ?? DEFAULT_PRIVATE_BUCKET_NAME;
export const PUBLIC_STORAGE_BUCKET= PUBLIC_BUCKET_NAME ?? DEFAULT_PUBLIC_BUCKET_NAME;
export const RODO_FILENAME = 'rodo.pdf'

if (!IS_MOCK && (!SUPABASE_URL || !SUPABASE_KEY)) {
  throw new Error('Error initializing Supabase! URL or key is missing.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
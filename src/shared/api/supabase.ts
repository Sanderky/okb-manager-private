import { createClient } from '@supabase/supabase-js';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  (isMock ? 'https://mock.supabase.com' : '');
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || (isMock ? 'mock-key' : '');

if (!isMock && (!supabaseUrl || !supabaseKey)) {
  throw new Error('Błąd inicjalizacji Supabase! Brak URL lub klucza.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

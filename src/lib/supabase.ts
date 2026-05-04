import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ckcsdsxlzcyxyunsrboz.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrY3Nkc3hsemN5eHl1bnNyYm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NjA3ODAsImV4cCI6MjA5MjIzNjc4MH0.r2IwpS_92X73_2EfJajVKKMG3BPdmUZ640JWpT9yODg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

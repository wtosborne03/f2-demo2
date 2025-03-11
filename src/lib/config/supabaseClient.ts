import { createClient, type SupabaseClientOptions } from '@supabase/supabase-js'
import type { Database } from '../../database.types';

export const supabase = createClient<Database>("https://beqempvcsbabatjpqhxl.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlcWVtcHZjc2JhYmF0anBxaHhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc5Nzc1MzIsImV4cCI6MjA0MzU1MzUzMn0.6KYGe2iBS5OicocyaTACkyRk-N-0glzgIRtD_hT4H54");

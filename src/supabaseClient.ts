import { createClient, type SupabaseClientOptions } from '@supabase/supabase-js'

const supabaseUrl = "https://beqempvcsbabatjpqhxl.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlcWVtcHZjc2JhYmF0anBxaHhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc5Nzc1MzIsImV4cCI6MjA0MzU1MzUzMn0.6KYGe2iBS5OicocyaTACkyRk-N-0glzgIRtD_hT4H54"



export const supabase = createClient(supabaseUrl, supabaseAnonKey)

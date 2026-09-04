import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://flwggxfpdtxhfkunimyj.supabase.co'

const supabaseKey = 'sb_publishable_raj1WBx-KN--AEVFJCSp0g_zPDV1xAl'

export const supabase = createClient(supabaseUrl, supabaseKey)

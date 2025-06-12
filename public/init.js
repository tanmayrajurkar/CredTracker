// Initialize Supabase client
const supabaseUrl = window.config.SUPABASE_URL;
const supabaseKey = window.config.SUPABASE_KEY;
window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey); 
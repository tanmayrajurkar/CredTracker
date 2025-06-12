// Initialize Supabase client
try {
    const supabaseUrl = window.config.SUPABASE_URL;
    const supabaseKey = window.config.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('Supabase configuration is missing');
        throw new Error('Supabase configuration is missing');
    }
    
    window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized successfully');
} catch (error) {
    console.error('Error initializing Supabase client:', error);
} 
// Initialize Supabase client
try {
    const supabaseUrl = window.config.SUPABASE_URL;
    const supabaseKey = window.config.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration is missing');
    }
    
    // Create and expose the Supabase client
    const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
    window.supabaseClient = supabaseClient;
    
    // Set up auth state change listener
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            window.currentUser = session.user;
            // Dispatch a custom event that style.js can listen to
            window.dispatchEvent(new CustomEvent('authStateChanged', { 
                detail: { event, session }
            }));
        } else if (event === 'SIGNED_OUT') {
            window.currentUser = null;
            window.dispatchEvent(new CustomEvent('authStateChanged', { 
                detail: { event, session: null }
            }));
        }
    });

    // Check initial session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            window.currentUser = session.user;
            window.dispatchEvent(new CustomEvent('authStateChanged', { 
                detail: { event: 'SIGNED_IN', session }
            }));
        }
    });
} catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    window.supabaseClient = null;
} 
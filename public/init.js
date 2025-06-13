// Initialize Supabase client
try {
    const supabaseUrl = window.config.SUPABASE_URL;
    const supabaseKey = window.config.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration is missing');
    }
    
    // Create and expose the Supabase client with CORS configuration
    const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            storage: {
                getItem: (key) => {
                    const value = localStorage.getItem(key);
                    return value ? JSON.parse(value) : null;
                },
                setItem: (key, value) => {
                    localStorage.setItem(key, JSON.stringify(value));
                },
                removeItem: (key) => {
                    localStorage.removeItem(key);
                }
            }
        },
        global: {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        }
    });
    window.supabaseClient = supabaseClient;
    
    // Set up auth state change listener
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            window.currentUser = session.user;
            window.dispatchEvent(new CustomEvent('authStateChanged', { 
                detail: { event, session }
            }));
        } else if (event === 'SIGNED_OUT') {
            // Clear all auth-related data
            window.currentUser = null;
            localStorage.removeItem('supabase.auth.token');
            localStorage.removeItem('sb-' + supabaseUrl.split('//')[1].split('.')[0] + '-auth-token');
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
        } else {
            // Ensure we're logged out if no session
            window.currentUser = null;
            localStorage.removeItem('supabase.auth.token');
            localStorage.removeItem('sb-' + supabaseUrl.split('//')[1].split('.')[0] + '-auth-token');
        }
    }).catch(error => {
        console.error('Error checking initial session:', error);
        if (error.message.includes('CORS')) {
            console.error('CORS error detected. Please check your Supabase project settings and ensure your domain is allowed.');
        }
    });
} catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    window.supabaseClient = null;
} 
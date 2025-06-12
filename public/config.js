// Environment configuration
const config = {
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_KEY: process.env.SUPABASE_KEY || ''
};

// Export the configuration
window.config = config; 
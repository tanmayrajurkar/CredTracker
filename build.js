const fs = require('fs');
const path = require('path');

// Read the config file
const configPath = path.join(__dirname, 'public', 'config.js');
let configContent = fs.readFileSync(configPath, 'utf8');

// Replace the values with environment variables
configContent = configContent.replace(
    /SUPABASE_URL: '.*?'/,
    `SUPABASE_URL: '${process.env.SUPABASE_URL}'`
);
configContent = configContent.replace(
    /SUPABASE_KEY: '.*?'/,
    `SUPABASE_KEY: '${process.env.SUPABASE_KEY}'`
);

// Write the modified content back
fs.writeFileSync(configPath, configContent); 
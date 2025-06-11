const fs = require('fs');
const path = require('path');

const envFilePath = path.resolve(__dirname, '../config.js');

const envContent = `
window.SUPABASE_URL = "${process.env.SUPABASE_URL}";
window.SUPABASE_KEY = "${process.env.SUPABASE_KEY}";
`;

fs.writeFileSync(envFilePath, envContent);

console.log('Generated config.js with environment variables.'); 
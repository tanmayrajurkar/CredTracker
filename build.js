const fs = require('fs');
const path = require('path');
require('dotenv').config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;
if (!url || !key) {
  console.error('build.js: Missing SUPABASE_URL or SUPABASE_KEY.');
  console.error('  Local: add them to .env in the project root, then run npm run build (or npm start).');
  process.exit(1);
}

const templatePath = path.join(__dirname, 'public', 'config.template.js');
const configPath = path.join(__dirname, 'public', 'config.js');
let configContent = fs.readFileSync(templatePath, 'utf8');

configContent = configContent.replace(
  /SUPABASE_URL:\s*".*?"/,
  `SUPABASE_URL: ${JSON.stringify(url)}`
);
configContent = configContent.replace(
  /SUPABASE_KEY:\s*".*?"/,
  `SUPABASE_KEY: ${JSON.stringify(key)}`
);

fs.writeFileSync(configPath, configContent);

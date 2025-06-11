const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const port = 3000;

// Serve static files
app.use(express.static('.'));

// Serve environment variables
app.get('/env.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`
        window.env = {
            SUPABASE_URL: "${process.env.SUPABASE_URL}",
            SUPABASE_KEY: "${process.env.SUPABASE_KEY}"
        };
    `);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 
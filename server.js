const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve static files from the root directory
app.use(express.static(__dirname));

// Dynamically route /api/ requests to the files in the api/ directory
app.all('/api/:route', async (req, res) => {
    const route = req.params.route;
    const filePath = path.join(__dirname, 'api', `${route}.js`);

    if (fs.existsSync(filePath)) {
        try {
            // Require the Vercel function
            const handler = require(filePath);
            // Vercel functions expect (req, res)
            await handler(req, res);
        } catch (error) {
            console.error(`Error in API route /api/${route}:`, error);
            res.status(500).json({ error: 'Internal Server Error', details: error.message });
        }
    } else {
        res.status(404).json({ error: 'API route not found' });
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 AI Creator Hub running at: http://localhost:${PORT}`);
    console.log(`📡 API routes active: /api/register, /api/login, /api/user, /api/use-credit, /api/logout\n`);
});

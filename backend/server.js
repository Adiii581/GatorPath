const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001; // Use port 3001 (React often uses 3000)

// --- Middleware ---
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Allow server to accept JSON data

// --- Basic Test Route ---
app.get('/', (req, res) => {
  res.send('🐊 GatorPath Server is running!');
});

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
// server.js
// Entry point: Express server exposing the chat API.

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '15mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', chatRoutes);

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  const frontendPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Generic error handler (e.g. multer file-size errors)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Gemini Chatbot backend listening on http://localhost:${PORT}`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn('WARNING: GEMINI_API_KEY is not set. Add it to backend/.env');
  }
});

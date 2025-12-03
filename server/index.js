// server/index.js (ESM)
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import apiSettingsRouter from './routes/apiSettings.js';
import filesRouter from './routes/files.js';
import sessionsRouter from './routes/sessions.js';
import chatRouter from './routes/chat.js';
import { PORT } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve uploads (unchanged)
app.use('/public/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Serve Vite build output (dist) from project root's dist folder.
// Assumes project structure:
// project-root/
//   dist/          <-- built React app (vite build)
//   server/
//     index.js
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// API routes (keep these above the SPA fallback so /api/* works)
app.use('/api/api-settings', apiSettingsRouter);
app.use('/api/files', filesRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/chat', chatRouter);

// health check / API root
app.get('/api', (req, res) => res.json({ ok: true, msg: 'API server running' }));

// SPA fallback: serve index.html for any non-API route (client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      console.error('Error sending index.html', err);
      res.status(500).send('Server error');
    }
  });
});

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));

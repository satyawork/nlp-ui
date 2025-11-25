// server/index.js (ESM)
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import apiSettingsRouter from './routes/apiSettings.js';
import filesRouter from './routes/files.js';
import sessionsRouter from './routes/sessions.js';
import chatRouter from './routes/chat.js';
import { PORT } from './config.js';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// static uploads
app.use('/public/uploads', express.static('./public/uploads'));

// api routes
app.use('/api/api-settings', apiSettingsRouter);
app.use('/api/files', filesRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/chat', chatRouter);

app.get('/', (req, res) => res.json({ ok: true, msg: 'API server running' }));

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));

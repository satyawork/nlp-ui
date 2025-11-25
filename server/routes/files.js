// server/routes/files.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { ensureUploadDir, makeId, nowIso } from '../utils.js';
import { FilesStore, ApiSettingsStore } from '../stores/fileStore.js';
import { UPLOAD_DIR } from '../config.js';
import fs from 'fs';

const router = express.Router();
await ensureUploadDir();

// store to save locally
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// POST /api/files/upload
// behavior: read ApiSettings; if an API that looks like a file-store is configured and has baseUrl,
// forward the file to that baseUrl (multipart form). Otherwise save locally.
router.post('/upload', upload.single('file'), async (req, res) => {
  // first try configured file-store API
  const settings = await ApiSettingsStore.getSettings();
  const fileStoreApi = (settings.apis || []).find(a => (a.adapter === 'filestore') || (a.name && a.name.toLowerCase().includes('file')));
  if (fileStoreApi && fileStoreApi.baseUrl) {
    // forward file to remote file store
    try {
      const form = new FormData();
      if (req.file) {
        form.append('file', fs.createReadStream(req.file.path), { filename: req.file.originalname });
      }
      // add other fields if needed
      const forwarded = await fetch(fileStoreApi.baseUrl, {
        method: 'POST',
        headers: fileStoreApi.headers?.reduce((acc, h) => (h.key ? (acc[h.key] = h.value, acc) : acc), {}) || {},
        body: form
      });
      const text = await forwarded.text();
      // store metadata locally referencing remote
      const meta = { id: makeId('file_'), filename: req.file?.originalname ?? '', url: text || fileStoreApi.baseUrl, uploadedAt: nowIso() };
      await FilesStore.addFile(meta);
      return res.json({ ok: true, forwarded: true, meta });
    } catch (e) {
      // fall through to local fallback
      console.error('file-forward-error', e);
    }
  }

  // local fallback: req.file exists and has path
  if (!req.file) return res.status(400).json({ ok: false, error: 'no file uploaded' });
  const url = `/public/uploads/${path.basename(req.file.path)}`;
  const meta = { id: makeId('file_'), filename: req.file.originalname, url, uploadedAt: nowIso() };
  await FilesStore.addFile(meta);
  res.json({ ok: true, forwarded: false, meta });
});

router.get('/', async (req, res) => {
  const files = await FilesStore.listFiles();
  res.json({ ok: true, files });
});

export default router;

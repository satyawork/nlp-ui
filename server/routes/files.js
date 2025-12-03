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

// === HARDCODED SETTINGS ===
// Target API must match your curl exactly:
const TARGET_UPLOAD_URL = 'http://localhost:8080/upload-file';

// Multer config (temp store)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });


// POST /api/files/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'No file uploaded' });
  }

  console.log(`[FILES] Received: ${req.file.originalname}`);
  console.log(`[FILES] Forwarding to: ${TARGET_UPLOAD_URL}`);

  // Build multipart form like the curl call
  const form = new FormData();
  form.append('file', fs.createReadStream(req.file.path), {
    filename: req.file.originalname,
    contentType: req.file.mimetype,
  });

  try {
    const response = await fetch(TARGET_UPLOAD_URL, {
      method: 'POST',
      headers: form.getHeaders(), // MUST include boundary (auto-generated)
      body: form
    });

    console.log(`[FILES] Response: ${response.status} ${response.statusText}`);

    let body;
    const type = response.headers.get('content-type') || '';

    if (type.includes('application/json')) {
      body = await response.json();
    } else {
      body = await response.text();
    }

    return res.json({
      ok: response.ok,
      forwarded: true,
      remoteStatus: response.status,
      remoteBody: body,
      uploadedAt: nowIso(),
    });

  } catch (err) {
    console.error('[FILES] Upload error:', err);
    return res.status(500).json({
      ok: false,
      error: 'failed to forward file',
      detail: String(err)
    });
  }
});

export default router;

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
import fsPromises from 'fs/promises';
import { AbortController } from 'abort-controller';
import { fileTypeFromFile } from 'file-type';

const router = express.Router();
await ensureUploadDir();

// === HARDCODED SETTINGS ===
// The forward target may come from ApiSettingsStore.default.uploadUrl or per-api.uploadUrl
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const FORWARD_TIMEOUT_MS = 30_000; // 30 seconds

// Allowed MIME types and extensions (adjust as needed)
const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'text/plain',
  'text/markdown',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
]);
const ALLOWED_EXT = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.txt', '.md', '.doc', '.docx']);

// Multer config (temp store)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (req, file, cb) => {
    // Quick pre-check using provided mimetype and extension.
    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXT.has(ext)) return cb(null, true);
    // Reject early - multer will pass an error to the route
    return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Invalid file type'));
  }
});

// POST /api/files/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'No file uploaded' });
  }

  // Immediate log when file is received
  const logId = makeId ? makeId() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  console.log(`[UPLOAD ${logId}] Received file:`);
  console.log(`  Original Name : ${req.file.originalname}`);
  console.log(`  Stored As     : ${req.file.filename}`);
  console.log(`  MIME Type     : ${req.file.mimetype}`);
  console.log(`  Size (bytes)  : ${req.file.size}`);
  console.log(`  Temp Path     : ${req.file.path}`);

  const tempPath = req.file.path;

  try {
    // Defensive size check (in case limits were bypassed)
    if (req.file.size > MAX_BYTES) {
      await fsPromises.unlink(tempPath).catch(() => {});
      console.warn(`[UPLOAD ${logId}] Rejected: file too large (${req.file.size} bytes)`);
      return res.status(413).json({ ok: false, error: 'File too large' });
    }

    // Stronger validation: check magic bytes
    let ft;
    try {
      ft = await fileTypeFromFile(tempPath);
    } catch (e) {
      console.warn(`[UPLOAD ${logId}] file-type check failed: ${String(e)}`);
      ft = undefined;
    }

    if (ft) {
      console.log(`[UPLOAD ${logId}] Detected file type: ${ft.mime} (${ft.ext})`);
      if (!ALLOWED_MIME.has(ft.mime)) {
        await fsPromises.unlink(tempPath).catch(() => {});
        console.warn(`[UPLOAD ${logId}] Rejected: disallowed MIME ${ft.mime}`);
        return res.status(400).json({ ok: false, error: `Disallowed file type: ${ft.mime}` });
      }
    } else {
      // fallback to extension check for plain-text or undetected types
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (!ALLOWED_EXT.has(ext)) {
        await fsPromises.unlink(tempPath).catch(() => {});
        console.warn(`[UPLOAD ${logId}] Rejected: unknown file type and extension ${ext}`);
        return res.status(400).json({ ok: false, error: 'Unrecognized or disallowed file type' });
      }
      console.log(`[UPLOAD ${logId}] file-type couldn't detect; extension ${ext} allowed by fallback`);
    }

    // Build multipart form like the curl call
    const form = new FormData();
    form.append('file', fs.createReadStream(tempPath), {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FORWARD_TIMEOUT_MS);

    let response;
    const start = Date.now();
    try {
      // Resolve forwarding target from settings if available
      const settings = await ApiSettingsStore.getSettings();
      const def = settings.default || {};
      // If client provided apiId in query or body, prefer per-api upload endpoint
      const apiId = req.body.apiId || req.query.apiId || null;
      let headerObj = { ...form.getHeaders() };

      const buildFromDefault = (apiEntry) => {
        if (!apiEntry) return null;
        if (apiEntry.uploadUrl) return apiEntry.uploadUrl;
        if (apiEntry.endpoint) {
          const host = def.baseUrl || (def.host ? `${def.host}${def.port ? `:${def.port}` : ''}` : null);
          if (!host) return null;
          return host.replace(/\/$/, '') + '/' + apiEntry.endpoint.replace(/^\//, '');
        }
        return null;
      };

      let target = null;
      if (apiId) {
        const api = (settings.apis || []).find(a => a.id === apiId);
        if (api) {
          target = buildFromDefault(api) || null;
          const collect = (arr) => { (arr || []).forEach(h => { if (h && h.key) headerObj[h.key] = h.value; }); };
          collect(def.headers);
          collect(api.uploadHeaders || api.headers || api.headers);
        }
      } else {
        // no apiId provided: use default.uploadUrl if set
        if (def.uploadUrl) target = def.uploadUrl;
        (def.headers || []).forEach(h => { if (h && h.key) headerObj[h.key] = h.value; });
      }

      if (!target) {
        throw new Error('No upload target configured (provide apiId or set default.baseUrl + api.endpoint)');
      }

      response = await fetch(target, {
        method: 'POST',
        headers: headerObj,
        body: form,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const duration = Date.now() - start;
    console.log(`[UPLOAD ${logId}] Remote responded: ${response.status} ${response.statusText} in ${duration}ms`);

    // Log remote headers (for debugging, don't dump too much in prod)
    for (const [k, v] of response.headers) {
      console.log(`[UPLOAD ${logId}] Remote header: ${k}: ${v}`);
    }

    // Read remote body with type handling
    const type = response.headers.get('content-type') || '';
    let body;
    if (type.includes('application/json')) {
      body = await response.json();
      console.log(`[UPLOAD ${logId}] Remote JSON body: ${JSON.stringify(body).slice(0, 2000)}`);
    } else {
      const text = await response.text();
      console.log(`[UPLOAD ${logId}] Remote text body (first 2000 chars): ${text.slice(0, 2000)}`);
      body = text;
    }

    // cleanup temp file after forwarding
    await fsPromises.unlink(tempPath).catch(err => {
      console.warn(`[UPLOAD ${logId}] Failed to delete temp file: ${String(err)}`);
    });

    return res.json({
      ok: response.ok,
      forwarded: true,
      remoteStatus: response.status,
      remoteBody: body,
      uploadedAt: nowIso ? nowIso() : new Date().toISOString(),
    });

  } catch (err) {
    // cleanup on error
    await fsPromises.unlink(tempPath).catch(() => {});

    if (err.name === 'AbortError') {
      console.error(`[UPLOAD ${logId}] Forward timed out (AbortError)`);
      return res.status(504).json({ ok: false, error: 'Forwarding timed out' });
    }

    if (err instanceof multer.MulterError) {
      console.error(`[UPLOAD ${logId}] Multer error: ${err.message}`);
      return res.status(400).json({ ok: false, error: err.message });
    }

    console.error(`[UPLOAD ${logId}] Upload error:`, err);
    return res.status(500).json({
      ok: false,
      error: 'failed to forward file',
      detail: String(err)
    });
  }
});

export default router;

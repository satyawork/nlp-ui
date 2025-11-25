// server/routes/chat.js
import express from 'express';
import { ApiSettingsStore, SessionsStore } from '../stores/fileStore.js';
import * as llamaAdapter from '../adapters/llama3.js';
import * as genericAdapter from '../adapters/generic.js';
import { nowIso } from '../utils.js';

const router = express.Router();

// POST /api/chat
// { apiId, prompt, sessionId?, options? }
router.post('/', async (req, res) => {
  const { apiId, prompt, sessionId, options } = req.body;
  if (!apiId || !prompt) return res.status(400).json({ ok: false, error: 'apiId and prompt required' });

  const settings = await ApiSettingsStore.getSettings();
  const api = (settings.apis || []).find(a => a.id === apiId);
  if (!api) return res.status(400).json({ ok: false, error: 'apiId not found' });

  // pick adapter
  const adapterName = api.adapter || api.type || 'generic';
  let adapter;
  if (adapterName === 'llama3') adapter = llamaAdapter;
  else adapter = genericAdapter;

  // update session with user message first (optimistic)
  let session = null;
  if (sessionId) {
    session = await SessionsStore.getSession(sessionId);
    if (session) {
      session.messages.push({ id: 'm-' + Date.now(), role: 'user', text: prompt, ts: nowIso() });
      session.updatedAt = nowIso();
      await SessionsStore.saveSession(session);
    }
  }

  try {
    const { output, meta } = await adapter.callModel(api, prompt, options || {});
    // save assistant message to session
    if (session) {
      session.messages.push({ id: 'm-' + Date.now(), role: 'assistant', text: output, ts: nowIso() });
      session.updatedAt = nowIso();
      await SessionsStore.saveSession(session);
    }
    res.json({ ok: true, output, meta });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

export default router;

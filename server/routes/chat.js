// server/routes/chat.js
import express from 'express';
import { ApiSettingsStore, SessionsStore } from '../stores/fileStore.js';
import { callModelWithAdapter } from '../adapters/index.js';
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
  console.log('chat request for apiId=', apiId, 'prompt=', prompt.slice(0,30)+'...', 'sessionId=', sessionId);

  // optimistic: append user's message to session first
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
    // delegate to the adapter dispatcher which will call the correct adapter
    const result = await callModelWithAdapter(api, prompt, options || {});
    // result should be { output, meta } (adapters should follow this convention)
    const output = result?.output ?? String(result);
    const meta = result?.meta ?? null;

    // persist assistant response into session
    if (session) {
      session.messages.push({ id: 'm-' + Date.now(), role: 'assistant', text: output, ts: nowIso() });
      session.updatedAt = nowIso();
      await SessionsStore.saveSession(session);
    }

    return res.json({ ok: true, output, meta });
  } catch (e) {
    console.error('chat handler error:', e);
    return res.status(500).json({ ok: false, error: String(e) });
  }
});

export default router;

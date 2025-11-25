// server/routes/sessions.js
import express from 'express';
import { SessionsStore } from '../stores/fileStore.js';
import { makeId, nowIso } from '../utils.js';

const router = express.Router();

// list sessions
router.get('/', async (req, res) => {
  const sessions = await SessionsStore.listSessions();
  res.json({ ok: true, sessions });
});

// create session
router.post('/', async (req, res) => {
  const { name = 'New Chat', apiId = null } = req.body;
  const session = { id: makeId('s_'), name, apiId, messages: [], createdAt: nowIso(), updatedAt: nowIso() };
  await SessionsStore.saveSession(session);
  res.json({ ok: true, session });
});

// get session
router.get('/:id', async (req, res) => {
  const s = await SessionsStore.getSession(req.params.id);
  if (!s) return res.status(404).json({ ok: false, error: 'not found' });
  res.json({ ok: true, session: s });
});

// update session (rename or update apiId)
router.patch('/:id', async (req, res) => {
  const s = await SessionsStore.getSession(req.params.id);
  if (!s) return res.status(404).json({ ok: false, error: 'not found' });
  const { name, apiId } = req.body;
  if (name) s.name = name;
  if (apiId) s.apiId = apiId;
  s.updatedAt = nowIso();
  await SessionsStore.saveSession(s);
  res.json({ ok: true, session: s });
});

// delete session
router.delete('/:id', async (req, res) => {
  await SessionsStore.deleteSession(req.params.id);
  res.json({ ok: true });
});

export default router;

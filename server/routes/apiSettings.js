// server/routes/apiSettings.js
import express from 'express';
import { ApiSettingsStore } from '../stores/fileStore.js';

const router = express.Router();

// GET settings (mask secrets)
router.get('/', async (req, res) => {
  const settings = await ApiSettingsStore.getSettings();
  const masked = JSON.parse(JSON.stringify(settings));
  (masked.apis || []).forEach(a => {
    if (a.authValue) a.authValue = a.storeSecret ? '••••••' : 'stored';
  });
  res.json({ ok: true, settings: masked });
});

router.post('/', async (req, res) => {
  const { settings } = req.body;
  if (!settings) return res.status(400).json({ ok: false, error: 'missing settings' });
  // Minimal validation could be added here
  await ApiSettingsStore.saveSettings(settings);
  res.json({ ok: true });
});

router.post('/test', async (req, res) => {
  // server-side test of the provided config (no secrets returned)
  const { config } = req.body;
  if (!config || !config.baseUrl) return res.status(400).json({ ok: false, error: 'missing config or baseUrl' });
  try {
    // Hitting the provided config.baseUrl to test connectivity
    const testRes = await fetch(config.baseUrl, { method: config.method || 'GET' });
    res.json({ ok: true, status: testRes.status });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

export default router;
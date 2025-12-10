// server/routes/apiSettings.js
import express from 'express';
import { ApiSettingsStore } from '../stores/fileStore.js';

const router = express.Router();

// GET settings (mask secrets)
router.get('/', async (req, res) => {
  const settings = await ApiSettingsStore.getSettings();
  const masked = JSON.parse(JSON.stringify(settings));
  // Mask secrets in top-level default and per-API entries
  if (masked.default && masked.default.authValue) masked.default.authValue = masked.default.storeSecret ? '••••••' : 'stored';
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
  // server-side test: accept either { config } with baseUrl or { apiId }
  const { config, apiId } = req.body;
  try {
    let target;
    let opts = { method: 'GET' };

    if (apiId) {
      const settings = await ApiSettingsStore.getSettings();
      const def = settings.default || {};
      const api = (settings.apis || []).find(a => a.id === apiId);
      if (!api) return res.status(400).json({ ok: false, error: 'apiId not found' });
      target = api.baseUrl || (api.endpoint ? (def.baseUrl || (def.host ? `${def.host}${def.port ? `:${def.port}` : ''}` : null)) : null);
      if (api.endpoint && def.baseUrl) target = def.baseUrl.replace(/\/$/, '') + '/' + api.endpoint.replace(/^\//, '');
      if (!target) return res.status(400).json({ ok: false, error: 'no baseUrl configured for this apiId' });
      if (config && config.method) opts.method = config.method;
    } else if (config && config.baseUrl) {
      target = config.baseUrl;
      if (config.method) opts.method = config.method;
    } else {
      return res.status(400).json({ ok: false, error: 'missing config.baseUrl or apiId' });
    }

    // perform a simple fetch to test connectivity
    const testRes = await fetch(target, opts);
    res.json({ ok: true, status: testRes.status });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

export default router;
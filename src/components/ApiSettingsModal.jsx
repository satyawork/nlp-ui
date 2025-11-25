import React, { useState, useEffect } from 'react';
import ThemeToggle from '../contexts/ThemeToggle';
import { useApiSettings } from '../contexts/ApiSettingsContext';

// ApiSettingsModal: improved layout, close button, remove API, better button arrangement
export default function ApiSettingsModal() {
  const { settings, saveSettings, testApi } = useApiSettings();
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState(settings);

  React.useEffect(() => setLocal(settings), [settings]);
  // --- ESC key close handler ---
  useEffect(() => {
    if (!open) return;

    function handleEsc(e) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open]);
  function addApi() {
    const copy = JSON.parse(JSON.stringify(local || { apis: [] }));
    copy.apis = copy.apis || [];
    copy.apis.push({
      id: Date.now().toString(),
      name: 'new-api',
      baseUrl: '',
      method: 'POST',
      adapter: 'generic',
      headers: [],
      authType: 'none',
      authValue: '',
      storeSecret: false
    });
    setLocal(copy);
  }

  function removeApiAt(index) {
    const copy = JSON.parse(JSON.stringify(local || { apis: [] }));
    copy.apis.splice(index, 1);
    setLocal(copy);
  }

  async function handleSave() {
    try {
      await saveSettings(local);
      setOpen(false);
    } catch (err) {
      alert('Save failed: ' + String(err));
    }
  }

  if (!open) {
    return (
      <div className="settings-button" style={{ position: 'fixed', right: 20, bottom: 20 }}>
        <button onClick={() => setOpen(true)}>⚙️</button>
      </div>
    );
  }

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="modal" style={{
        width: 820, maxWidth: '96%', background: 'var(--modal-bg)', padding: 16,
        borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.6)', border: '1px solid var(--border)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h3 style={{ margin: 0 }}>API Settings</h3>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Configure model & file endpoints</div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <ThemeToggle />
            <button
              onClick={() => setOpen(false)}
              aria-label="Close settings"
              title="Close"
              style={{
                background: 'transparent', border: '1px solid var(--border)', padding: '6px 8px',
                borderRadius: 6, cursor: 'pointer', color: 'var(--text)'
              }}
            >
              ✖
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '60vh', overflow: 'auto' }}>
          {(local?.apis || []).map((a, i) => (
            <div key={a.id} className="api-item" style={{
              padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', gap: 8
            }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Name</label>
                  <input
                    value={a.name}
                    onChange={e => { const c = JSON.parse(JSON.stringify(local)); c.apis[i].name = e.target.value; setLocal(c); }}
                    style={{ width: '100%', padding: 8, borderRadius: 6 }}
                    placeholder="friendly name"
                  />
                </div>

                <div style={{ width: 140 }}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Adapter</label>
                  <select
                    value={a.adapter}
                    onChange={e => { const c = JSON.parse(JSON.stringify(local)); c.apis[i].adapter = e.target.value; setLocal(c); }}
                    style={{ width: '100%', padding: 8, borderRadius: 6 }}
                  >
                    <option value="generic">generic</option>
                    <option value="llama3">llama3</option>
                    <option value="filestore">filestore</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Base URL</label>
                  <input
                    value={a.baseUrl}
                    placeholder="https://example.com/api"
                    onChange={e => { const c = JSON.parse(JSON.stringify(local)); c.apis[i].baseUrl = e.target.value; setLocal(c); }}
                    style={{ width: '100%', padding: 8, borderRadius: 6 }}
                  />
                </div>

                <div style={{ width: 120, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)' }}>Method</label>
                  <select
                    value={a.method || 'POST'}
                    onChange={e => { const c = JSON.parse(JSON.stringify(local)); c.apis[i].method = e.target.value; setLocal(c); }}
                    style={{ padding: 8, borderRadius: 6 }}
                  >
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>DELETE</option>
                    <option>PATCH</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)' }}>&nbsp;</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={async (e) => { e.stopPropagation(); try { const res = await testApi(a); alert('Test result: ' + JSON.stringify(res)); } catch (err) { alert(String(err)); } }}
                      style={{ padding: '8px 10px', borderRadius: 6 }}
                    >
                      Test
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeApiAt(i); }}
                      style={{ padding: '8px 10px', borderRadius: 6, background: 'transparent', border: '1px solid rgba(255,0,0,0.18)', color: '#ff7777' }}
                      title="Remove API"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              {/* small hint row */}
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                Adapter: <strong>{a.adapter}</strong> — stored secret flags are not shown here (secrets masked).
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 6 }}>
            <button onClick={addApi} style={{ padding: '8px 12px', borderRadius: 6 }}>+ Add API</button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>
            Tip: add a file-store API (adapter=filestore) to forward uploads.
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setOpen(false)} style={{ padding: '8px 12px', borderRadius: 6 }}>Cancel</button>
            <button onClick={handleSave} style={{
              padding: '8px 14px',
              borderRadius: 6,
              background: 'var(--accent)',
              color: 'white',
              border: 'none'
            }}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

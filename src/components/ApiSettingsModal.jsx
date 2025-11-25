import React, { useState } from 'react';
import ThemeToggle from '../contexts/ThemeToggle';
import { useApiSettings } from '../contexts/ApiSettingsContext';
// inside modal header section, after <h3>API Settings</h3>
// ...

// This modal opens when user clicks a gear icon. For simplicity, we render it always but hidden.
// You can wire up a global button to toggle `open` state.
export default function ApiSettingsModal() {
  const { settings, saveSettings, testApi } = useApiSettings();
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState(settings);

  React.useEffect(() => setLocal(settings), [settings]);

  function addApi() {
    const copy = JSON.parse(JSON.stringify(local || { apis: [] }));
    copy.apis = copy.apis || [];
    copy.apis.push({ id: Date.now().toString(), name: 'new-api', baseUrl: '', method: 'POST', adapter: 'generic', headers: [], authType: 'none', authValue: '', storeSecret: false });
    setLocal(copy);
  }

  async function handleSave() {
    await saveSettings(local);
    setOpen(false);
  }

  if (!open) {
    return <div className="settings-button"><button onClick={() => setOpen(true)}>⚙️ Settings</button></div>;
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>API Settings</h3>
        <div className="modal-body">
          {(local?.apis || []).map((a, i) => (
            <div key={a.id} className="api-item">
              <input value={a.name} onChange={e => { const c = JSON.parse(JSON.stringify(local)); c.apis[i].name = e.target.value; setLocal(c); }} />
              <input value={a.baseUrl} placeholder="Base URL" onChange={e => { const c = JSON.parse(JSON.stringify(local)); c.apis[i].baseUrl = e.target.value; setLocal(c); }} />
              <select value={a.adapter} onChange={e => { const c = JSON.parse(JSON.stringify(local)); c.apis[i].adapter = e.target.value; setLocal(c); }}>
                <option value="generic">generic</option>
                <option value="llama3">llama3</option>
                <option value="filestore">filestore</option>
              </select>
              <button onClick={() => testApi(a).then(j => alert(JSON.stringify(j))).catch(e => alert(String(e)))}>Test</button>
            </div>
          ))}
          <button onClick={addApi}>Add API</button>
        </div>
        <div className="modal-actions">
          <button onClick={() => setOpen(false)}>Cancel</button>
          <button onClick={handleSave}>Save</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>API Settings</h3>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

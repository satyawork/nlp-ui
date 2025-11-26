import React, { useState, useEffect } from 'react';
import ThemeToggle from '../contexts/ThemeToggle';
import { useApiSettings } from '../contexts/ApiSettingsContext';

export default function ApiSettingsModal({ onClose }) {
  const { settings, saveSettings, testApi } = useApiSettings();
  const [local, setLocal] = useState(settings);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    baseUrl: '',
    model: '',
    headers: []
  });

  React.useEffect(() => setLocal(settings), [settings]);

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  function addApi() {
    setFormData({
      id: 'api-' + Date.now(),
      name: '',
      baseUrl: '',
      model: '',
      headers: []
    });
    setEditingId('new');
  }

  function removeApiAt(index) {
    const copy = JSON.parse(JSON.stringify(local || { apis: [] }));
    copy.apis.splice(index, 1);
    setLocal(copy);
  }

  function handleSaveApi() {
    if (!formData.name.trim() || !formData.baseUrl.trim()) {
      alert('Name and Base URL are required');
      return;
    }

    const updated = editingId === 'new'
      ? [...local.apis, formData]
      : local.apis.map(a => a.id === formData.id ? formData : a);

    setLocal({ ...local, apis: updated });
    saveSettings({ ...settings, apis: updated });
    setEditingId(null);
    setFormData({ id: '', name: '', baseUrl: '', model: '', headers: [] });
  }

  function handleDeleteApi(id) {
    if (window.confirm('Delete this API?')) {
      const updated = local.apis.filter(a => a.id !== id);
      setLocal({ ...local, apis: updated });
      saveSettings({ ...settings, apis: updated });
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <h3>API Settings</h3>
            <div className="modal-subtitle">Configure model & file endpoints</div>
          </div>

          <div className="modal-controls">
            <ThemeToggle />
            <button onClick={onClose} aria-label="Close settings" title="Close">✖</button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">
          {(local?.apis || []).map((a, i) => (
            <div key={a.id} className="api-item">
              <div className="api-field">
                <label>Name</label>
                <input
                  value={a.name}
                  onChange={e => { const c = JSON.parse(JSON.stringify(local)); c.apis[i].name = e.target.value; setLocal(c); }}
                  placeholder="friendly name"
                />
              </div>

              <div className="api-field">
                <label>Adapter</label>
                <select
                  value={a.adapter}
                  onChange={e => { const c = JSON.parse(JSON.stringify(local)); c.apis[i].adapter = e.target.value; setLocal(c); }}
                >
                  <option value="generic">generic</option>
                  <option value="llama3">llama3</option>
                  <option value="completions">completions</option>
                  <option value="filestore">filestore</option>
                </select>
              </div>

              <div className="api-field">
                <label>Base URL</label>
                <input
                  value={a.baseUrl}
                  placeholder="https://example.com/api"
                  onChange={e => { const c = JSON.parse(JSON.stringify(local)); c.apis[i].baseUrl = e.target.value; setLocal(c); }}
                />
              </div>

              <div className="api-field">
                <label>Method</label>
                <select
                  value={a.method || 'POST'}
                  onChange={e => { const c = JSON.parse(JSON.stringify(local)); c.apis[i].method = e.target.value; setLocal(c); }}
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>DELETE</option>
                  <option>PATCH</option>
                </select>
              </div>

              <div className="api-actions">
                <button onClick={async (e) => { e.stopPropagation(); try { const res = await testApi(a); alert('Test result: ' + JSON.stringify(res)); } catch (err) { alert(String(err)); } }}>Test</button>
                <button onClick={(e) => { e.stopPropagation(); removeApiAt(i); }} className="delete-btn">Remove</button>
              </div>

              <div className="api-hint">Adapter: <strong>{a.adapter}</strong> — secrets are not shown here.</div>
            </div>
          ))}

          {editingId && (
            <div className="api-form">
              <h3>{editingId === 'new' ? 'Add New API' : 'Edit API'}</h3>

              <div className="api-field">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., OpenAI"
                />
              </div>

              <div className="api-field">
                <label>Base URL</label>
                <input
                  type="text"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  placeholder="e.g., http://127.0.0.1:8000"
                />
              </div>

              <div className="form-actions">
                <button onClick={handleSaveApi} className="save-btn">Save</button>
                <button onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            </div>
          )}

          {!editingId && (
            <button onClick={addApi} className="add-btn">+ Add API</button>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="modal-tip">Tip: add a file-store API (adapter=filestore) to forward uploads.</div>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

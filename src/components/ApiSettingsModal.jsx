import React, { useEffect, useState } from 'react';
import ThemeToggle from '../contexts/ThemeToggle';
import { useApiSettings } from '../contexts/ApiSettingsContext';
import ApiEndpointRow from './ApiEndpointRow';

export default function ApiSettingsModal({ onClose }) {
  const { settings, saveSettings, loading } = useApiSettings();
  const [local, setLocal] = useState(null);

  useEffect(() => {
    // Use settings exactly as provided by the backend. Do not inject frontend defaults.
    // If backend returns null/undefined, we keep local null so UI can show nothing or a message.
    if (settings) {
      // shallow copy to allow local edits safely
      setLocal(JSON.parse(JSON.stringify(settings)));
    } else {
      setLocal(null);
    }
  }, [settings]);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (loading) return null;
  if (!local) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">
              <h3>Integration Configuration</h3>
              <div className="modal-subtitle">No configuration received from backend.</div>
            </div>
            <div className="modal-controls">
              <ThemeToggle />
              <button onClick={onClose} aria-label="Close settings" title="Close (Esc)" className="close-icon-btn">✕</button>
            </div>
          </div>
          <div className="modal-body">
            <div style={{ padding: 12, color: 'var(--muted)' }}>No settings available. Please check backend configuration.</div>
          </div>
        </div>
      </div>
    );
  }

  function setEnable(tool, value) {
    const copy = { ...local };
    copy[tool] = { ...copy[tool], enable: value ? 'true' : 'false' };
    setLocal(copy);
  }

  function makeEditable(tool, key) {
    setLocal({ ...local, _editing: { tool, key } });
  }

  function stopEditing() {
    const copy = { ...local };
    delete copy._editing;
    setLocal(copy);
  }

  function updateField(tool, key, value) {
    const copy = { ...local };
    copy[tool] = { ...copy[tool], [key]: value };
    setLocal(copy);
  }

  async function handleSave() {
    try {
      await saveSettings(local);
      alert('Settings saved');
      onClose();
    } catch (e) {
      alert('Save failed: ' + String(e));
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <h3>Integration Configuration</h3>
          </div>
          <div className="modal-controls">
            <ThemeToggle />
            <button onClick={onClose} aria-label="Close settings" title="Close (Esc)" className="close-icon-btn">✕</button>
          </div>
        </div>

        <div className="modal-body">
          <div className="api-form">
            {/* Map endpoints into ApiEndpointRow components */}
            <div className="api-grid">
              {Object.entries(local).map(([toolKey, toolObj]) => {
                if (!toolObj || typeof toolObj !== 'object') return null;
                const withEnable = Object.prototype.hasOwnProperty.call(toolObj, 'enable');
                const displayName = toolObj.displayName || toolObj.name || toolKey;
                // support optional labels mapping for endpoint keys: toolObj.labels || toolObj._labels
                const labels = toolObj.labels || toolObj._labels || {};
                return Object.keys(toolObj).filter(k => !['enable','displayName','name','labels','_labels'].includes(k)).map((keyName, idx) => (
                  <ApiEndpointRow
                    key={`${toolKey}-${keyName}`}
                    toolKey={toolKey}
                    displayName={displayName}
                    keyName={keyName}
                    actionLabel={labels[keyName] || keyName}
                    value={toolObj[keyName]}
                    index={idx}
                    withEnable={withEnable}
                    toolObj={toolObj}
                    editing={local._editing}
                    onToggle={setEnable}
                    onMakeEditable={makeEditable}
                    onStopEditing={stopEditing}
                    onUpdate={updateField}
                  />
                ));
              })}
            </div>
            

            <div className="form-actions" style={{ marginTop: 12 }}>
              <button className="save-btn" onClick={handleSave}>💾 Save</button>
              <button className="cancel-btn" onClick={onClose}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

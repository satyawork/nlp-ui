import React, { useState, useEffect } from 'react';
import ThemeToggle from '../contexts/ThemeToggle';
import { useApiSettings } from '../contexts/ApiSettingsContext';
import { useChatSessions } from '../contexts/ChatSessionsContext';
import ApiSettingsDefault from './ApiSettingsDefault';
import ApiSettingsList from './ApiSettingsList';
import ApiSettingsForm from './ApiSettingsForm';

/**
 * API Settings Modal
 * 
 * Allows users to:
 * - Add/Edit/Delete API configurations
 * - Configure API endpoint (baseUrl)
 * - Add custom headers (Authorization, etc.)
 * - Select active API (radio button)
 * 
 * Simplified design: Only requires name and baseUrl
 * All APIs are POST requests by default
 * 
 * 
 */
export default function ApiSettingsModal({ onClose }) {
  const { settings, saveSettings } = useApiSettings();
  const { current, setCurrent } = useChatSessions();
  const [local, setLocal] = useState(settings);
  // local.default for global/default API settings
  if (!local.default) local.default = { name: 'Default API', baseUrl: '', port: '', headers: [] };
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    baseUrl: '',
    headers: []
  });

  // Sync local state with global settings
  React.useEffect(() => setLocal(settings), [settings]);

  // Close modal on Escape key
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);



  /**
   * Initialize new API form
   */
  function addApi() {
    setFormData({
      id: 'api-' + Date.now(),
      name: '',
      baseUrl: '',
      headers: []
    });
    setEditingId('new');
  }

  const { testApi } = useApiSettings();

  function handleSaveDefault() {
    // validation: require either baseUrl or host+port; validate port
    const d = local.default || {};
    if (d.baseUrl && d.baseUrl.trim()) {
      try { new URL(d.baseUrl); } catch (e) { alert('Invalid default Base URL'); return; }
    } else if (!(d.host && d.host.trim()) && !(d.baseUrl && d.baseUrl.trim())) {
      // if no baseUrl provided, allow host+port pattern via baseUrl field split (we use baseUrl as host here)
      // require at least baseUrl or port to be present
      if (!d.port || !String(d.port).trim()) { alert('Provide default base URL or port'); return; }
    }
    if (d.port && d.port.trim()) {
      const p = Number(d.port);
      if (!Number.isInteger(p) || p <= 0 || p > 65535) { alert('Invalid port number'); return; }
    }
    const newSettings = { ...local };
    setLocal(newSettings);
    saveSettings(newSettings);
    alert('Default API saved');
  }

  async function handleTestDefault() {
    try {
      const res = await testApi({ config: local.default });
      alert('Test result: ' + JSON.stringify(res));
    } catch (e) {
      alert('Test failed: ' + String(e));
    }
  }

  /**
   * Save or update API configuration
   */
  function handleSaveApi() {
    // Validate required fields
  if (!formData.name.trim()) { alert('Name is required'); return; }
  if (!formData.baseUrl.trim() && !(formData.endpoint && formData.endpoint.trim())) { alert('Either Base URL or Endpoint path is required'); return; }

    // Ensure baseUrl is a valid URL
    if (formData.baseUrl && formData.baseUrl.trim()) {
      try { new URL(formData.baseUrl); } catch (e) { alert('Invalid URL format'); return; }
    }

    // Add new or update existing API
    const updated = editingId === 'new'
      ? [...(local.apis || []), formData]
      : (local.apis || []).map(a => a.id === formData.id ? formData : a);

    // Persist changes
    const newSettings = { ...local, apis: updated };
    setLocal(newSettings);
    saveSettings(newSettings);
    
    // Reset form
    setEditingId(null);
    setFormData({ id: '', name: '', baseUrl: '', headers: [] });
  }

  /**
   * Delete API by ID
   */
  function handleDeleteApi(id) {
    if (window.confirm('Delete this API configuration? This cannot be undone.')) {
      const updated = (local.apis || []).filter(a => a.id !== id);
      const newSettings = { ...local, apis: updated };
      setLocal(newSettings);
      saveSettings(newSettings);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* ========== HEADER ========== */}
        <div className="modal-header">
          <div className="modal-title">
            <h3>🔌 API Configuration</h3>
          </div>
          <div className="modal-controls">
            <ThemeToggle />
            <button 
              onClick={onClose} 
              aria-label="Close settings" 
              title="Close (Esc)"
              className="close-icon-btn"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="modal-body">
          <ApiSettingsDefault local={local} setLocal={setLocal} handleSaveDefault={handleSaveDefault} handleTestDefault={handleTestDefault} />
          { (local?.apis || []).length > 0 && <ApiSettingsList local={local} setFormData={setFormData} setEditingId={setEditingId} handleDeleteApi={handleDeleteApi} testApi={testApi} /> }
          { editingId && <ApiSettingsForm formData={formData} setFormData={setFormData} handleSaveApi={handleSaveApi} testApi={testApi} onCancel={() => setEditingId(null)} /> }

          {!editingId && (
            <button onClick={addApi} className="add-api-btn" title="Add new API configuration">➕ Add New API</button>
          )}
        </div>

        <div className="modal-footer">
          <div className="modal-info">
            <strong>Note:</strong> All APIs use POST requests. Headers are stored securely and not displayed after saving.
          </div>
          <button onClick={onClose} className="close-btn">Close</button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import ThemeToggle from '../contexts/ThemeToggle';
import { useApiSettings } from '../contexts/ApiSettingsContext';
import { useChatSessions } from '../contexts/ChatSessionsContext';

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
 */
export default function ApiSettingsModal({ onClose }) {
  const { settings, saveSettings } = useApiSettings();
  const { current, setCurrent } = useChatSessions();
  const [local, setLocal] = useState(settings);
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
   * Select an API as active
   */
  function handleSelectApi(apiId) {
    if (current) {
      setCurrent({ ...current, apiId });
    }
  }

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

  /**
   * Save or update API configuration
   */
  function handleSaveApi() {
    // Validate required fields
    if (!formData.name.trim() || !formData.baseUrl.trim()) {
      alert('Name and Base URL are required');
      return;
    }

    // Ensure baseUrl is a valid URL
    try {
      new URL(formData.baseUrl);
    } catch (e) {
      alert('Invalid URL format');
      return;
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
            <div className="modal-subtitle">Add and manage API endpoints</div>
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

        {/* ========== BODY ========== */}
        <div className="modal-body">
          {/* List of existing APIs */}
          {(local?.apis || []).length > 0 && (
            <div className="api-list">
              <div className="api-list-title">Available APIs</div>
              {(local.apis || []).map((api) => (
                <div key={api.id} className="api-item">
                  {/* Radio Button + API Info */}
                  <div className="api-selector-wrapper">
                    <input
                      type="radio"
                      id={`api-radio-${api.id}`}
                      name="selected-api"
                      checked={current?.apiId === api.id}
                      onChange={() => handleSelectApi(api.id)}
                      className="api-radio"
                    />
                    <label htmlFor={`api-radio-${api.id}`} className="api-radio-label">
                      <div className="api-summary">
                        <div className="api-name-display">{api.name}</div>
                        <div className="api-url-display">{api.baseUrl}</div>
                        {api.headers && api.headers.length > 0 && (
                          <div className="api-headers-count">
                            {api.headers.length} header{api.headers.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* API Actions */}
                  <div className="api-item-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => {
                        setFormData(api);
                        setEditingId(api.id);
                      }}
                      title="Edit API"
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteApi(api.id)}
                      title="Delete API"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add/Edit Form */}
          {editingId && (
            <div className="api-form">
              <h3>{editingId === 'new' ? '➕ Add New API' : '✏️ Edit API'}</h3>

              {/* Name Field */}
              <div className="form-group">
                <label>API Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., My LLaMA Model, OpenAI API"
                  className="form-input"
                />
                <small>Friendly name to identify this API</small>
              </div>

              {/* Base URL Field */}
              <div className="form-group">
                <label>API Endpoint (Base URL) *</label>
                <input
                  type="text"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  placeholder="e.g., http://127.0.0.1:8000/v1/completions"
                  className="form-input"
                />
                <small>Full URL where requests will be POSTed to</small>
              </div>

              {/* Headers */}
              <div className="form-group">
                <label>Custom Headers (Optional)</label>
                <small>Add headers like Authorization, X-API-Key, etc.</small>
                <div className="headers-list">
                  {(formData.headers || []).map((header, hIndex) => (
                    <div key={hIndex} className="header-row">
                      <input
                        type="text"
                        placeholder="Header name"
                        value={header.key}
                        onChange={(e) => {
                          const newHeaders = [...formData.headers];
                          newHeaders[hIndex].key = e.target.value;
                          setFormData({ ...formData, headers: newHeaders });
                        }}
                        className="header-key"
                      />
                      <input
                        type="text"
                        placeholder="Header value (hidden)"
                        value={header.value}
                        onChange={(e) => {
                          const newHeaders = [...formData.headers];
                          newHeaders[hIndex].value = e.target.value;
                          setFormData({ ...formData, headers: newHeaders });
                        }}
                        className="header-value"
                      />
                      <button
                        className="remove-header-btn"
                        onClick={() => {
                          const newHeaders = (formData.headers || []).filter((_, idx) => idx !== hIndex);
                          setFormData({ ...formData, headers: newHeaders });
                        }}
                        title="Remove header"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className="add-header-btn"
                  onClick={() => setFormData({ ...formData, headers: [...(formData.headers || []), { key: '', value: '' }] })}
                >
                  + Add Header
                </button>
              </div>

              {/* Form Actions */}
              <div className="form-actions">
                <button 
                  onClick={handleSaveApi} 
                  className="save-btn"
                  title="Save API configuration"
                >
                  💾 Save
                </button>
                <button 
                  onClick={() => setEditingId(null)}
                  className="cancel-btn"
                  title="Cancel editing"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Add Button */}
          {!editingId && (
            <button 
              onClick={addApi} 
              className="add-api-btn"
              title="Add new API configuration"
            >
              ➕ Add New API
            </button>
          )}
        </div>

        {/* ========== FOOTER ========== */}
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

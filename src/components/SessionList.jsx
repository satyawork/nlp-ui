import React, { useEffect, useState } from 'react';
import { useChatSessions } from '../contexts/ChatSessionsContext';
import ApiSettingsModal from './ApiSettingsModal';

export default function SessionList() {
  const { sessions, createSession, current, setCurrent, loading, renameSession, deleteSession } = useChatSessions();
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [removingId, setRemovingId] = useState(null);
  const [showApiSettings, setShowApiSettings] = useState(false);

  useEffect(() => {
    if (!loading && sessions.length && !current) setCurrent(sessions[0]);
  }, [loading, sessions]);

  function startEdit(s) {
    setEditingId(s.id);
    setEditName(s.name);
  }

  async function saveEdit(id) {
    try {
      const updated = await renameSession(id, editName.trim() || 'Untitled');
      setEditingId(null);
      setEditName('');
      setCurrent(updated);
    } catch (e) {
      alert('Rename failed: ' + String(e));
    }
  }

  async function handleDelete(s) {
    const confirmOk = window.confirm(`Delete chat "${s.name}"? This cannot be undone.`);
    if (!confirmOk) return;
    setRemovingId(s.id);
    setTimeout(async () => {
      try {
        await deleteSession(s.id);
      } catch (e) {
        alert('Delete failed: ' + String(e));
      } finally {
        setRemovingId(null);
      }
    }, 220);
  }

  return (
    <div className="session-list-wrapper">
      <div>
        <div className="session-list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <strong>Chats</strong>
          <button onClick={() => createSession()}>+ New</button>
        </div>

        <ul className="session-list">
          {sessions.map(s => {
            const isActive = current?.id === s.id;
            const isEditing = editingId === s.id;
            const isRemoving = removingId === s.id;
            return (
              <li
                key={s.id}
                className={`${isActive ? 'active' : ''} ${isRemoving ? 'removing' : ''}`}
                onClick={() => !isEditing && setCurrent(s)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    {isEditing ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(s.id); if (e.key === 'Escape') { setEditingId(null); setEditName(''); } }}
                        autoFocus
                      />
                    ) : (
                      <div className="session-name" style={{ fontWeight: isActive ? 600 : 500 }}>{s.name}</div>
                    )}
                    <div className="session-meta" style={{ fontSize: 12, color: 'var(--muted)' }}>{ new Date(s.updatedAt || s.createdAt).toLocaleString() }</div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                    {isEditing ? (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); saveEdit(s.id); }}>Save</button>
                        <button onClick={(e) => { e.stopPropagation(); setEditingId(null); setEditName(''); }}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); startEdit(s); }} title="Rename">✏️</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(s); }} title="Delete">🗑️</button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Settings button at bottom */}
      <button 
        className="settings-btn" 
        onClick={() => setShowApiSettings(true)}
        title="API Settings"
      >
        ⚙️ Settings
      </button>

      {/* API Settings Modal */}
      {showApiSettings && (
        <ApiSettingsModal onClose={() => setShowApiSettings(false)} />
      )}
    </div>
  );
}

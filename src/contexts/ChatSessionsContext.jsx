import React, { createContext, useContext, useEffect, useState } from 'react';

const ChatSessionsContext = createContext(null);

export function ChatSessionsProvider({ children }) {
  const [sessions, setSessions] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadSessions() {
    try {
      const res = await fetch('/api/sessions');
      const j = await res.json();
      if (j.ok) setSessions(j.sessions || []);
    } finally { setLoading(false); }
  }

  useEffect(() => { loadSessions(); }, []);

  async function createSession(name='New chat', apiId=null) {
    const res = await fetch('/api/sessions', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, apiId }) });
    const j = await res.json();
    if (j.ok) {
      setSessions(s => [j.session, ...s]);
      setCurrent(j.session);
      return j.session;
    }
    throw new Error(j.error || 'create failed');
  }

  async function setSession(s) {
    setCurrent(s);
  }

  async function renameSession(id, name) {
    const res = await fetch(`/api/sessions/${id}`, { method: 'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name }) });
    const j = await res.json();
    if (j.ok) {
      setSessions(prev => prev.map(p => p.id === id ? { ...p, name: j.session.name, updatedAt: j.session.updatedAt } : p));
      if (current?.id === id) setCurrent(prev => ({ ...prev, name: j.session.name }));
      return j.session;
    }
    throw new Error(j.error || 'rename failed');
  }

  async function deleteSession(id) {
    const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
    const j = await res.json();
    if (j.ok) {
      setSessions(prev => prev.filter(s => s.id !== id));
      if (current?.id === id) setCurrent(null);
      return true;
    }
    throw new Error(j.error || 'delete failed');
  }

  return (
    <ChatSessionsContext.Provider value={{
      sessions,
      current,
      setCurrent: setSession,
      createSession,
      renameSession,
      deleteSession,
      loading,
      setSessions
    }}>
      {children}
    </ChatSessionsContext.Provider>
  );
}

export function useChatSessions() {
  const ctx = useContext(ChatSessionsContext);
  if (!ctx) throw new Error('useChatSessions must be used inside provider');
  return ctx;
}

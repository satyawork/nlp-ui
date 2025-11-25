import React, { useEffect, useState } from 'react';
import { useChatSessions } from '../contexts/ChatSessionsContext';
import { useApiSettings } from '../contexts/ApiSettingsContext';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

export default function ChatWindow() {
  const { current, setCurrent } = useChatSessions();
  const { settings } = useApiSettings();
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (!current) { setSessionData(null); return; }
      setLoading(true);
      const res = await fetch(`/api/sessions/${current.id}`);
      const j = await res.json();
      if (j.ok) setSessionData(j.session);
      setLoading(false);
    }
    load();
  }, [current]);

  async function sendMessage(text, files=[]) {
    if (!current) return;
    const apiId = current.apiId || (settings.apis[0] && settings.apis[0].id);
    const payload = { apiId, prompt: text, sessionId: current.id, options: { files } };
    const resp = await fetch('/api/chat', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const j = await resp.json();
    if (j.ok) {
      // reload session
      const r2 = await fetch(`/api/sessions/${current.id}`);
      const j2 = await r2.json();
      if (j2.ok) setSessionData(j2.session);
    } else {
      // show error as assistant message
      setSessionData(prev => ({ ...prev, messages: [...(prev?.messages||[]), { id: 'err-'+Date.now(), role: 'assistant', text: 'Error: '+j.error, ts: new Date().toISOString() }] }));
    }
  }

  if (!current) return <div className="no-session">Create or select a session</div>;

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>{current.name}</h3>
        <div className="chat-controls">API: <ApiSelector current={current} /></div>
      </div>
      <MessageList messages={sessionData?.messages || []} />
      <ChatInput onSend={sendMessage} />
    </div>
  );
}

function ApiSelector({ current }) {
  const { settings, saveSettings } = useApiSettings();
  const { renameSession } = useChatSessions(); // for later
  // For now show simple text of api name
  const api = (settings.apis || []).find(a => a.id === current.apiId);
  return <span>{api ? api.name : 'No API selected'}</span>;
}

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
  const [loadingMessageId, setLoadingMessageId] = useState(null); // New state for loading message

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

  async function sendMessage(text, files = []) {
    if (!current) return;

    // Create user message object and add to UI immediately
    const userMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      text: text,
      ts: new Date().toISOString()
    };

    // Update UI with user message immediately
    setSessionData(prev => ({
      ...prev,
      messages: [...(prev?.messages || []), userMessage]
    }));

    // Show loading message (rendered as animated 3-dot loader in MessageList)
    const loadingMessage = {
      id: 'loading-' + Date.now(),
      role: 'assistant',
      loading: true,                 // flag for MessageList to render loader
      text: '',                      // keep text empty for loader
      ts: new Date().toISOString()
    };
    setLoadingMessageId(loadingMessage.id);
    setSessionData(prev => ({
      ...prev,
      messages: [...(prev?.messages || []), loadingMessage]
    }));

    // Send to server with increased max_tokens
    const apiId = current.apiId || (settings.apis[0] && settings.apis[0].id);
    const payload = { 
      apiId, 
      prompt: text, 
      sessionId: current.id, 
      options: { 
        files,
        max_tokens: 1800,  // Increased from 1800 to 4096
        temperature: 0.7
      } 
    };
    
    setLoading(true);
    const resp = await fetch('/api/chat', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(payload) 
    });
    
    const j = await resp.json();
    setLoading(false);

    // Remove loading message
    setSessionData(prev => ({
      ...prev,
      messages: prev.messages.filter(m => m.id !== loadingMessage.id)
    }));

    if (j.ok) {
      // Reload session to get assistant response
      const r2 = await fetch(`/api/sessions/${current.id}`);
      const j2 = await r2.json();
      if (j2.ok) setSessionData(j2.session);
    } else {
      // Show error as assistant message
      const errorMessage = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        text: 'Error: ' + j.error,
        ts: new Date().toISOString()
      };
      setSessionData(prev => ({
        ...prev,
        messages: [...(prev?.messages || []), errorMessage]
      }));
    }
  }

  if (!current) return <div className="no-session">Create or select a session</div>;

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-left">
          <h2>How can I help you today?</h2>
        </div>
        <div className="header-right">
          <ApiSelector current={current} settings={settings} />
        </div>
      </div>
      <div className="message-list-container">
        <MessageList messages={sessionData?.messages || []} loading={loading} />
      </div>
      <ChatInput onSend={sendMessage} />
    </div>
  );
}

function ApiSelector({ current, settings }) {
  const [isOpen, setIsOpen] = useState(false);
  const api = (settings.apis || []).find(a => a.id === current?.apiId);

  return (
    <div className="api-selector">
      <button 
        className="api-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Select API"
      >
        <span className="api-indicator">●</span>
        <span className="api-name">{api ? api.name : 'Select API'}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {isOpen && (
        <div className="api-dropdown">
          {(settings.apis || []).map(a => (
            <div
              key={a.id}
              className={`api-option ${api?.id === a.id ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <span className="api-dot">●</span>
              {a.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

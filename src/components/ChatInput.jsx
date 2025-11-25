import React, { useState } from 'react';
import FileUploader from './FileUploader';

export default function ChatInput({ onSend }) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);

  async function handleSend() {
    if (!text.trim() && files.length === 0) return;
    await onSend(text.trim(), files);
    setText('');
    setFiles([]);
  }

  function onKeyDown(e) {
    // Ctrl/Cmd + Enter to send
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="chat-input">
      <FileUploader onUploaded={(meta) => setFiles(prev => [...prev, meta])} />
      <textarea
        className="chat-textarea"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Type your message..."
      />
      <div className="input-actions">
        <button
          className="icon-btn send-btn"
          onClick={handleSend}
          aria-label="Send message"
          title="Send (Ctrl/Cmd+Enter)"
        >
          {/* paper-plane icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

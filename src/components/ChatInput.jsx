import React, { useState } from 'react';
import FileUploader from './FileUploader';

export default function ChatInput({ onSend }) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);

  async function handleSend() {
    if (!text.trim() && files.length === 0) return;
    
    const message = text.trim();
    const fileList = [...files];
    
    // Clear textarea immediately
    setText('');
    setFiles([]);
    
    // Send to parent with cleared state
    await onSend(message, fileList);
  }

  function onKeyDown(e) {
    // Send on Enter key (plain or Ctrl/Cmd+Enter)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="chat-input">
      <div className="input-container">
        <FileUploader onUploaded={(meta) => setFiles(prev => [...prev, meta])} />
        <textarea
          className="chat-textarea"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type your message..."
        />
      </div>
      <button
        className="icon-btn send-btn"
        onClick={handleSend}
        aria-label="Send message"
        title="Send (Enter)"
      >
        {/* paper-plane icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path fillRule="evenodd" d="M4.10514201,11.8070619 L2.74013818,2.2520351 L22.236068,12 L2.74013818,21.7479649 L4.10514201,12.1929381 L4.87689437,12 L4.10514201,11.8070619 Z M5.25986182,5.7479649 L5.89485799,10.1929381 L13.1231056,12 L5.89485799,13.8070619 L5.25986182,18.2520351 L17.763932,12 L5.25986182,5.7479649 Z" fill="currentColor"/>
        </svg>
      </button>
    </div>
  );
}

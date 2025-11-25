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

  return (
    <div className="chat-input">
      <FileUploader onUploaded={(meta) => setFiles(prev => [...prev, meta])} />
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Type your message..." />
      <div className="input-actions">
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import FileUploader from './FileUploader';
import CollectionsDropdown from './CollectionsDropdown';

export default function ChatInput({ onSend }) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [collection, setCollection] = useState('none');

  async function handleSend() {
    // if no text and no files, do nothing
    if (!text.trim() && files.length === 0) return;

    const rawMessage = text.trim();
    const fileList = [...files];
    const selectedCollection = collection === 'none' ? null : collection;

    // Build the message to send (append suffix only when a collection is selected)
    let sentMessage = rawMessage;
    if (selectedCollection) {
      // If rawMessage is empty, this will still send the suffix so the receiver knows the source
      sentMessage = rawMessage ? `${rawMessage} from ${selectedCollection}` : `from ${selectedCollection}`;
    }

    // Clear textarea and files immediately (UI remains clean)
    setText('');
    setFiles([]);
    setCollection('none');

    // Send to parent with the message that includes the background suffix when appropriate
    // Parent signature: onSend(message, files, collection)
    await onSend(sentMessage, fileList, selectedCollection);
  }

  function onKeyDown(e) {
    // Send on Enter key (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="chat-input" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div className="input-container" style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
        <FileUploader onUploaded={(meta) => setFiles(prev => [...prev, meta])} />
        <CollectionsDropdown
          apiUrl="http://localhost:9000/collections"
          value={collection}
          onChange={(v) => setCollection(v)}
          includeNone={true}
        />
        <textarea
          className="chat-textarea"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type your message..."
          style={{ flex: 1, minHeight: 48, padding: 8, borderRadius: 6 }}
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

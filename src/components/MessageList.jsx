import React from 'react';

export default function MessageList({ messages }) {
  return (
    <div className="message-list">
      {messages.map(m => (
        <div key={m.id} className={`message ${m.role}`}>
          <div className="message-body">{m.text}</div>
          <div className="message-ts">{ new Date(m.ts).toLocaleTimeString() }</div>
        </div>
      ))}
    </div>
  );
}

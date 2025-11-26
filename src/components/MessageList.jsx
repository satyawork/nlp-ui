import React, { useEffect, useRef } from 'react';

export default function MessageList({ messages }) {
  const endRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="message-list">
      {messages.map(m => (
        <div key={m.id} className={`message ${m.role}`}>
          <div className="message-bubble">
            <div className="message-body">{m.text}</div>
            <div className="message-ts">{ new Date(m.ts).toLocaleTimeString() }</div>
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}

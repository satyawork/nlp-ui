import React, { useEffect, useRef } from 'react';
// import './MessageList.css'; // new styles for loader
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


export default function MessageList({ messages }) {
  const endRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="message-list">
      {messages.map(m => (
        <div key={m.id} className={`message ${m.role} ${m.loading ? 'loading-message' : ''}`}>
          <div className="message-bubble">
            {m.loading ? (
              <div className="loader-wrapper">
                <div className="loader-dots" aria-hidden>
                  <span></span><span></span><span></span>
                </div>
              </div>
            ) : (
              <>
                <div className="message-body markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.text}
                  </ReactMarkdown>
                </div>
                <div className="message-ts">{ new Date(m.ts).toLocaleTimeString() }</div>
              </>
            )}
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
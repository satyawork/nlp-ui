import React from 'react';
import SessionList from './SessionList';
import ChatWindow from './ChatWindow';

export default function ChatLayout() {
  return (
    <div className="app-grid">
      <aside className="left-panel"><SessionList /></aside>
      <main className="main-panel"><ChatWindow /></main>
      
    </div>
  );
}

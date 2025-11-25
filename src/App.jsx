import React from 'react';
import { ApiSettingsProvider } from './contexts/ApiSettingsContext';
import { ChatSessionsProvider } from './contexts/ChatSessionsContext';
import ChatLayout from './components/ChatLayout';

export default function App() {
  return (
    <ApiSettingsProvider>
      <ChatSessionsProvider>
        <ChatLayout />
      </ChatSessionsProvider>
    </ApiSettingsProvider>
  );
}

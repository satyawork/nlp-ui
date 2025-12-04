import React from 'react';
import { useChatLogic } from '../hooks/useChatLogic';
import { useChatSessions } from '../contexts/ChatSessionsContext';
import { useApiSettings } from '../contexts/ApiSettingsContext';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import ChatHeader from './ChatHeader';

export default function ChatWindow() {
  const { current, setCurrent } = useChatSessions();
  const { settings } = useApiSettings();
  const { sessionData, loading, sendMessage } = useChatLogic(current, settings);

  if (!current) return <div className="no-session">Create or select a session</div>;

  return (
    <div className="chat-container">
      <ChatHeader/>
      <div className="message-list-container">
        <MessageList messages={sessionData?.messages || []} loading={loading} />
      </div>
      <ChatInput onSend={sendMessage} />
    </div>
  );
}

import React from 'react';
import ApiSelector from './ApiSelector';

export default function ChatHeader({ current, settings }) {
    return (
        <div className="chat-header">
            <div className="header-left">
                <h2>How can I help you today?</h2>
            </div>
            <div className="header-right">
                <ApiSelector current={current} settings={settings} />
            </div>
        </div>
    );
}

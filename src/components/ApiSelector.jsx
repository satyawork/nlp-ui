import React, { useState } from 'react';

export default function ApiSelector({ current, settings }) {
    const [isOpen, setIsOpen] = useState(false);
    const api = (settings.apis || []).find(a => a.id === current?.apiId);

    return (
        <div className="api-selector">
            <button
                className="api-selector-btn"
                onClick={() => setIsOpen(!isOpen)}
                title="Select API"
            >
                <span className="api-indicator">●</span>
                <span className="api-name">{api ? api.name : 'Select API'}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
            {isOpen && (
                <div className="api-dropdown">
                    {(settings.apis || []).map(a => (
                        <div
                            key={a.id}
                            className={`api-option ${api?.id === a.id ? 'active' : ''}`}
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="api-dot">●</span>
                            {a.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

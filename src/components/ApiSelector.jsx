import React, { useState } from 'react';

export default function ApiSelector({ current, settings }) {
    const [isOpen, setIsOpen] = useState(false);
    const api = (settings.apis || []).find(a => a.id === current?.apiId);

    return (
        <div className="api-selector">
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

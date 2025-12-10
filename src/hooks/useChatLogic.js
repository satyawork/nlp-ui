import { useState, useEffect } from 'react';

export function useChatLogic(current, settings) {
    const [sessionData, setSessionData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingMessageId, setLoadingMessageId] = useState(null);

    useEffect(() => {
        async function load() {
            if (!current) { setSessionData(null); return; }
            setLoading(true);
            const res = await fetch(`/api/sessions/${current.id}`);
            const j = await res.json();
            if (j.ok) setSessionData(j.session);
            setLoading(false);
        }
        load();
    }, [current]);

    async function sendMessage(text, files = []) {
        if (!current) return;

        // Create user message object and add to UI immediately
        const userMessage = {
            id: 'msg-' + Date.now(),
            role: 'user',
            text: text,
            ts: new Date().toISOString()
        };

        // Update UI with user message immediately
        setSessionData(prev => ({
            ...prev,
            messages: [...(prev?.messages || []), userMessage]
        }));

        // Show loading message (rendered as animated 3-dot loader in MessageList)
        const loadingMessage = {
            id: 'loading-' + Date.now(),
            role: 'assistant',
            loading: true,                 // flag for MessageList to render loader
            text: '',                      // keep text empty for loader
            ts: new Date().toISOString()
        };
        setLoadingMessageId(loadingMessage.id);
        setSessionData(prev => ({
            ...prev,
            messages: [...(prev?.messages || []), loadingMessage]
        }));

        // Send to server with increased max_tokens
    // Use apiId stored on the session itself; if session has no apiId send null to let backend use default
    const apiId = (sessionData && sessionData.apiId) || null;
        const payload = {
            apiId,
            prompt: text,
            sessionId: current.id,
            options: {
                files,
                max_tokens: 1800,  // Increased from 1800 to 4096
                temperature: 0.7
            }
        };

        setLoading(true);
        const resp = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const j = await resp.json();
        setLoading(false);

        // Remove loading message
        setSessionData(prev => ({
            ...prev,
            messages: prev.messages.filter(m => m.id !== loadingMessage.id)
        }));

        if (j.ok) {
            // Reload session to get assistant response
            const r2 = await fetch(`/api/sessions/${current.id}`);
            const j2 = await r2.json();
            if (j2.ok) setSessionData(j2.session);
        } else {
            // Show error as assistant message
            const errorMessage = {
                id: 'err-' + Date.now(),
                role: 'assistant',
                text: 'Error: ' + j.error,
                ts: new Date().toISOString()
            };
            setSessionData(prev => ({
                ...prev,
                messages: [...(prev?.messages || []), errorMessage]
            }));
        }
    }

    return { sessionData, loading, sendMessage };
}

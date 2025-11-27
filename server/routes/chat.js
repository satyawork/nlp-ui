// server/routes/chat.js
import express from 'express';
import { ApiSettingsStore, SessionsStore } from '../stores/fileStore.js';
import { nowIso } from '../utils.js';

const router = express.Router();

/**
 * POST /api/chat
 * 
 * Main chat endpoint that:
 * 1. Accepts a prompt and API configuration
 * 2. Sends the prompt to the configured API endpoint
 * 3. Captures and stores the response in the session
 * 
 * Request body:
 *   - apiId (string): ID of the API to use (must exist in settings)
 *   - prompt (string): The user's message/question
 *   - sessionId (string, optional): Session to save messages to
 *   - options (object, optional): Additional parameters for the API (temp, max_tokens, etc.)
 * 
 * Response:
 *   - { ok: true, output: string } on success
 *   - { ok: false, error: string } on error
 */
router.post('/', async (req, res) => {
  const { apiId, prompt, sessionId, options } = req.body;
  console.log(apiId, prompt, sessionId, options);
  // Validate required fields
  if (!apiId || !prompt) {
    return res.status(400).json({ 
      ok: false, 
      error: 'apiId and prompt required' 
    });
  }

  // Fetch API configuration from settings
  const settings = await ApiSettingsStore.getSettings();
  const api = (settings.apis || []).find(a => a.id === apiId);
  
  // Check if API exists in configuration
  if (!api) {
    return res.status(400).json({ 
      ok: false, 
      error: 'apiId not found' 
    });
  }
  
  // Log request for debugging
  console.log('[chat] apiId=', apiId, 'prompt=', prompt.slice(0, 30) + '...', 'sessionId=', sessionId);

  // Optimistic update: save user message to session before calling API
  // This provides immediate feedback in the UI
  let session = null;
  if (sessionId) {
    session = await SessionsStore.getSession(sessionId);
    if (session) {
      // Add user's message to the session
      session.messages.push({ 
        id: 'm-' + Date.now(), 
        role: 'user', 
        text: prompt, 
        ts: nowIso() 
      });
      session.updatedAt = nowIso();
      await SessionsStore.saveSession(session);
    }
  }

  try {
    // ========================================
    // Step 1: Prepare headers for API request
    // ========================================
    const headers = { 'Content-Type': 'application/json' };
    
    // Add any custom headers configured in API settings
    // Example: Authorization, X-API-Key, etc.
    (api.headers || []).forEach(h => {
      if (h && h.key) headers[h.key] = h.value;
    });

    // ========================================
    // Step 2: Build request body
    // ========================================
    const body = {
      prompt: prompt,  // The user's message
      ...options       // Spread any additional options (temperature, max_tokens, etc.)
    };

    // Log request details for debugging
    console.log('[chat] POST to', api.baseUrl);
    console.log('[chat] Headers:', JSON.stringify(headers, null, 2));
    console.log('[chat] Body:', JSON.stringify(body, null, 2));

    // ========================================
    // Step 3: Call the external API
    // ========================================
    const apiRes = await fetch(api.baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });

    // Log response status code
    console.log('[chat] Response status:', apiRes.status);

    // ========================================
    // Step 4: Parse API response
    // ========================================
    let output = '';
    const contentType = (apiRes.headers.get('content-type') || '').toLowerCase();
    
    if (contentType.includes('json')) {
      // If response is JSON, extract text from common response formats
      const json = await apiRes.json();
      console.log('[chat] Response body:', JSON.stringify(json, null, 2));
      
      // Try multiple common response structures:
      // - OpenAI/vLLM format: { choices: [{ text: "..." }] }
      // - Generic format: { output: "..." } or { result: "..." }
      // - Simple format: { text: "..." }
      output = json.choices?.[0]?.text 
        ?? json.output 
        ?? json.result 
        ?? json.text 
        ?? JSON.stringify(json);  // Fallback: return entire response as string
    } else {
      // If response is plain text, use it directly
      output = await apiRes.text();
      console.log('[chat] Response (text):', output);
    }

    // ========================================
    // Step 5: Save assistant response to session
    // ========================================
    if (session) {
      // Add assistant's response to the session
      session.messages.push({ 
        id: 'm-' + Date.now(), 
        role: 'assistant', 
        text: output, 
        ts: nowIso() 
      });
      session.updatedAt = nowIso();
      await SessionsStore.saveSession(session);
    }

    // ========================================
    // Step 6: Return success response to client
    // ========================================
    return res.json({ ok: true, output });
    
  } catch (e) {
    // Handle any errors during API call
    console.error('[chat] Error:', e);
    return res.status(500).json({ 
      ok: false, 
      error: String(e) 
    });
  }
});

export default router;

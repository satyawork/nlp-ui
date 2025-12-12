// server/routes/chat.js
import express from 'express';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { ApiSettingsStore, SessionsStore } from '../stores/fileStore.js';
import { nowIso } from '../utils.js';
import { chatWithMCP } from '../adapters/mcp.js';

const router = express.Router();

/**
 * POST /api/chat
 * 
 * Request body:
 *   - apiId (string): ID of the API to use (must exist in settings)
 *   - prompt (string): The user's message/question
 *   - sessionId (string, optional): Session to save messages to
 *   - options (object, optional): Additional parameters for the API (temp, max_tokens, etc.)
 */
router.post('/', async (req, res) => {
  let { apiId, prompt: rawPrompt, sessionId, options } = req.body;
  console.log('chat request:', { apiId, sessionId });
  if (!rawPrompt) return res.status(400).json({ ok: false, error: 'prompt required' });

  const settings = await ApiSettingsStore.getSettings();
  
  // support a top-level `default` (global) config and per-api overrides
  const def = settings.default || {};
  
  // Check RAG flag and if "from collection" phrase is present
  const ragEnabled = settings.RAG?.enable === 'true' || settings.RAG?.enable === true;
  const fromCollectionRegex = /(.*)\bfrom collection\b\s*(.+)$/i;
  const match = rawPrompt.match(fromCollectionRegex);
  const hasFromCollection = !!match;
  
  console.log(`[chat] RAG enabled: ${ragEnabled}, Has "from collection": ${hasFromCollection}`);
  
  // If "from collection" is NOT present OR RAG is disabled -> route to MCP
  if (!hasFromCollection && settings.MCP?.chat) {
    console.log(`[chat] No "from collection" phrase detected, routing to MCP: ${settings.MCP.chat}`);
    
    try {
      const mcpResult = await chatWithMCP(settings.MCP.chat, rawPrompt);
      
      if (!mcpResult.ok) {
        console.error('[chat] MCP chat failed:', mcpResult.error);
        return res.status(500).json({
          ok: false,
          error: 'MCP chat failed',
          detail: mcpResult.error,
        });
      }
      
      // Save messages to session if provided
      if (sessionId) {
        const session = await SessionsStore.getSession(sessionId);
        if (session) {
          session.messages.push({
            id: 'm-' + Date.now(),
            role: 'user',
            text: rawPrompt,
            ts: nowIso()
          });
          session.messages.push({
            id: 'm-' + (Date.now() + 1),
            role: 'assistant',
            text: mcpResult.output,
            ts: nowIso()
          });
          session.updatedAt = nowIso();
          await SessionsStore.saveSession(session);
        }
      }
      
      console.log('[chat] MCP chat successful');
      return res.json({ ok: true, output: mcpResult.output, routedTo: 'MCP' });
      
    } catch (e) {
      console.error('[chat] MCP routing error:', e);
      return res.status(500).json({
        ok: false,
        error: 'MCP routing failed',
        detail: String(e),
      });
    }
  }
  
  // If "from collection" is present but RAG is disabled -> also route to MCP
  if (hasFromCollection && !ragEnabled && settings.MCP?.chat) {
    console.log(`[chat] "from collection" phrase found but RAG is disabled, routing to MCP: ${settings.MCP.chat}`);
    
    try {
      const mcpResult = await chatWithMCP(settings.MCP.chat, rawPrompt);
      
      if (!mcpResult.ok) {
        console.error('[chat] MCP chat failed:', mcpResult.error);
        return res.status(500).json({
          ok: false,
          error: 'MCP chat failed',
          detail: mcpResult.error,
        });
      }
      
      // Save messages to session if provided
      if (sessionId) {
        const session = await SessionsStore.getSession(sessionId);
        if (session) {
          session.messages.push({
            id: 'm-' + Date.now(),
            role: 'user',
            text: rawPrompt,
            ts: nowIso()
          });
          session.messages.push({
            id: 'm-' + (Date.now() + 1),
            role: 'assistant',
            text: mcpResult.output,
            ts: nowIso()
          });
          session.updatedAt = nowIso();
          await SessionsStore.saveSession(session);
        }
      }
      
      console.log('[chat] MCP chat successful');
      return res.json({ ok: true, output: mcpResult.output, routedTo: 'MCP' });
      
    } catch (e) {
      console.error('[chat] MCP routing error:', e);
      return res.status(500).json({
        ok: false,
        error: 'MCP routing failed',
        detail: String(e),
      });
    }
  }
  // Resolve apiId: prefer provided apiId; otherwise use session.apiId if sessionId provided; else fallback to undefined
  if (!apiId && sessionId) {
    const s = await SessionsStore.getSession(sessionId);
    if (s && s.apiId) apiId = s.apiId;
  }

  let api = apiId ? (settings.apis || []).find(a => a.id === apiId) : null;
  // if still not found, do not treat as fatal — we'll allow default.baseUrl to be used below

  console.log('[chat] apiId=', apiId, 'prompt=', rawPrompt.slice(0, 120) + (rawPrompt.length > 120 ? '...' : ''), 'sessionId=', sessionId);

  // optimistic session save
  let session = null;
  if (sessionId) {
    session = await SessionsStore.getSession(sessionId);
    if (session) {
      session.messages.push({
        id: 'm-' + Date.now(),
        role: 'user',
        text: rawPrompt,
        ts: nowIso()
      });
      session.updatedAt = nowIso();
      await SessionsStore.saveSession(session);
    }
  }

  try {
    // detect "from collection" (case-insensitive)
    const fromCollectionRegex = /(.*)\bfrom collection\b\s*(.+)$/i;
    const match = rawPrompt.match(fromCollectionRegex);

    let output = '';

    if (match) {
      const question = match[1].trim();
      const collection = match[2].trim();

      if (!question) {
        console.warn('[chat] "from collection" found but question is empty.');
        return res.status(400).json({ ok: false, error: 'Prompt must include a question before "from collection"' });
      }

      console.log(`[chat] "from collection" phrase detected with RAG enabled. Routing to RAG /ask API. collection='${collection}', question='${question.slice(0,120)}'`);

      const form = new FormData();
      form.append('question', question);
      form.append('collection', collection);

      const askUrl = 'http://localhost:9000/ask';
      console.log('[chat] POST to', askUrl);

      const apiRes = await fetch(askUrl, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          ...form.getHeaders()
        },
        body: form
      });

      console.log('[chat] /ask response status:', apiRes.status);

      const contentType = (apiRes.headers.get('content-type') || '').toLowerCase();

      if (contentType.includes('json')) {
        const json = await apiRes.json();
        console.log('[chat] /ask JSON (preview):', JSON.stringify(json).slice(0, 2000));

        // *** Important change: only return the "content" text if present (handles the example you pasted)
        // Prefer json.message?.content, then other common fields, then fallback to entire JSON.
        const extracted =
          (json && typeof json === 'object' && json.message && typeof json.message === 'object' && json.message.content) ||
          json.content ||
          json.answer ||
          json.output ||
          json.result ||
          json.text ||
          null;

        if (extracted !== null && extracted !== undefined) {
          // if extracted is an object (rare), stringify it, otherwise use as string
          output = typeof extracted === 'string' ? extracted : JSON.stringify(extracted);
        } else {
          // fallback to full JSON string if nothing matched
          output = JSON.stringify(json);
        }
      } else {
        // plain text or other non-json body
        output = await apiRes.text();
        console.log('[chat] /ask response (text preview):', output.slice(0, 2000));
      }

    } else {
      // No "from collection": call configured API as before
      // Resolve final baseUrl and headers using default + per-api overrides
      // Support two modes:
      // 1) api.baseUrl provided -> use it
      // 2) api.endpoint provided (path) -> build from def.baseUrl or def.host+def.port
      const buildFromDefault = (apiEntry) => {
        if (apiEntry && apiEntry.baseUrl) return apiEntry.baseUrl;
        if (apiEntry && apiEntry.endpoint) {
          const host = def.baseUrl || (def.host ? `${def.host}${def.port ? `:${def.port}` : ''}` : null);
          if (!host) return null;
          return host.replace(/\/$/, '') + '/' + apiEntry.endpoint.replace(/^\//, '');
        }
        return null;
      };

      const finalBase = buildFromDefault(api) || (def.baseUrl || (def.host ? `${def.host}${def.port ? `:${def.port}` : ''}` : null));
      const headersObj = { 'Content-Type': 'application/json' };
      const collectHeaders = (arr) => {
        (arr || []).forEach(h => { if (h && h.key) headersObj[h.key] = h.value; });
      };
  collectHeaders(def.headers);
  if (api) collectHeaders(api.headers);

      const body = { query: rawPrompt, ...options };

  if (!finalBase) return res.status(400).json({ ok: false, error: 'No API base URL configured (set default.baseUrl or api.baseUrl/endpoint)' });
  console.log('[chat] POST to', finalBase);
      console.log('[chat] Sending body (preview):', JSON.stringify(body).slice(0, 2000));

      const apiRes = await fetch(finalBase, {
        method: 'POST',
        headers: headersObj,
        body: JSON.stringify(body)
      });

      console.log('[chat] External API response status:', apiRes.status);

      const contentType = (apiRes.headers.get('content-type') || '').toLowerCase();

      if (contentType.includes('json')) {
        const json = await apiRes.json();
        console.log('[chat] External API JSON response (preview):', JSON.stringify(json).slice(0, 2000));

        output = json.choices?.[0]?.text
          ?? json.response
          ?? json.output
          ?? json.result
          ?? json.text
          ?? JSON.stringify(json);
      } else {
        output = await apiRes.text();
        console.log('[chat] External API text response (preview):', output.slice(0, 2000));
      }
    }

    // save assistant response to session
    if (session) {
      session.messages.push({
        id: 'm-' + Date.now(),
        role: 'assistant',
        text: output,
        ts: nowIso()
      });
      session.updatedAt = nowIso();
      await SessionsStore.saveSession(session);
    }

    return res.json({ ok: true, output });

  } catch (e) {
    console.error('[chat] Error:', e);
    return res.status(500).json({
      ok: false,
      error: String(e)
    });
  }
});

export default router;


// server/adapters/mcp.js
// MCP (Model Context Protocol) adapter
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

/**
 * Upload file to MCP server
 * Matches: curl -X POST http://localhost:8080/upload-file -F "file=@/path/to/file.pdf"
 */
export async function uploadFileToMCP(mcpUploadUrl, filePath, originalName, mimeType) {
  try {
    console.log(`[MCP Adapter] Uploading file to MCP: ${mcpUploadUrl}`);
    console.log(`[MCP Adapter] File: ${originalName} (${mimeType})`);
    
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), {
      filename: originalName,
      contentType: mimeType,
    });

    const response = await fetch(mcpUploadUrl, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    let data;
    
    if (contentType.includes('json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    console.log(`[MCP Adapter] Upload response status: ${response.status}`);
    
    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    console.error('[MCP] Upload error:', error);
    return {
      ok: false,
      error: String(error),
    };
  }
}

/**
 * Send chat query to MCP server
 * Matches: curl -X POST http://localhost:8080/chat -H "Content-Type: application/json" -d '{"query": "..."}'
 */
export async function chatWithMCP(mcpChatUrl, query) {
  try {
    console.log(`[MCP Adapter] Sending chat query to MCP: ${mcpChatUrl}`);
    console.log(`[MCP Adapter] Query: ${query.slice(0, 100)}${query.length > 100 ? '...' : ''}`);
    const response = await fetch(mcpChatUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    let output;

    if (contentType.includes('json')) {
      const json = await response.json();
      output = json.response || json.output || json.result || json.text || json.answer || JSON.stringify(json);
    } else {
      output = await response.text();
    }

    return {
      ok: response.ok,
      status: response.status,
      output,
    };
  } catch (error) {
    console.error('[MCP] Chat error:', error);
    return {
      ok: false,
      error: String(error),
    };
  }
}

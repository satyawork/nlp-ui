// server/adapters/generic.js
// Generic adapter: POST JSON { prompt } and expects a JSON response containing text in `.output` or `.result` or plain text
export async function callModel(apiConfig, prompt, options = {}) {
  const headers = {};
  (apiConfig.headers || []).forEach(h => { if (h.key) headers[h.key] = h.value; });
  headers['Content-Type'] = headers['Content-Type'] || 'application/json';

  const body = JSON.stringify({ prompt, options });
  const res = await fetch(apiConfig.baseUrl, { method: apiConfig.method || 'POST', headers, body });
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('json')) {
    const json = await res.json();
    const output = json.output ?? json.result ?? json.text ?? JSON.stringify(json);
    return { output, meta: { status: res.status, raw: json } };
  } else {
    const text = await res.text();
    return { output: text, meta: { status: res.status } };
  }
}

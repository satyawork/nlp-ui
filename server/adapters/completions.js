// server/adapters/completions.js
export async function completionsAdapter(api, prompt, options = {}) {
  // Build headers robustly
  const headers = {};
  (api.headers || []).forEach(h => {
    if (!h || !h.key) return;
    headers[h.key] = h.value;
  });

  // Force JSON headers (important)
  headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  headers['Accept'] = headers['Accept'] || 'application/json';

  const body = {
    model: api.model || "/models",
    prompt,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 1800
  };

  // Debug: log what we're sending to the API
  console.log('[completionsAdapter] Sending request to:', api.baseUrl);
  console.log('[completionsAdapter] Request headers:', JSON.stringify(headers, null, 2));
  console.log('[completionsAdapter] Request body:', JSON.stringify(body, null, 2));

  const res = await fetch(api.baseUrl, {
    method: api.method || "POST",
    headers,
    body: JSON.stringify(body)
  });

  // Attempt to parse JSON safely
  let json;
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  try {
    if (ct.includes('json')) json = await res.json();
    else json = { _raw: await res.text() };
  } catch (err) {
    json = { _parseError: String(err), _raw: await res.text().catch(()=>'') };
  }

  // Debug: log the response
  console.log('[completionsAdapter] Response status:', res.status);
  // convert headers iterator to object for logging
  console.log('[completionsAdapter] Response headers:', JSON.stringify(Object.fromEntries(res.headers.entries()), null, 2));
  console.log('[completionsAdapter] Response body:', JSON.stringify(json, null, 2));

  return {
    output: json.choices?.[0]?.text ?? json.output ?? JSON.stringify(json),
    meta: json
  };
}

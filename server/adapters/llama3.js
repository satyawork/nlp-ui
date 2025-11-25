// server/adapters/llama3.js
// Adapter for Llama-3-Groq-70B-Tool-Use request format.
// This is a best-effort template — adjust fields if your Llama endpoint expects different payload.
export async function callModel(apiConfig, prompt, options = {}) {
  const headers = {};
  (apiConfig.headers || []).forEach(h => { if (h.key) headers[h.key] = h.value; });
  headers['Content-Type'] = headers['Content-Type'] || 'application/json';

  // Build Llama-3 request body according to "Llama-3-Groq-70B-Tool-Use" style
  const body = {
    model: apiConfig.model || "Llama-3-Groq-70B-Tool-Use",
    input: prompt,
    temperature: options.temperature ?? 0.0,
    max_output_tokens: options.max_output_tokens ?? 512,
    // add other fields if your endpoint accepts them
  };

  const res = await fetch(apiConfig.baseUrl, {
    method: apiConfig.method || 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('json')) {
    const json = await res.json();
    // For Llama-like endpoints the response might be shaped differently. Try to find text.
    const output = json.output ?? json.text ?? json.result ?? JSON.stringify(json);
    return { output, meta: { status: res.status, raw: json } };
  } else {
    const text = await res.text();
    return { output: text, meta: { status: res.status } };
  }
}

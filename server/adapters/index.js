// server/adapters/index.js
import { callModel as genericCall } from './generic.js';
import { callModel as llamaCall } from './llama3.js';
import { completionsAdapter as completionsCall } from './completions.js'; // if you added completions.js

/**
 * Dispatch to the correct adapter implementation.
 * Each adapter file should export `export async function callModel(apiConfig, prompt, options = {}) { ... }`
 * and return an object: { output: string, meta?: any }.
 */
export async function callModelWithAdapter(api, prompt, options = {}) {
  const adapter = (api.adapter || api.type || 'generic').toLowerCase();

  switch (adapter) {
    case 'llama3':
      return await llamaCall(api, prompt, options);

    case 'completions':
      return await completionsCall(api, prompt, options);

    case 'generic':
    default:
      return await genericCall(api, prompt, options);
  }
}

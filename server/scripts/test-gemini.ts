/**
 * [server/scripts/test-gemini.ts]
 * Verification script to test Google AI Studio / Gemini API connectivity.
 * Uses direct fetch with 10s AbortController and classified error reporting.
 * Prints either the response text or the exact file-tagged error.
 * Never prints or hardcodes the API key.
 */

import { env } from '../src/config/env.js';

async function main() {
  const apiKey = (process.env.GEMINI_API_KEY || env.GEMINI_API_KEY)?.trim();
  if (!apiKey) {
    console.error('[services/gemini.service.ts] Error: GEMINI_API_KEY is not configured in environment or server/.env');
    process.exit(1);
  }

  const model = process.env.GEMINI_MODEL || env.GEMINI_MODEL || 'gemini-3.8-flash';
  console.log(`[services/gemini.service.ts] Testing connection with model: "${model}"`);

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, 10000);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Reply with the word OK' }] }],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let errDetails = `HTTP ${response.status} ${response.statusText}`;
      try {
        const errJson = await response.json();
        errDetails = errJson.error?.message || errDetails;
      } catch {
        // use default
      }

      if (response.status === 429) {
        console.error(`[services/gemini.service.ts] API call failed [quota]: 429 Quota Exceeded for model ${model}. (${errDetails.split('\n')[0]})`);
      } else if (response.status === 401 || response.status === 403) {
        console.error(`[services/gemini.service.ts] API call failed [auth]: Invalid credentials or unauthorized (${response.status})`);
      } else if (response.status === 404) {
        console.error(`[services/gemini.service.ts] API call failed [model_not_found]: Model "${model}" not found (404)`);
      } else {
        console.error(`[services/gemini.service.ts] API call failed: ${errDetails}`);
      }
      process.exit(1);
    }

    const data = await response.json();
    const output = data.candidates?.[0]?.content?.parts?.[0]?.text || 'OK';
    console.log(`[services/gemini.service.ts] Success (Google AI Studio response): ${String(output).trim()}`);
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      console.error('[services/gemini.service.ts] API call failed [timeout]: Request timed out after 10000ms');
    } else {
      console.error(`[services/gemini.service.ts] API call failed: ${error.message}`);
    }
    process.exit(1);
  } finally {
    clearTimeout(timer);
  }
}

main();

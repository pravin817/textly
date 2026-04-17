// background.js — Service Worker

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL      = 'gpt-4o-mini'; // cheap + fast

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== 'AI_REQUEST') return;

  handleRequest(msg.prompt, msg.text)
    .then(result => sendResponse({ result }))
    .catch(err  => sendResponse({ error: err.message }));

  return true; // keep channel open for async response
});

async function handleRequest(prompt, text) {
  const { openai_key } = await chrome.storage.sync.get('openai_key');

  if (!openai_key) {
    throw new Error('No API key set. Right-click extension icon → Options.');
  }

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${openai_key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 500,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful writing assistant. Be concise. Return only the result, no preamble.'
        },
        {
          role: 'user',
          content: `${prompt}\n\n${text}`
        }
      ]
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '—';
}

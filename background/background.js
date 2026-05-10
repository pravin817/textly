// background.js — Service Worker

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini"; // cheap + fast

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  // Handle AI requests from content script
  if (msg.type === "AI_REQUEST") {
    handleRequest(msg.messages)
      .then((result) => sendResponse({ result }))
      .catch((err) => sendResponse({ error: err.message }));
    return true; // keep channel open for async response
  }

  // Handle settings page open request from content script
  if (msg.type === "OPEN_OPTIONS") {
    chrome.runtime.openOptionsPage();
    return false;
  }

  // ─── Analytics tracking relay ──────────────────────────────────────────────
  // Content scripts can't fetch custom origins due to CSP, so they proxy
  // tracking events through the background service worker.
  // Fire-and-forget: tracking NEVER blocks or affects the UX.
  if (msg.type === "TRACK_EVENT") {
    chrome.storage.sync.get(
      ["textly_server_url", "textly_api_token"],
      ({ textly_server_url, textly_api_token }) => {
        const serverUrl = textly_server_url || "http://localhost:3001";
        const token = textly_api_token || "";
        if (!token) return; // no token configured → skip silently

        fetch(`${serverUrl}${msg.endpoint}`, {
          method: msg.method || "POST",
          headers: {
            "Content-Type": "application/json",
            "x-textly-token": token,
          },
          body: msg.data ? JSON.stringify(msg.data) : undefined,
        }).catch(() => {}); // swallow all errors silently
      },
    );
    return false; // no async response needed
  }
});

async function handleRequest(messages) {
  const { openai_key } = await chrome.storage.sync.get("openai_key");

  if (!openai_key) {
    throw new Error("No API key set. Click the Textly icon → Save Key.");
  }

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openai_key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You are a versatile AI assistant. Follow the user instructions precisely. Be concise and well-formatted. Return only the result, no preamble.",
        },
        ...messages,
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "—";
}

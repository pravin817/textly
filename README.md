# Textly — Select. Act. Done. ✦

> Select any text on any webpage and instantly summarize, rephrase, fix grammar, translate, and more — powered by OpenAI.

![Version](https://img.shields.io/badge/version-1.0.0-6c63ff)
![Manifest](https://img.shields.io/badge/manifest-v3-6c63ff)
![License](https://img.shields.io/badge/license-MIT-6c63ff)

---

## What is Textly?

Textly is a Chrome extension that puts AI text operations one click away on any webpage. Highlight any text, pick an action from the floating toolbar, and get an instant AI-powered result — without leaving the page or switching tabs.

It supports follow-up questions, so you can have a full back-and-forth conversation about any piece of text.

---

## Features

- **8 built-in actions** — Summarize, Formal, Casual, Fix Grammar, Explain, Bullets, Shorter, Translate to English
- **Follow-up questions** — Continue the conversation with full context preserved
- **Drag to move** — Reposition the toolbar anywhere on the screen
- **Works on any webpage** — Articles, PDFs opened in Chrome, emails, documentation
- **Your key, your data** — API key stored locally, requests go directly to OpenAI
- **No backend** — Fully client-side, nothing passes through any third-party server

---

## Project Structure

```
textly/
├── manifest.json      # Extension config — permissions, entry points, metadata
├── background.js      # Service worker — handles OpenAI API calls
├── content.js         # Injected into pages — toolbar UI, drag, conversation state
├── content.css        # Toolbar styles — scoped to avoid host page collisions
├── options.html       # Settings page — API key entry
├── options.js         # Settings logic — save/load API key
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## How It Works

```
User highlights text on any page
          ↓
Textly toolbar appears below the selection
          ↓
User picks an action (e.g. Summarize)
          ↓
content.js builds a messages array and sends it to background.js
          ↓
background.js calls OpenAI /v1/chat/completions
          ↓
Result is displayed in the toolbar
          ↓
User can ask follow-up questions — full conversation history is maintained
and sent to OpenAI on every turn so context is never lost
```

---

## Getting Started

### Prerequisites

- Google Chrome (version 88 or later)
- An OpenAI API key — get one at [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### Installation

Textly is not yet on the Chrome Web Store. Install it in developer mode:

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the `textly` project folder
6. The Textly icon will appear in your Chrome toolbar

### Adding Your API Key

1. Right-click the Textly icon in the toolbar → **Options**
   — or go to `chrome://extensions`, find Textly, and click **Details → Extension options**
2. Paste your OpenAI API key (starts with `sk-`)
3. Click **Save Key**

---

## Usage

1. Go to any webpage
2. Select / highlight any text (minimum 10 characters)
3. The Textly toolbar appears just below your selection
4. Click any action button
5. Read the result — then type a follow-up question if needed
6. Drag the toolbar by the **Textly** handle bar to move it anywhere on screen

### Keyboard

| Action | Shortcut |
|---|---|
| Send follow-up | `Enter` |

---

## Actions Reference

| Button | What it does |
|---|---|
| 📝 Summarize | 2–3 sentence summary of the selected text |
| 👔 Formal | Rewrites the text in a professional tone |
| 😊 Casual | Rewrites the text in a friendly, casual tone |
| ✅ Fix Grammar | Corrects grammar, spelling, and punctuation |
| 💡 Explain | Explains the text in plain, simple language |
|  • Bullets | Converts the text into bullet points |
| ✂️ Shorter | Condenses the text while keeping the key message |
| 🌐 To English | Translates the text to English |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Extension platform | Chrome Extensions — Manifest V3 |
| AI | OpenAI `gpt-4o-mini` |
| UI | Vanilla JS + CSS injected into host pages |
| Storage | `chrome.storage.sync` |
| Communication | `chrome.runtime.sendMessage` (content ↔ background) |

No build step. No bundler. No npm. Open the folder, load unpacked, done.

---

## Configuration

All configuration lives in `background.js`:

```js
const MODEL      = 'gpt-4o-mini';  // Swap to 'gpt-4o' for higher quality
const MAX_TOKENS = 600;             // Maximum response length
const TEMP       = 0.7;             // 0 = deterministic, 1 = creative
```

To add a new action, add one entry to the `ACTIONS` array in `content.js`:

```js
{ id: 'myaction', label: '🔥 My Action', prompt: 'Do something to this text:' }
```

That's all — the button renders automatically.

---

## Privacy

- Your OpenAI API key is stored in `chrome.storage.sync` — local to your browser
- Selected text is sent **only to OpenAI** (`api.openai.com`) — nowhere else
- No analytics, no tracking, no external scripts
- No Textly server — the extension talks directly to OpenAI

---

## Roadmap

- [ ] Replace selected text with the AI result in editable fields
- [ ] More languages for the Translate action
- [ ] Custom actions — define your own prompts in Options
- [ ] Export conversation history
- [ ] Firefox support (Manifest V3 compatible)
- [ ] Chrome Web Store listing

---

## Contributing

1. Fork the repo
2. Create a feature branch — `git checkout -b feature/my-feature`
3. Make your changes
4. Test by loading the folder as an unpacked extension
5. Open a pull request with a clear description of what changed and why

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

*Built with Textly — select, act, done.*
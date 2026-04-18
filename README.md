# Textly — Select. Act. Done. ✦

> Select any text on any webpage and instantly summarize, rephrase, fix grammar, translate, learn, practice DSA, take quizzes, and more — powered by OpenAI.

![Version](https://img.shields.io/badge/version-2.0.0-6c63ff)
![Manifest](https://img.shields.io/badge/manifest-v3-6c63ff)
![License](https://img.shields.io/badge/license-MIT-6c63ff)

---

## What is Textly?

Textly is a Chrome extension that puts AI-powered text operations one click away on any webpage. Highlight any text, pick a category tab, choose an action from the floating toolbar, and get an instant result — without leaving the page or switching tabs.

**4 modes, 27 actions** — from writing assistance to learning, DSA practice, and quiz generation.

---

## Features

- **4 category tabs** — General, Learn, DSA, Quiz
- **27 built-in actions** — Summarize, Explain, Debug Code, Generate MCQs, and more
- **Drag to move** — Reposition the toolbar anywhere on the screen
- **Works on any webpage** — Articles, PDFs opened in Chrome, emails, documentation
- **Your key, your data** — API key stored locally, requests go directly to OpenAI
- **No backend** — Fully client-side, nothing passes through any third-party server
- **Easily extensible** — Add new actions or categories with a single config entry

---

## Project Structure

```
textly/
├── manifest.json              # Extension config — permissions, entry points, metadata
├── README.md
├── background/
│   └── background.js          # Service worker — handles OpenAI API calls
├── content/
│   ├── actions.js             # Action categories & prompt definitions
│   ├── content.js             # Injected into pages — toolbar UI, tabs, drag
│   └── content.css            # Toolbar styles — scoped to avoid host page collisions
├── options/
│   ├── options.html           # Settings page — API key entry
│   └── options.js             # Settings logic — save/load API key
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
User selects a category tab (General / Learn / DSA / Quiz)
          ↓
User picks an action (e.g. Summarize, ELI5, Debug Code, MCQ)
          ↓
content.js sends the prompt + text to background.js
          ↓
background.js calls OpenAI /v1/chat/completions
          ↓
Result is displayed in the toolbar
          ↓
User can Copy the result or go Back to try another action
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
4. Choose a **category tab** at the top (General, Learn, DSA, or Quiz)
5. Click any action button
6. Read the result — click **📋 Copy** to copy or **← Back** to try another action
7. Drag the toolbar by the **Textly** handle bar to move it anywhere on screen

---

## Actions Reference

### ✏️ General — Text manipulation and rewriting

| Button | What it does |
|---|---|
| 📝 Summarize | 2–3 sentence summary of the selected text |
| 👔 Formal | Rewrites the text in a professional tone |
| 😊 Casual | Rewrites the text in a friendly, casual tone |
| 🔗 LinkedIn | Writes a thoughtful LinkedIn reply |
| ✅ Grammar | Corrects grammar, spelling, and punctuation |
| 💡 Explain | Explains the text in plain, simple language |
| • Bullets | Converts the text into bullet points |
| ✂️ Shorter | Condenses the text while keeping the key message |
| 🌐 English | Translates the text to English |

### 📖 Learn — Understanding and exploring topics

| Button | What it does |
|---|---|
| 🧒 ELI5 | Explains like you're 5 — ultra-simple |
| 🧠 Key Concepts | Extracts key terms and definitions |
| 🔍 Deep Dive | Detailed explanation with examples |
| 💭 Analogy | Explains using a real-world analogy |
| 📚 Related Topics | Suggests what to learn next |
| 🗺️ Roadmap | Creates a learning path for the topic |

### 🧩 DSA — Data Structures & Algorithms practice

| Button | What it does |
|---|---|
| 🔍 Pattern | Identifies the DSA pattern (sliding window, BFS, etc.) |
| 📝 Pseudocode | Converts problem to step-by-step pseudocode |
| ⏱️ Complexity | Analyzes time & space complexity |
| 🔄 Alternatives | Suggests brute-force vs optimal solutions |
| 🐛 Debug | Finds bugs and logical errors in code |
| 💡 Hints | Gives progressive hints without revealing the solution |

### 🎯 Quiz — Generate questions from any text

| Button | What it does |
|---|---|
| 📋 MCQ | Generates 5 multiple-choice questions |
| ✍️ Short Answer | Generates short-answer questions |
| ✅ True/False | Generates true/false statements |
| 🔲 Fill Blanks | Generates fill-in-the-blank questions |
| 🧠 Flashcards | Generates Q&A flashcard pairs |
| 🎯 Viva Q&A | Generates interview/viva-style questions |

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

Model and response settings live in `background/background.js`:

```js
const MODEL = 'gpt-4o-mini';  // Swap to 'gpt-4o' for higher quality
// max_tokens: 1024            // Maximum response length
// temperature: 0.7            // 0 = deterministic, 1 = creative
```

### Adding a New Action

Add one entry to any category's `actions` array in `content/actions.js`:

```js
{
  id: 'myaction',
  label: '🔥 My Action',
  prompt: 'Do something to this text:'
}
```

### Adding a New Category

Add a new object to `ACTION_CATEGORIES` in `content/actions.js`:

```js
{
  id: 'mycategory',
  label: '🆕 My Category',
  actions: [
    { id: 'action1', label: '⚡ Action', prompt: 'Your prompt here:' }
  ]
}
```

The tab and buttons render automatically — no other code changes needed.

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
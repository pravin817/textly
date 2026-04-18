// =============================================================================
// ACTIONS CONFIG — Loaded before content.js via manifest.json
//
// Each entry defines one button in the toolbar.
//   id     — unique key, set as data-id on the button element
//   label  — what the user sees on the button
//   prompt — the instruction sent to OpenAI before the selected text
//
// To add a new action, simply add an object here — the button renders
// automatically in the toolbar.
// =============================================================================

const ACTIONS = [
  {
    id: 'summarize',
    label: '📝 Summarize',
    prompt: `You are an expert summarizer.
Condense the following text into exactly 2–3 sentences.
Capture the core message, key facts, and any conclusions.
Do NOT start with "This text…" or "The author…".
Return ONLY the summary — no headings, no bullet points, no preamble:`
  },

  {
    id: 'formal',
    label: '👔 Formal',
    prompt: `You are a professional writing editor.
Rewrite the following text in a polished, formal, and professional tone.
Preserve all original meaning and key details.
Use clear, sophisticated vocabulary — avoid slang, contractions, and casual phrasing.
Return ONLY the rewritten text:`
  },

  {
    id: 'casual',
    label: '😊 Casual',
    prompt: `You are a friendly writing assistant.
Rewrite the following text in a warm, casual, and conversational tone.
Use contractions, simple words, and a natural speaking rhythm.
Keep the original meaning intact but make it feel approachable and easy to read.
Return ONLY the rewritten text:`
  },

  {
    id: 'linkedin-post-reply',
    label: '🔗 LinkedIn Reply',
    prompt: `You are a LinkedIn engagement expert.
Write a thoughtful, professional yet personable reply to this LinkedIn post.
The reply should:
  - Acknowledge the poster's key point
  - Add a brief insight, personal perspective, or relevant experience
  - End with a question or call-to-action to encourage further conversation
  - Be 2–4 sentences long
  - Avoid generic phrases like "Great post!" or "Totally agree!"
Return ONLY the reply text:`
  },

  {
    id: 'grammar',
    label: '✅ Fix Grammar',
    prompt: `You are a meticulous proofreader and grammar expert.
Fix all grammar, spelling, punctuation, and syntax errors in the following text.
Do NOT change the tone, style, or meaning.
Do NOT add or remove content — only correct errors.
Return ONLY the corrected text with no explanations:`
  },

  {
    id: 'explain',
    label: '💡 Explain',
    prompt: `You are a patient, skilled teacher.
Explain the following text in simple, plain language that a non-expert can understand.
Break down any jargon, technical terms, or complex ideas.
Keep the explanation concise — aim for 3–5 sentences.
Return ONLY the explanation:`
  },

  {
    id: 'bullets',
    label: '• Bullets',
    prompt: `You are a content organizer.
Convert the following text into clear, concise bullet points.
Each bullet should capture one distinct idea or fact.
Use parallel structure and keep each bullet to one line.
Order bullets logically (chronological, most-to-least important, or grouped by topic).
Return ONLY the bullet-point list:`
  },

  {
    id: 'shorter',
    label: '✂️ Shorter',
    prompt: `You are a concise writing editor.
Shorten the following text to roughly half its length or less.
Preserve the core message and all critical details.
Remove filler words, redundancies, and non-essential qualifiers.
Return ONLY the shortened text:`
  },

  {
    id: 'translate',
    label: '🌐 To English',
    prompt: `You are an expert translator.
Translate the following text into clear, natural English.
Preserve the original tone and intent as closely as possible.
If the text is already in English, improve its clarity and fluency without changing the meaning.
Return ONLY the translated text:`
  },
];

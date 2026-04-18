// =============================================================================
// ACTION CATEGORIES — Loaded before content.js via manifest.json
//
// Each category appears as a tab in the toolbar.
// Each action within a category becomes a button under that tab.
//
// Structure:
//   id      — unique key for the category
//   label   — displayed on the tab
//   actions — array of { id, label, prompt }
//
// To add a new action: add an entry to the relevant category's actions array.
// To add a new category: add a new object to ACTION_CATEGORIES.
// =============================================================================

const ACTION_CATEGORIES = [

  // ---------------------------------------------------------------------------
  // ✏️ GENERAL — Text manipulation and rewriting
  // ---------------------------------------------------------------------------
  {
    id: 'general',
    label: '✏️ General',
    actions: [
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
        label: '🔗 LinkedIn',
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
        label: '✅ Grammar',
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
        label: '🌐 English',
        prompt: `You are an expert translator.
Translate the following text into clear, natural English.
Preserve the original tone and intent as closely as possible.
If the text is already in English, improve its clarity and fluency without changing the meaning.
Return ONLY the translated text:`
      },
    ]
  },

  // ---------------------------------------------------------------------------
  // 📖 LEARN — Understanding, exploring, and deepening knowledge
  // ---------------------------------------------------------------------------
  {
    id: 'learn',
    label: '📖 Learn',
    actions: [
      {
        id: 'eli5',
        label: '🧒 ELI5',
        prompt: `You are explaining to a curious 5-year-old.
Explain the following text/concept in the simplest possible language.
Use everyday analogies, short sentences, and zero jargon.
Make it fun and easy to remember.
Keep it to 3–4 sentences max.
Return ONLY the explanation:`
      },
      {
        id: 'key-concepts',
        label: '🧠 Key Concepts',
        prompt: `You are a study-guide creator.
Extract the key concepts, terms, and definitions from the following text.
Present each concept as:
  • **Term** — concise, one-line definition
List them in logical order (foundational concepts first).
Return ONLY the concept list:`
      },
      {
        id: 'deep-dive',
        label: '🔍 Deep Dive',
        prompt: `You are a knowledgeable tutor giving a detailed lesson.
Provide a thorough explanation of the following text/concept.
Include:
  - What it is and why it matters
  - How it works (with a concrete example)
  - Common misconceptions or pitfalls
Keep it structured and clear. Aim for 6–10 sentences.
Return ONLY the explanation:`
      },
      {
        id: 'analogy',
        label: '💭 Analogy',
        prompt: `You are a creative explainer who specializes in analogies.
Explain the following text/concept using a vivid, real-world analogy.
The analogy should make the concept instantly click for someone unfamiliar with it.
First state the analogy, then briefly explain how each part maps to the original concept.
Keep it to 3–5 sentences.
Return ONLY the analogy and mapping:`
      },
      {
        id: 'related-topics',
        label: '📚 Related Topics',
        prompt: `You are a learning advisor.
Based on the following text/concept, suggest 5–6 related topics the reader should explore next.
For each topic, provide:
  • **Topic Name** — one-line description of why it's relevant
Order them from most closely related to broader explorations.
Return ONLY the list of related topics:`
      },
      {
        id: 'roadmap',
        label: '🗺️ Roadmap',
        prompt: `You are a learning path designer.
Create a step-by-step learning roadmap for mastering the topic in the following text.
Include 5–8 milestones, ordered from beginner to advanced.
For each milestone:
  • **Step N: Topic** — what to learn and a suggested resource type (docs, tutorial, project)
Return ONLY the roadmap:`
      },
    ]
  },

  // ---------------------------------------------------------------------------
  // 🧩 DSA — Data Structures & Algorithms practice
  // ---------------------------------------------------------------------------
  {
    id: 'dsa',
    label: '🧩 DSA',
    actions: [
      {
        id: 'identify-pattern',
        label: '🔍 Pattern',
        prompt: `You are a competitive programming coach.
Analyze the following problem statement or code and identify the DSA pattern(s) involved.
Examples of patterns: Two Pointers, Sliding Window, BFS/DFS, Dynamic Programming, Binary Search, Greedy, Backtracking, etc.
Provide:
  1. The primary pattern name
  2. Why this pattern applies (1–2 sentences)
  3. Key data structure(s) to use
Return ONLY the analysis — no solution code:`
      },
      {
        id: 'pseudocode',
        label: '📝 Pseudocode',
        prompt: `You are an algorithm design expert.
Convert the following problem statement into clear, step-by-step pseudocode.
Use plain English with numbered steps.
Include edge case handling.
Do NOT write actual code — keep it language-agnostic.
Return ONLY the pseudocode:`
      },
      {
        id: 'complexity',
        label: '⏱️ Complexity',
        prompt: `You are an algorithm analysis expert.
Analyze the following code or algorithm and determine:
  • **Time Complexity**: Big-O notation with brief justification
  • **Space Complexity**: Big-O notation with brief justification
If optimizable, mention the optimal complexity achievable.
Return ONLY the complexity analysis:`
      },
      {
        id: 'alt-approaches',
        label: '🔄 Alternatives',
        prompt: `You are a problem-solving mentor.
For the following problem or code, suggest 2–3 alternative approaches.
For each approach:
  • **Approach Name** (e.g., Brute Force, Optimized, Optimal)
  • Time & Space complexity
  • One-line description of the idea
Order from simplest to most optimal.
Return ONLY the list of approaches — no full implementations:`
      },
      {
        id: 'debug-code',
        label: '🐛 Debug',
        prompt: `You are a meticulous code reviewer and debugger.
Analyze the following code and identify:
  1. Any bugs, logical errors, or off-by-one mistakes
  2. Edge cases that would cause failures
  3. The corrected version of the problematic lines
Explain each issue clearly in 1–2 sentences.
Return ONLY the bug analysis and fixes:`
      },
      {
        id: 'hints',
        label: '💡 Hints',
        prompt: `You are a patient problem-solving tutor.
Give 3 progressive hints for solving the following problem.
  • Hint 1: A gentle nudge — what to think about first
  • Hint 2: A stronger clue — suggest an approach or data structure
  • Hint 3: Nearly there — outline the key insight without giving the full solution
Do NOT provide the actual solution or code.
Return ONLY the 3 hints:`
      },
    ]
  },

  // ---------------------------------------------------------------------------
  // 🎯 QUIZ — Generate questions from selected text
  // ---------------------------------------------------------------------------
  {
    id: 'quiz',
    label: '🎯 Quiz',
    actions: [
      {
        id: 'mcq',
        label: '📋 MCQ',
        prompt: `You are a quiz master.
Generate exactly 5 multiple-choice questions from the following text.
Each question should have 4 options (A, B, C, D) with exactly one correct answer.
Format:
  **Q1.** Question text
  A) Option  B) Option  C) Option  D) Option
  ✅ Answer: X
Cover different parts of the text. Vary difficulty (easy → hard).
Return ONLY the questions:`
      },
      {
        id: 'short-answer',
        label: '✍️ Short Answer',
        prompt: `You are an exam question writer.
Generate 5 short-answer questions from the following text.
Each question should require a 1–2 sentence response.
Include the expected answer after each question.
Format:
  **Q1.** Question
  📝 Answer: Expected answer
Return ONLY the questions and answers:`
      },
      {
        id: 'true-false',
        label: '✅ True/False',
        prompt: `You are a quiz designer.
Generate 6 true/false statements based on the following text.
Mix true and false statements (roughly 50/50).
Make some tricky by using subtle wording.
Format:
  **1.** Statement — ✅ True / ❌ False
  Brief explanation why.
Return ONLY the statements with answers:`
      },
      {
        id: 'fill-blanks',
        label: '🔲 Fill Blanks',
        prompt: `You are an educational content creator.
Generate 5 fill-in-the-blank questions from the following text.
Replace a key term or concept with a blank (________).
Provide the answer after each question.
Format:
  **1.** Sentence with ________ in place of the key term.
  📝 Answer: Missing term
Return ONLY the questions and answers:`
      },
      {
        id: 'flashcards',
        label: '🧠 Flashcards',
        prompt: `You are a study aid creator.
Generate 6 flashcard pairs (question on front, answer on back) from the following text.
Each flashcard should test one specific concept or fact.
Format:
  **Card 1**
  Front: Question or term
  Back: Concise answer or definition
Keep answers brief — 1–2 sentences max.
Return ONLY the flashcards:`
      },
      {
        id: 'viva',
        label: '🎯 Viva Q&A',
        prompt: `You are an interview/viva examiner.
Generate 5 viva-style questions based on the following text.
Questions should:
  - Test conceptual understanding, not just memorization
  - Progress from basic to advanced
  - Include "why" and "how" questions, not just "what"
Include a model answer (2–3 sentences) for each.
Format:
  **Q1.** Question
  💬 Answer: Model answer
Return ONLY the questions and answers:`
      },
    ]
  },

];

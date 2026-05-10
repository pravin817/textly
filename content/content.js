// =============================================================================
// Injected into every webpage by Chrome.
// Responsibilities:
//   1. Watch for text selections and show the Textly toolbar nearby
//   2. Handle all toolbar UI interactions (tabs, action buttons, copy, back)
//   3. Enable drag-to-move on the toolbar via the drag handle
//   4. Send AI requests to background.js and display the results
//
// NOTE: ACTION_CATEGORIES is defined in actions.js, which is loaded before
// this file via manifest.json content_scripts configuration.
// =============================================================================

const MAX_TEXT_LENGTH = 10000; // Security: cap text sent to API

let toolbar = null;
let triggerBtn = null;
let hideTimer = null;
let activeTabId = "general";
let lastSelectionRect = null;

// DRAG STATE
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

// SELECTION STATE
let currentSelectedText = "";

// CONVERSATION STATE
let currentConversation = [];
let currentConvId = null; // tracks the active server-side conversation ID

// =============================================================================
// TRACKER — Sends events to the analytics server via background.js relay.
// All calls are fire-and-forget and never affect the UX.
// =============================================================================

const Tracker = {
  _send(endpoint, method, data) {
    chrome.runtime.sendMessage({ type: "TRACK_EVENT", endpoint, method, data });
  },

  startConversation(convId, actionId, selectedText) {
    this._send("/api/conversations", "POST", {
      id: convId,
      url: window.location.href,
      pageTitle: document.title,
      selectedText: selectedText.slice(0, 500), // cap context size
      actionId: actionId || "custom",
      createdAt: Date.now(),
    });
  },

  addMessage(convId, msgId, role, content, isInitial = false) {
    this._send(`/api/conversations/${convId}/messages`, "POST", {
      id: msgId,
      role,
      content: content.slice(0, 8000), // cap to avoid huge payloads
      isInitial,
      timestamp: Date.now(),
    });
  },

  setFeedback(msgId, feedback) {
    this._send(`/api/messages/${msgId}/feedback`, "PATCH", { feedback });
  },
};

function genId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// =============================================================================
// TRIGGER BUTTON CREATION
// =============================================================================

function createTriggerButton() {
  const btn = document.createElement("button");
  btn.id = "textai-trigger-btn";
  btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.5 2.5L13 9.5L20 11L13 12.5L11.5 19.5L10 12.5L3 11L10 9.5L11.5 2.5Z" fill="currentColor"/><path d="M19 15L19.6 17.4L22 18L19.6 18.6L19 21L18.4 18.6L16 18L18.4 17.4L19 15Z" fill="currentColor"/></svg>`;
  btn.title = "Open Textly";

  chrome.storage.sync.get("textly_theme", ({ textly_theme }) => {
    btn.dataset.theme = textly_theme || "dark";
  });

  btn.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    hideTriggerBtn();
    if (lastSelectionRect) {
      showToolbar(lastSelectionRect);
    }
  });

  document.body.appendChild(btn);
  return btn;
}

function showTriggerBtn(rect) {
  if (!triggerBtn) {
    triggerBtn = createTriggerButton();
  }
  lastSelectionRect = rect;

  let top = window.scrollY + rect.bottom + 8;
  let left = window.scrollX + rect.right - 14;

  triggerBtn.style.top = `${top}px`;
  triggerBtn.style.left = `${left}px`;
  triggerBtn.classList.add("textai-visible");
}

function hideTriggerBtn() {
  if (triggerBtn) {
    triggerBtn.classList.remove("textai-visible");
  }
}

// =============================================================================
// TOOLBAR CREATION
// =============================================================================

function createToolbar() {
  const toolbarElement = document.createElement("div");
  toolbarElement.id = "textai-toolbar";

  // Load saved theme
  chrome.storage.sync.get("textly_theme", ({ textly_theme }) => {
    toolbarElement.dataset.theme = textly_theme || "dark";
  });

  // Build tab buttons
  const tabsHTML = ACTION_CATEGORIES.map(
    (cat) =>
      `<button class="textai-tab ${cat.id === activeTabId ? "textai-tab-active" : ""}"
            data-tab="${cat.id}">${cat.label}</button>`,
  ).join("");

  // Build action buttons for the default category
  const defaultCategory = ACTION_CATEGORIES.find((c) => c.id === activeTabId);
  const actionsHTML = defaultCategory.actions
    .map(
      (a) => `<button class="textai-btn" data-id="${a.id}">${a.label}</button>`,
    )
    .join("");

  toolbarElement.innerHTML = `
    <!-- Drag handle + Theme/Action Toggles -->
    <div class="textai-drag-handle" id="textai-drag-handle">
      <div class="textai-drag-left">
        <span class="textai-drag-dots">⠿</span>
        <span class="textai-drag-label">Textly</span>
      </div>
      <div class="textai-drag-right">
        <button class="textai-settings-btn" id="textai-actions-toggle" title="Toggle Quick Actions">⚡</button>
        <button class="textai-settings-btn" id="textai-theme-toggle" title="Toggle theme">☀️</button>
        <button class="textai-settings-btn" id="textai-close-btn" title="Close">✖</button>
      </div>
    </div>

    <!-- Quick Actions (Hidden by default) -->
    <div id="textai-quick-actions" style="display: none;">
      <!-- Category tabs -->
      <div class="textai-tabs">${tabsHTML}</div>
      <!-- Action buttons -->
      <div class="textai-actions">${actionsHTML}</div>
    </div>

    <!-- Custom Chat Input -->
    <div class="textai-chat-box" id="textai-chat-box">
      <textarea id="textai-custom-prompt" placeholder="Ask anything about the text..." autocomplete="off" rows="1"></textarea>
      <button id="textai-custom-submit" title="Send">➤</button>
    </div>

    <!-- Result panel -->
    <div class="textai-result" style="display:none">
      <div class="textai-result-text" id="textai-chat-history"></div>
      <div class="textai-result-actions">
        <button class="textai-icon-btn" id="textai-back" title="Back to actions">← Back</button>
      </div>
      <!-- Follow-up input -->
      <div class="textai-followup-box">
        <textarea id="textai-followup-prompt" placeholder="Ask a follow-up..." autocomplete="off" rows="1"></textarea>
        <button id="textai-followup-submit" title="Send">➤</button>
      </div>
    </div>

    <!-- Loading indicator -->
    <div class="textai-loading" style="display:none">
      <span class="textai-spinner"></span> Thinking…
    </div>
  `;

  document.body.appendChild(toolbarElement);

  // Attach drag behaviour (exclude the settings button from drag)
  attachDragHandle(toolbarElement.querySelector("#textai-drag-handle"));

  return toolbarElement;
}

// =============================================================================
// TAB SWITCHING
// =============================================================================

function switchTab(tabId) {
  activeTabId = tabId;

  toolbar.querySelectorAll(".textai-tab").forEach((tab) => {
    if (tab.dataset.tab === tabId) {
      tab.classList.add("textai-tab-active");
    } else {
      tab.classList.remove("textai-tab-active");
    }
  });

  const category = ACTION_CATEGORIES.find((c) => c.id === tabId);
  const actionsContainer = toolbar.querySelector(".textai-actions");

  actionsContainer.innerHTML = category.actions
    .map(
      (a) => `<button class="textai-btn" data-id="${a.id}">${a.label}</button>`,
    )
    .join("");

  attachActionButtons();
}

function findAction(actionId) {
  for (const cat of ACTION_CATEGORIES) {
    const found = cat.actions.find((a) => a.id === actionId);
    if (found) {
      return found;
    }
  }
  return undefined;
}

// =============================================================================
// DRAG — Start / Move / Stop
// =============================================================================

function attachDragHandle(handle) {
  handle.addEventListener("mousedown", (e) => {
    // Don't start drag if clicking toggle buttons
    if (
      e.target.closest("#textai-theme-toggle") ||
      e.target.closest("#textai-actions-toggle") ||
      e.target.closest("#textai-close-btn")
    ) {
      return;
    }
    startDrag(e);
  });
}

function startDrag(e) {
  e.preventDefault();
  isDragging = true;

  const rect = toolbar.getBoundingClientRect();
  dragOffsetX = e.clientX - rect.left;
  dragOffsetY = e.clientY - rect.top;

  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", stopDrag);
}

function onDrag(e) {
  if (!isDragging) {
    return;
  }

  let newLeft = e.clientX - dragOffsetX;
  let newTop = e.clientY - dragOffsetY;

  const maxLeft = window.innerWidth - toolbar.offsetWidth;
  const maxTop = window.innerHeight - toolbar.offsetHeight;
  newLeft = Math.max(0, Math.min(newLeft, maxLeft));
  newTop = Math.max(0, Math.min(newTop, maxTop));

  toolbar.style.left = newLeft + window.scrollX + "px";
  toolbar.style.top = newTop + window.scrollY + "px";
}

function stopDrag() {
  isDragging = false;
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
}

// =============================================================================
// TOOLBAR POSITIONING & VISIBILITY
// =============================================================================

function positionToolbar(rect) {
  const tbWidth = 380;
  let top = window.scrollY + rect.bottom + 8;
  let left = window.scrollX + rect.left;

  if (left + tbWidth > window.innerWidth + window.scrollX) {
    left = window.scrollX + window.innerWidth - tbWidth - 12;
  }

  if (left < window.scrollX + 8) {
    left = window.scrollX + 8;
  }

  toolbar.style.top = `${top}px`;
  toolbar.style.left = `${left}px`;
}

function showToolbar(rect) {
  clearTimeout(hideTimer);
  if (!toolbar) {
    toolbar = createToolbar();
  }
  resetToolbar();
  positionToolbar(rect);
  toolbar.classList.add("textai-visible");
  attachHandlers();
}

function hideToolbar() {
  if (toolbar) {
    toolbar.classList.remove("textai-visible");
  }
}

function resetToolbar() {
  const quickActions = toolbar.querySelector("#textai-quick-actions");
  if (quickActions) {
    // Retain its display state (hidden or visible)
    quickActions.style.display = quickActions.style.display;
  }

  toolbar.querySelector(".textai-chat-box").style.display = "flex";
  toolbar.querySelector(".textai-result").style.display = "none";
  toolbar.querySelector(".textai-loading").style.display = "none";

  // Clear the input and focus it
  const input = toolbar.querySelector("#textai-custom-prompt");
  if (input) {
    input.value = "";
    input.style.height = "auto";
    setTimeout(() => input.focus(), 50);
  }

  const historyContainer = toolbar.querySelector("#textai-chat-history");
  if (historyContainer) {
    historyContainer.innerHTML = "";
  }
  const followupInput = toolbar.querySelector("#textai-followup-prompt");
  if (followupInput) {
    followupInput.value = "";
    followupInput.style.height = "auto";
  }
}

// =============================================================================
// BUTTON HANDLERS
// =============================================================================

function attachActionButtons() {
  toolbar.querySelectorAll(".textai-btn").forEach((btn) => {
    btn.onclick = () => {
      const action = findAction(btn.dataset.id);
      let text = currentSelectedText;

      if (!action || !text) {
        return;
      }

      // Security: block request if text is too long
      if (text.length > MAX_TEXT_LENGTH) {
        showWarning(
          `⚠️ Text too long (${text.length.toLocaleString()} chars). Max ${MAX_TEXT_LENGTH.toLocaleString()} allowed.`,
        );
        return;
      }

      runAction(action, text);
    };
  });
}

function attachHandlers() {
  // Tab buttons
  toolbar.querySelectorAll(".textai-tab").forEach((tab) => {
    tab.onclick = () => switchTab(tab.dataset.tab);
  });

  // Action buttons
  attachActionButtons();

  // Theme toggle button
  const themeBtn = toolbar.querySelector("#textai-theme-toggle");
  const currentTheme = toolbar.dataset.theme || "dark";
  themeBtn.textContent = currentTheme === "dark" ? "☀️" : "🌙";

  themeBtn.onclick = (e) => {
    e.stopPropagation(); // prevent drag
    const current = toolbar.dataset.theme || "dark";
    const next = current === "dark" ? "light" : "dark";
    toolbar.dataset.theme = next;
    if (triggerBtn) triggerBtn.dataset.theme = next;
    themeBtn.textContent = next === "dark" ? "☀️" : "🌙";
    chrome.storage.sync.set({ textly_theme: next });
  };

  // Actions toggle button
  const actionsToggleBtn = toolbar.querySelector("#textai-actions-toggle");
  const quickActionsContainer = toolbar.querySelector("#textai-quick-actions");

  actionsToggleBtn.onclick = (e) => {
    e.stopPropagation();
    if (quickActionsContainer.style.display === "none") {
      quickActionsContainer.style.display = "block";
      actionsToggleBtn.classList.add("active");
    } else {
      quickActionsContainer.style.display = "none";
      actionsToggleBtn.classList.remove("active");
    }
  };

  // Close button
  toolbar.querySelector("#textai-close-btn").onclick = (e) => {
    e.stopPropagation();
    hideToolbar();
  };

  // Custom chat input handling
  const chatInput = toolbar.querySelector("#textai-custom-prompt");
  const chatSubmit = toolbar.querySelector("#textai-custom-submit");

  const submitCustomPrompt = () => {
    const prompt = chatInput.value.trim();
    const text = currentSelectedText;

    if (!prompt || !text) return;
    if (text.length > MAX_TEXT_LENGTH) {
      showWarning(
        `⚠️ Text too long (${text.length.toLocaleString()} chars). Max ${MAX_TEXT_LENGTH.toLocaleString()} allowed.`,
      );
      return;
    }

    runAction({ prompt }, text);
  };

  chatSubmit.onclick = submitCustomPrompt;
  chatInput.onkeydown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitCustomPrompt();
    }
  };
  chatInput.oninput = () => {
    chatInput.style.height = "auto";
    chatInput.style.height = chatInput.scrollHeight + "px";
  };

  // Follow-up chat input handling
  const followupInput = toolbar.querySelector("#textai-followup-prompt");
  const followupSubmit = toolbar.querySelector("#textai-followup-submit");

  const submitFollowup = () => {
    const prompt = followupInput.value.trim();
    if (!prompt) return;

    const followupMsgId = genId("msg");
    currentConversation.push({
      role: "user",
      content: prompt,
      _msgId: followupMsgId,
    });
    if (currentConvId)
      Tracker.addMessage(currentConvId, followupMsgId, "user", prompt);
    runFollowup();
  };

  followupSubmit.onclick = submitFollowup;
  followupInput.onkeydown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitFollowup();
    }
  };
  followupInput.oninput = () => {
    followupInput.style.height = "auto";
    followupInput.style.height = followupInput.scrollHeight + "px";
  };

  // Back button
  toolbar.querySelector("#textai-back").onclick = resetToolbar;
}

// =============================================================================
// WARNING TOAST
// =============================================================================

function showWarning(message) {
  // Remove existing warning if any
  const existing = toolbar.querySelector(".textai-warning");
  if (existing) existing.remove();

  const warning = document.createElement("div");
  warning.className = "textai-warning";
  warning.textContent = message;
  toolbar.querySelector(".textai-actions").before(warning);

  setTimeout(() => warning.remove(), 3000);
}

// =============================================================================
// AI REQUEST
// =============================================================================

function createInitialMessageUI(msg) {
  const fragment = document.createDocumentFragment();

  const details = document.createElement("details");
  details.className = "textai-chat-context-details";

  const summary = document.createElement("summary");
  summary.textContent = "📄 Context";

  const contextText = document.createElement("div");
  contextText.className = "textai-chat-context-text";
  contextText.textContent = msg.context;

  details.appendChild(summary);
  details.appendChild(contextText);

  const divider = document.createElement("div");
  divider.className = "textai-chat-divider";

  const question = document.createElement("div");
  question.className = "textai-chat-question";
  question.textContent = msg.prompt;

  fragment.appendChild(details);
  fragment.appendChild(divider);
  fragment.appendChild(question);

  return fragment;
}

function createAssistantMessageUI(msg) {
  const wrapper = document.createElement("div");
  wrapper.style.marginBottom = "8px";

  const msgDiv = document.createElement("div");
  msgDiv.className = "textai-chat-msg textai-chat-assistant";
  msgDiv.style.marginBottom = "4px"; // tighter spacing to actions
  msgDiv.textContent = msg.content;
  wrapper.appendChild(msgDiv);

  const actionsDiv = document.createElement("div");
  actionsDiv.className = "textai-msg-actions";
  actionsDiv.style.marginTop = "0"; // override default margin

  const copyBtn = document.createElement("button");
  copyBtn.className = "textai-msg-action-btn";
  copyBtn.innerHTML = "📋";
  copyBtn.title = "Copy";
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(msg.content);
    copyBtn.innerHTML = "✅";
    setTimeout(() => (copyBtn.innerHTML = "📋"), 1500);
  };

  const likeBtn = document.createElement("button");
  likeBtn.className = "textai-msg-action-btn";
  likeBtn.innerHTML = "👍";
  likeBtn.title = "Like";

  const dislikeBtn = document.createElement("button");
  dislikeBtn.className = "textai-msg-action-btn";
  dislikeBtn.innerHTML = "👎";
  dislikeBtn.title = "Dislike";

  likeBtn.onclick = () => {
    const wasActive = likeBtn.classList.contains("active");
    likeBtn.classList.toggle("active");
    dislikeBtn.classList.remove("active");
    const newFeedback = wasActive ? null : "like";
    if (msg._msgId) Tracker.setFeedback(msg._msgId, newFeedback);
  };

  dislikeBtn.onclick = () => {
    const wasActive = dislikeBtn.classList.contains("active");
    dislikeBtn.classList.toggle("active");
    likeBtn.classList.remove("active");
    const newFeedback = wasActive ? null : "dislike";
    if (msg._msgId) Tracker.setFeedback(msg._msgId, newFeedback);
  };

  actionsDiv.appendChild(copyBtn);
  actionsDiv.appendChild(likeBtn);
  actionsDiv.appendChild(dislikeBtn);

  wrapper.appendChild(actionsDiv);

  return wrapper;
}

function renderChatHistory() {
  const historyContainer = toolbar.querySelector("#textai-chat-history");
  historyContainer.innerHTML = "";

  currentConversation.forEach((msg) => {
    if (msg.role === "system") return;

    if (msg.isInitial) {
      const wrapper = document.createElement("div");
      wrapper.className = `textai-chat-msg textai-chat-${msg.role}`;
      wrapper.appendChild(createInitialMessageUI(msg));
      historyContainer.appendChild(wrapper);
    } else if (msg.role === "assistant") {
      // createAssistantMessageUI now returns a fully constructed message bubble + actions below it
      historyContainer.appendChild(createAssistantMessageUI(msg));
    } else {
      const msgDiv = document.createElement("div");
      msgDiv.className = `textai-chat-msg textai-chat-${msg.role}`;
      msgDiv.textContent = msg.content;
      historyContainer.appendChild(msgDiv);
    }
  });

  historyContainer.scrollTop = historyContainer.scrollHeight;
}

function runAction(action, text) {
  toolbar.querySelector("#textai-quick-actions").style.display = "none";
  toolbar.querySelector(".textai-chat-box").style.display = "none";
  toolbar.querySelector(".textai-loading").style.display = "flex";

  const prompt = action.prompt || action;
  const actionId = action.id || "custom";

  // Create a new server-side conversation record
  currentConvId = genId("conv");
  Tracker.startConversation(currentConvId, actionId, text);

  const userMsgId = genId("msg");
  const userContent = `Query/Instructions:\n${prompt}\n\nContext (Selected Text):\n"""\n${text}\n"""`;

  currentConversation = [
    {
      role: "user",
      content: userContent,
      isInitial: true,
      prompt,
      context: text,
      _msgId: userMsgId,
    },
  ];

  Tracker.addMessage(currentConvId, userMsgId, "user", userContent, true);

  sendAIRequest();
}

function runFollowup() {
  toolbar.querySelector(".textai-loading").style.display = "flex";

  const followupInput = toolbar.querySelector("#textai-followup-prompt");
  if (followupInput) {
    followupInput.value = "";
    followupInput.style.height = "auto";
    followupInput.disabled = true;
  }
  const followupSubmit = toolbar.querySelector("#textai-followup-submit");
  if (followupSubmit) followupSubmit.disabled = true;

  renderChatHistory();

  sendAIRequest();
}

function sendAIRequest() {
  const safeMessages = currentConversation.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  chrome.runtime.sendMessage(
    { type: "AI_REQUEST", messages: safeMessages },
    (response) => {
      toolbar.querySelector(".textai-loading").style.display = "none";

      const resultEl = toolbar.querySelector(".textai-result");

      if (response?.error) {
        const errContent = "⚠️ " + response.error;
        const errMsgId = genId("msg");
        currentConversation.push({
          role: "assistant",
          content: errContent,
          _msgId: errMsgId,
        });
        if (currentConvId)
          Tracker.addMessage(currentConvId, errMsgId, "assistant", errContent);
      } else {
        const resultText = response?.result ?? "—";
        const asstMsgId = genId("msg");
        currentConversation.push({
          role: "assistant",
          content: resultText,
          _msgId: asstMsgId,
        });
        if (currentConvId)
          Tracker.addMessage(currentConvId, asstMsgId, "assistant", resultText);
      }

      renderChatHistory();

      const followupInput = toolbar.querySelector("#textai-followup-prompt");
      if (followupInput) {
        followupInput.disabled = false;
        setTimeout(() => followupInput.focus(), 50);
      }
      const followupSubmit = toolbar.querySelector("#textai-followup-submit");
      if (followupSubmit) followupSubmit.disabled = false;

      resultEl.style.display = "flex";
    },
  );
}

// =============================================================================
// THEME SYNC — Listen for theme changes from popup
// =============================================================================

chrome.storage.onChanged.addListener((changes) => {
  if (changes.textly_theme) {
    if (toolbar)
      toolbar.dataset.theme = changes.textly_theme.newValue || "dark";
    if (triggerBtn)
      triggerBtn.dataset.theme = changes.textly_theme.newValue || "dark";
  }
});

// =============================================================================
// TEXT SELECTION LISTENERS
// =============================================================================

document.addEventListener("mouseup", (e) => {
  if (toolbar && toolbar.contains(e.target)) {
    return;
  }
  if (triggerBtn && triggerBtn.contains(e.target)) {
    return;
  }

  setTimeout(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? "";

    if (text.length > 10) {
      if (!toolbar || !toolbar.classList.contains("textai-visible")) {
        currentSelectedText = text;
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        showTriggerBtn(rect);
      } else {
        currentSelectedText = text;
      }
    } else {
      hideTriggerBtn();
    }
  }, 10);
});

document.addEventListener("mousedown", (e) => {
  if (
    triggerBtn &&
    !triggerBtn.contains(e.target) &&
    (!toolbar || !toolbar.contains(e.target))
  ) {
    hideTriggerBtn();
  }
});

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


let toolbar = null;
let hideTimer = null;
let activeTabId = 'general'; // default to General tab


// -----------------------------------------------------------------------------
// DRAG STATE
// -----------------------------------------------------------------------------
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;


// =============================================================================
// TOOLBAR CREATION
// =============================================================================

function createToolbar() {
  const toolbarElement = document.createElement('div');
  toolbarElement.id = 'textai-toolbar';

  // Build tab buttons
  const tabsHTML = ACTION_CATEGORIES.map(cat =>
    `<button class="textai-tab ${cat.id === activeTabId ? 'textai-tab-active' : ''}"
            data-tab="${cat.id}">${cat.label}</button>`
  ).join('');

  // Build action buttons for the default (first) category
  const defaultCategory = ACTION_CATEGORIES.find(c => c.id === activeTabId);
  const actionsHTML = defaultCategory.actions.map(a =>
    `<button class="textai-btn" data-id="${a.id}">${a.label}</button>`
  ).join('');

  toolbarElement.innerHTML = `
    <!-- Drag handle -->
    <div class="textai-drag-handle" id="textai-drag-handle">
      <span class="textai-drag-dots">⠿</span>
      <span class="textai-drag-label">Textly</span>
      <span class="textai-drag-dots">⠿</span>
    </div>

    <!-- Category tabs -->
    <div class="textai-tabs">${tabsHTML}</div>

    <!-- Action buttons — change based on active tab -->
    <div class="textai-actions">${actionsHTML}</div>

    <!-- Result panel — hidden until an action completes -->
    <div class="textai-result" style="display:none">
      <div class="textai-result-text"></div>
      <div class="textai-result-actions">
        <button class="textai-icon-btn" id="textai-copy" title="Copy result">📋 Copy</button>
        <button class="textai-icon-btn" id="textai-back" title="Back to actions">← Back</button>
      </div>
    </div>

    <!-- Loading indicator -->
    <div class="textai-loading" style="display:none">
      <span class="textai-spinner"></span> Thinking…
    </div>
  `;

  document.body.appendChild(toolbarElement);

  // Attach drag behaviour
  attachDragHandle(toolbarElement.querySelector('#textai-drag-handle'));

  return toolbarElement;
}


// =============================================================================
// TAB SWITCHING
// =============================================================================

/**
 * Switches the active tab and re-renders the action buttons for that category.
 * @param {string} tabId — the category id to switch to
 */
function switchTab(tabId) {
  activeTabId = tabId;

  // Update tab active states
  toolbar.querySelectorAll('.textai-tab').forEach(tab => {
    if (tab.dataset.tab === tabId) {
      tab.classList.add('textai-tab-active');
    } else {
      tab.classList.remove('textai-tab-active');
    }
  });

  // Re-render action buttons for the selected category
  const category = ACTION_CATEGORIES.find(c => c.id === tabId);
  const actionsContainer = toolbar.querySelector('.textai-actions');

  actionsContainer.innerHTML = category.actions.map(a =>
    `<button class="textai-btn" data-id="${a.id}">${a.label}</button>`
  ).join('');

  // Re-attach click handlers to the new buttons
  attachActionButtons();
}


/**
 * Returns the action object matching the given id, searching across ALL categories.
 * @param {string} actionId
 * @returns {object|undefined}
 */
function findAction(actionId) {
  for (const cat of ACTION_CATEGORIES) {
    const found = cat.actions.find(a => a.id === actionId);
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
  handle.addEventListener('mousedown', startDrag);
}

function startDrag(e) {
  e.preventDefault();
  isDragging = true;

  const rect = toolbar.getBoundingClientRect();
  dragOffsetX = e.clientX - rect.left;
  dragOffsetY = e.clientY - rect.top;

  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
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

  toolbar.style.left = (newLeft + window.scrollX) + 'px';
  toolbar.style.top = (newTop + window.scrollY) + 'px';
}

function stopDrag() {
  isDragging = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
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
  toolbar.classList.add('textai-visible');
  attachHandlers();
}

// Function used to hide the toolbar
function hideToolbar() {
  if (toolbar) {
    toolbar.classList.remove('textai-visible');
  }
}

// Function used to reset the toolbar — shows tabs + action buttons, hides result/loading
function resetToolbar() {
  toolbar.querySelector('.textai-tabs').style.display = 'flex';
  toolbar.querySelector('.textai-actions').style.display = 'flex';
  toolbar.querySelector('.textai-result').style.display = 'none';
  toolbar.querySelector('.textai-loading').style.display = 'none';
}


// =============================================================================
// BUTTON HANDLERS
// =============================================================================

/**
 * Attaches click handlers to the action buttons in the current tab.
 */
function attachActionButtons() {
  toolbar.querySelectorAll('.textai-btn').forEach(btn => {
    btn.onclick = () => {
      const action = findAction(btn.dataset.id);
      const text = window.getSelection().toString().trim();
      if (!action || !text) {
        return;
      }
      runAction(action, text);
    };
  });
}

/**
 * Attaches all handlers: tabs, action buttons, copy, back.
 */
function attachHandlers() {
  // Tab buttons
  toolbar.querySelectorAll('.textai-tab').forEach(tab => {
    tab.onclick = () => switchTab(tab.dataset.tab);
  });

  // Action buttons
  attachActionButtons();

  // Copy button
  document.getElementById('textai-copy').onclick = () => {
    const resultText = toolbar.querySelector('.textai-result-text').innerText;
    navigator.clipboard.writeText(resultText);

    const copyBtn = document.getElementById('textai-copy');
    copyBtn.textContent = '✅ Copied!';
    setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 1500);
  };

  // Back button — returns to tabs + action buttons
  document.getElementById('textai-back').onclick = resetToolbar;
}


// =============================================================================
// AI REQUEST
// =============================================================================

function runAction(action, text) {
  // Switch to loading state — hide tabs and buttons
  toolbar.querySelector('.textai-tabs').style.display = 'none';
  toolbar.querySelector('.textai-actions').style.display = 'none';
  toolbar.querySelector('.textai-loading').style.display = 'flex';

  chrome.runtime.sendMessage(
    { type: 'AI_REQUEST', prompt: action.prompt, text },
    (response) => {
      toolbar.querySelector('.textai-loading').style.display = 'none';

      const resultEl = toolbar.querySelector('.textai-result');
      const textEl = toolbar.querySelector('.textai-result-text');

      if (response?.error) {
        textEl.innerHTML = `<span style="color:#f87171">⚠️ ${response.error}</span>`;
      } else {
        textEl.innerText = response?.result ?? '—';
      }

      resultEl.style.display = 'flex';
    }
  );
}


// =============================================================================
// TEXT SELECTION LISTENERS
// =============================================================================

document.addEventListener('mouseup', (e) => {
  if (toolbar && toolbar.contains(e.target)) {
    return;
  }

  setTimeout(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? '';

    if (text.length > 10) {
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      showToolbar(rect);
    } else {
      hideTimer = setTimeout(hideToolbar, 200);
    }
  }, 10);
});

document.addEventListener('mousedown', (e) => {
  if (toolbar && !toolbar.contains(e.target)) {
    hideTimer = setTimeout(hideToolbar, 150);
  }
});
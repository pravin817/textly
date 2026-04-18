// =============================================================================
// Injected into every webpage by Chrome.
// Responsibilities:
//   1. Watch for text selections and show the Textly toolbar nearby
//   2. Handle all toolbar UI interactions (action buttons, copy, back)
//   3. Enable drag-to-move on the toolbar via the drag handle
//   4. Send AI requests to background.js and display the results
//
// NOTE: The ACTIONS array is defined in actions.js, which is loaded before
// this file via manifest.json content_scripts configuration.
// =============================================================================



let toolbar = null;
let hideTimer = null;


// -----------------------------------------------------------------------------
// DRAG STATE
//
// isDragging  — guards the mousemove handler so it only runs during an active drag
// dragOffsetX — horizontal distance (px) between the cursor and the toolbar's
//               left edge at the moment the drag started
// dragOffsetY — vertical distance (px) between the cursor and the toolbar's
//               top edge at the moment the drag started
//
// Why track an offset instead of just using the raw cursor position?
// If we set toolbar.style.left = cursor.x directly, the toolbar's top-left
// corner would snap to the cursor the instant the drag begins — jarring.
// Subtracting the offset on every mousemove keeps the grab point stable
// so the toolbar moves with the cursor naturally.
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

  toolbarElement.innerHTML = `
    <!-- Drag handle — user grabs this bar to reposition the toolbar anywhere on the page -->
    <div class="textai-drag-handle" id="textai-drag-handle">
      <span class="textai-drag-dots">⠿</span>
      <span class="textai-drag-label">Textly</span>
      <span class="textai-drag-dots">⠿</span>
    </div>

    <!-- Action buttons — one per entry in the ACTIONS array -->
    <div class="textai-actions">
      ${ACTIONS.map(a =>
    `<button class="textai-btn" data-id="${a.id}">${a.label}</button>`
  ).join('')}
    </div>

    <!-- Result panel — hidden until an action completes -->
    <div class="textai-result" style="display:none">
      <div class="textai-result-text"></div>
      <div class="textai-result-actions">
        <button class="textai-icon-btn" id="textai-copy" title="Copy result">📋 Copy</button>
        <button class="textai-icon-btn" id="textai-back" title="Back to actions">← Back</button>
      </div>
    </div>

    <!-- Loading indicator — shown while waiting for the OpenAI response -->
    <div class="textai-loading" style="display:none">
      <span class="textai-spinner"></span> Thinking…
    </div>
  `;

  document.body.appendChild(toolbarElement);

  // Attach drag behaviour to the handle now that it exists in the DOM
  attachDragHandle(toolbarElement.querySelector('#textai-drag-handle'));

  return toolbarElement;
}


// =============================================================================
// DRAG — Start / Move / Stop
// =============================================================================

/**
 * Registers the mousedown listener on the drag handle.
 * Only mousedown lives here — mousemove and mouseup are added to `document`
 * inside startDrag so they keep firing even when the cursor moves outside the
 * toolbar boundaries during a fast drag.
 *
 * @param {HTMLElement} handle - The drag handle element
 */
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

  // Convert cursor viewport position → toolbar corner viewport position
  let newLeft = e.clientX - dragOffsetX;
  let newTop = e.clientY - dragOffsetY;

  // Clamp: prevent the toolbar from being dragged outside the viewport
  const maxLeft = window.innerWidth - toolbar.offsetWidth;
  const maxTop = window.innerHeight - toolbar.offsetHeight;
  newLeft = Math.max(0, Math.min(newLeft, maxLeft));
  newTop = Math.max(0, Math.min(newTop, maxTop));

  // The toolbar uses position:absolute, so its top/left are relative to the
  // document — add scroll offsets to convert from viewport to document space.
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
  const tbWidth = 340;
  let top = window.scrollY + rect.bottom + 8;  // 8px gap below the selection
  let left = window.scrollX + rect.left;

  // Push left if the toolbar would overflow the right edge of the viewport
  if (left + tbWidth > window.innerWidth + window.scrollX)
    left = window.scrollX + window.innerWidth - tbWidth - 12;

  // Push right if the toolbar would overflow the left edge
  if (left < window.scrollX + 8)
    left = window.scrollX + 8;

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

// Function used to reset the toolbar
function resetToolbar() {
  toolbar.querySelector('.textai-actions').style.display = 'flex';
  toolbar.querySelector('.textai-result').style.display = 'none';
  toolbar.querySelector('.textai-loading').style.display = 'none';
}


// =============================================================================
// BUTTON HANDLERS
// =============================================================================


function attachHandlers() {
  // Action buttons — find the matching ACTIONS entry and run it
  toolbar.querySelectorAll('.textai-btn').forEach(btn => {
    btn.onclick = () => {
      const action = ACTIONS.find(a => a.id === btn.dataset.id);
      const text = window.getSelection().toString().trim();
      if (!action || !text) {
        return;
      }
      runAction(action, text);
    };
  });

  // Copy button — writes the result text to the clipboard
  document.getElementById('textai-copy').onclick = () => {
    const resultText = toolbar.querySelector('.textai-result-text').innerText;
    navigator.clipboard.writeText(resultText);

    // Briefly swap the label to give the user visual feedback
    const copyBtn = document.getElementById('textai-copy');
    copyBtn.textContent = '✅ Copied!';
    setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 1500);
  };

  // Back button — returns to the action buttons without closing the toolbar
  document.getElementById('textai-back').onclick = resetToolbar;
}


// =============================================================================
// AI REQUEST
// =============================================================================

function runAction(action, text) {
  // Switch the toolbar to loading state
  toolbar.querySelector('.textai-actions').style.display = 'none';
  toolbar.querySelector('.textai-loading').style.display = 'flex';

  chrome.runtime.sendMessage(
    { type: 'AI_REQUEST', prompt: action.prompt, text },
    (response) => {
      // Hide the loading indicator regardless of success or failure
      toolbar.querySelector('.textai-loading').style.display = 'none';

      const resultEl = toolbar.querySelector('.textai-result');
      const textEl = toolbar.querySelector('.textai-result-text');

      if (response?.error) {
        // Show the error inline — user can still go Back and try another action
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
  // Never react to clicks inside the toolbar itself
  if (toolbar && toolbar.contains(e.target)) {
    return;
  }

  setTimeout(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? '';

    if (text.length > 10) {
      // Valid selection — show the toolbar near it
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      showToolbar(rect);
    } else {
      // Clicked away with nothing selected — schedule a hide
      hideTimer = setTimeout(hideToolbar, 200);
    }
  }, 10);
});

document.addEventListener('mousedown', (e) => {
  if (toolbar && !toolbar.contains(e.target)) {
    hideTimer = setTimeout(hideToolbar, 150);
  }
});
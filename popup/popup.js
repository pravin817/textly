// =============================================================================
// Popup Script — API Key Management + Theme Toggle
// =============================================================================

const apiKeyInput = document.getElementById("api-key");
const saveBtn = document.getElementById("save-btn");
const statusMsg = document.getElementById("status-msg");
const keyStatus = document.getElementById("key-status");
const toggleBtn = document.getElementById("toggle-visibility");
const eyeIcon = document.getElementById("eye-icon");
const openOptionsLink = document.getElementById("open-options");
const themeToggleBtn = document.getElementById("theme-toggle");

// -----------------------------------------------------------------------------
// On Load — Check API key + Load theme
// -----------------------------------------------------------------------------
chrome.storage.sync.get(["openai_key", "textly_theme"], (data) => {
  // API key
  if (data.openai_key) {
    apiKeyInput.value = data.openai_key;
    keyStatus.textContent = "✓ Active";
    keyStatus.className = "key-status saved";
  } else {
    keyStatus.textContent = "⚠ Not set";
    keyStatus.className = "key-status missing";
  }

  // Theme (default: dark)
  const theme = data.textly_theme || "dark";
  applyTheme(theme);
});

// -----------------------------------------------------------------------------
// Theme Toggle
// -----------------------------------------------------------------------------
themeToggleBtn.addEventListener("click", () => {
  const current = document.body.dataset.theme || "dark";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  chrome.storage.sync.set({ textly_theme: next });
});

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  themeToggleBtn.textContent = theme === "dark" ? "☀️" : "🌙";
  themeToggleBtn.title =
    theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
}

// -----------------------------------------------------------------------------
// Save Key
// -----------------------------------------------------------------------------
saveBtn.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();

  if (!key) {
    showStatus("Please enter your API key.", "error");
    return;
  }

  if (!key.startsWith("sk-")) {
    showStatus("⚠️ Key should start with sk-", "error");
    return;
  }

  chrome.storage.sync.set({ openai_key: key }, () => {
    showStatus("✅ Key saved successfully!", "success");
    keyStatus.textContent = "✓ Active";
    keyStatus.className = "key-status saved";
  });
});

// -----------------------------------------------------------------------------
// Toggle Key Visibility
// -----------------------------------------------------------------------------
toggleBtn.addEventListener("click", () => {
  if (apiKeyInput.type === "password") {
    apiKeyInput.type = "text";
    eyeIcon.textContent = "🙈";
  } else {
    apiKeyInput.type = "password";
    eyeIcon.textContent = "👁️";
  }
});

// -----------------------------------------------------------------------------
// Open Full Options Page
// -----------------------------------------------------------------------------
openOptionsLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// -----------------------------------------------------------------------------
// Status Message Helper
// -----------------------------------------------------------------------------
function showStatus(message, type) {
  statusMsg.textContent = message;
  statusMsg.style.color = type === "error" ? "#f87168" : "#4bce97";
  setTimeout(() => {
    statusMsg.textContent = "";
  }, 3000);
}

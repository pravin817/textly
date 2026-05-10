// ─── Elements ─────────────────────────────────────────────────────────────────
const keyInput = document.getElementById("key");
const saveBtn = document.getElementById("save");
const statusEl = document.getElementById("status");

const serverUrlInput = document.getElementById("server-url");
const testServerBtn = document.getElementById("test-server");
const serverStatusEl = document.getElementById("server-status");
const dashboardLink = document.getElementById("dashboard-link");

// Sign-in form
const signinSection = document.getElementById("signin-section");
const signinEmail = document.getElementById("signin-email");
const signinPassword = document.getElementById("signin-password");
const signinBtn = document.getElementById("signin-btn");

// Signed-in info
const signedInSection = document.getElementById("signedIn-section");
const signedInEmail = document.getElementById("signed-in-email");
const signedInRole = document.getElementById("signed-in-role");
const openDashBtn = document.getElementById("open-dashboard");
const signoutBtn = document.getElementById("signout-btn");

// ─── Load saved values ────────────────────────────────────────────────────────
chrome.storage.sync.get(
  [
    "openai_key",
    "textly_server_url",
    "textly_api_token",
    "textly_user_email",
    "textly_user_role",
  ],
  ({
    openai_key,
    textly_server_url,
    textly_api_token,
    textly_user_email,
    textly_user_role,
  }) => {
    if (openai_key) keyInput.value = openai_key;
    if (textly_server_url) {
      serverUrlInput.value = textly_server_url;
      updateDashboardLink(textly_server_url);
    }

    // Restore signed-in state
    if (textly_api_token && textly_user_email) {
      showSignedIn(textly_user_email, textly_user_role || "user");
    } else {
      showSignedOut();
    }
  },
);

// ─── Save OpenAI key ──────────────────────────────────────────────────────────
saveBtn.addEventListener("click", () => {
  const key = keyInput.value.trim();
  if (!key.startsWith("sk-")) {
    showStatus(statusEl, "⚠️ Key should start with sk-", "error");
    return;
  }
  chrome.storage.sync.set({ openai_key: key }, () => {
    showStatus(statusEl, "✅ API key saved!", "success");
  });
});

// ─── Update server URL + dashboard link ───────────────────────────────────────
serverUrlInput.addEventListener("input", () => {
  updateDashboardLink(serverUrlInput.value.trim());
});

function updateDashboardLink(url) {
  const clean = url.trim().replace(/\/$/, "");
  if (clean) {
    dashboardLink.href = clean;
    dashboardLink.textContent = clean;
  } else {
    dashboardLink.href = "#";
    dashboardLink.textContent = "—";
  }
}

// ─── Sign In ──────────────────────────────────────────────────────────────────
signinBtn.addEventListener("click", async () => {
  const url = serverUrlInput.value.trim().replace(/\/$/, "");
  const email = signinEmail.value.trim();
  const password = signinPassword.value;

  if (!url) {
    showStatus(serverStatusEl, "⚠️ Enter a server URL first", "error");
    return;
  }
  if (!email || !password) {
    showStatus(serverStatusEl, "⚠️ Enter your email and password", "error");
    return;
  }

  signinBtn.textContent = "Signing in…";
  signinBtn.disabled = true;

  try {
    const res = await fetch(`${url}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Server returned ${res.status}`);
    }

    const { apiToken, user } = await res.json();

    if (!apiToken) throw new Error("Server did not return an API token");

    // Save everything
    await new Promise((resolve) =>
      chrome.storage.sync.set(
        {
          textly_server_url: url,
          textly_api_token: apiToken,
          textly_user_email: user.email,
          textly_user_role: user.role,
        },
        resolve,
      ),
    );

    // Clear password field
    signinPassword.value = "";

    showSignedIn(user.email, user.role);
    showStatus(serverStatusEl, "✅ Signed in successfully!", "success");
  } catch (err) {
    showStatus(serverStatusEl, `⚠️ ${err.message}`, "error");
  } finally {
    signinBtn.textContent = "Sign In";
    signinBtn.disabled = false;
  }
});

// ─── Test Connection (without signing in) ────────────────────────────────────
testServerBtn.addEventListener("click", async () => {
  const url = serverUrlInput.value.trim().replace(/\/$/, "");
  if (!url) {
    showStatus(serverStatusEl, "⚠️ Enter a server URL first", "error");
    return;
  }

  testServerBtn.textContent = "Testing…";
  testServerBtn.disabled = true;

  try {
    const health = await fetch(`${url}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!health.ok) throw new Error(`Health check returned ${health.status}`);
    showStatus(serverStatusEl, "✅ Server is reachable!", "success");
  } catch (err) {
    showStatus(serverStatusEl, `⚠️ ${err.message}`, "error");
  } finally {
    testServerBtn.textContent = "Test Connection";
    testServerBtn.disabled = false;
  }
});

// ─── Sign Out ─────────────────────────────────────────────────────────────────
signoutBtn.addEventListener("click", () => {
  chrome.storage.sync.remove(
    ["textly_api_token", "textly_user_email", "textly_user_role"],
    () => {
      showSignedOut();
      showStatus(serverStatusEl, "Signed out.", "success");
    },
  );
});

// ─── Open Dashboard ───────────────────────────────────────────────────────────
openDashBtn.addEventListener("click", () => {
  const url =
    serverUrlInput.value.trim().replace(/\/$/, "") || "http://localhost:3001";
  chrome.tabs.create({ url });
});

// ─── UI state helpers ─────────────────────────────────────────────────────────
function showSignedIn(email, role) {
  signinSection.style.display = "none";
  signedInSection.style.display = "block";
  signedInEmail.textContent = email;
  signedInRole.textContent = role;
  signedInRole.className = `badge ${role === "admin" ? "badge--admin" : ""}`;
}

function showSignedOut() {
  signinSection.style.display = "block";
  signedInSection.style.display = "none";
  signedInEmail.textContent = "";
  signedInRole.textContent = "";
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function showStatus(el, msg, type) {
  el.style.color = type === "error" ? "#f87171" : "#34d399";
  el.textContent = msg;
  setTimeout(() => (el.textContent = ""), 4000);
}

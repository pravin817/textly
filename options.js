const keyInput  = document.getElementById('key');
const saveBtn   = document.getElementById('save');
const statusEl  = document.getElementById('status');

// Load existing key
chrome.storage.sync.get('openai_key', ({ openai_key }) => {
  if (openai_key) keyInput.value = openai_key;
});

// Save
saveBtn.addEventListener('click', () => {
  const key = keyInput.value.trim();
  if (!key.startsWith('sk-')) {
    statusEl.style.color = '#f87171';
    statusEl.textContent = '⚠️ Key should start with sk-';
    return;
  }
  chrome.storage.sync.set({ openai_key: key }, () => {
    statusEl.style.color = '#a6e3a1';
    statusEl.textContent = '✅ Saved!';
    setTimeout(() => statusEl.textContent = '', 2000);
  });
});

const $ = (id) => document.getElementById(id);

// ── Load saved settings when the popup opens ──────────────────────────
chrome.storage.sync.get(null, (cfg) => {
  if (cfg.theme)    setActiveTheme(cfg.theme);
  if (cfg.opacity)  { $('opacity').value  = cfg.opacity;  $('opacityVal').textContent  = cfg.opacity  + '%'; }
  if (cfg.blur)     { $('blur').value     = cfg.blur;     $('blurVal').textContent     = cfg.blur     + 'px'; }
  if (cfg.radius)   { $('radius').value   = cfg.radius;   $('radiusVal').textContent   = cfg.radius   + 'px'; }
  if (cfg.fontSize) { $('fontSize').value = cfg.fontSize; $('fontSizeVal').textContent = cfg.fontSize + 'px'; }
});

// ── Theme buttons ─────────────────────────────────────────────────────
document.querySelectorAll('.theme-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    setActiveTheme(btn.dataset.theme);
    save('theme', btn.dataset.theme);
  });
});

function setActiveTheme(name) {
  document.querySelectorAll('.theme-btn').forEach((b) => b.classList.remove('active'));
  const target = document.querySelector(`[data-theme="${name}"]`);
  if (target) target.classList.add('active');
}

// ── Sliders ───────────────────────────────────────────────────────────
$('opacity').addEventListener('input', (e) => {
  $('opacityVal').textContent = e.target.value + '%';
  save('opacity', Number(e.target.value));
});

$('blur').addEventListener('input', (e) => {
  $('blurVal').textContent = e.target.value + 'px';
  save('blur', Number(e.target.value));
});

$('radius').addEventListener('input', (e) => {
  $('radiusVal').textContent = e.target.value + 'px';
  save('radius', Number(e.target.value));
});

$('fontSize').addEventListener('input', (e) => {
  $('fontSizeVal').textContent = e.target.value + 'px';
  save('fontSize', Number(e.target.value));
});

function save(key, value) {
  chrome.storage.sync.set({ [key]: value });
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, { action: 'settingChanged', key, value })
        .catch(() => {}); 
    });
  });
}

chrome.storage.sync.get(['enableNewTab', 'showSearchBar'], (cfg) => {
  if (cfg.enableNewTab !== undefined) $('enableNewTab').checked = cfg.enableNewTab;
  if (cfg.showSearchBar !== undefined) $('showSearchBar').checked = cfg.showSearchBar;
});

$('enableNewTab').addEventListener('change', (e) => save('enableNewTab', e.target.checked));
$('showSearchBar').addEventListener('change', (e) => save('showSearchBar', e.target.checked));
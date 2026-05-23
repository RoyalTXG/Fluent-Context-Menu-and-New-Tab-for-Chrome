const $ = (id) => document.getElementById(id);

const DEFAULTS = {
  theme: 'dark', opacity: 85, blur: 20, radius: 10, fontSize: 13,
  enableNewTab: true, showSearchBar: true,
};

const SLIDER_KEYS = ['opacity', 'blur', 'radius', 'fontSize'];

chrome.storage.sync.get(null, (cfg) => {
  if (cfg.theme) setActiveTheme(cfg.theme);
  SLIDER_KEYS.forEach((key) => {
    if (cfg[key]) {
      $(key).value = cfg[key];
      $(key + 'Val').textContent = cfg[key] + (key === 'opacity' ? '%' : 'px');
    }
  });
});

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

SLIDER_KEYS.forEach((key) => {
  $(key).addEventListener('input', (e) => {
    const suffix = key === 'opacity' ? '%' : 'px';
    $(key + 'Val').textContent = e.target.value + suffix;
    save(key, Number(e.target.value));
  });
});

function save(key, value) {
  chrome.storage.sync.set({ [key]: value });
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, { action: 'settingChanged', key, value }).catch(() => {});
    });
  });
}

chrome.storage.sync.get(['enableNewTab', 'showSearchBar'], (cfg) => {
  if (cfg.enableNewTab !== undefined) $('enableNewTab').checked = cfg.enableNewTab;
  if (cfg.showSearchBar !== undefined) $('showSearchBar').checked = cfg.showSearchBar;
});

$('enableNewTab').addEventListener('change', (e) => save('enableNewTab', e.target.checked));
$('showSearchBar').addEventListener('change', (e) => save('showSearchBar', e.target.checked));

$('resetBtn').addEventListener('click', () => {
  chrome.storage.sync.set(DEFAULTS, () => {
    SLIDER_KEYS.forEach((key) => {
      $(key).value = DEFAULTS[key];
      $(key + 'Val').textContent = DEFAULTS[key] + (key === 'opacity' ? '%' : 'px');
    });
    $('enableNewTab').checked = DEFAULTS.enableNewTab;
    $('showSearchBar').checked = DEFAULTS.showSearchBar;
    setActiveTheme(DEFAULTS.theme);
    Object.entries(DEFAULTS).forEach(([key, value]) => {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, { action: 'settingChanged', key, value }).catch(() => {});
        });
      });
    });
  });
});
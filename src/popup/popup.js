const $ = (id) => document.getElementById(id);

const DEFAULTS = {
  theme: 'dark', opacity: 85, blur: 20, radius: 10, fontSize: 13,
  enableNewTab: true, showSearchBar: true, enableContextMenu: true,
  timeTrackerEnabled: true, showGames: true, showSpeedTest: true, showBookmarks: true,
  layoutLocked: true,
};
const SLIDER_KEYS = ['opacity', 'blur', 'radius', 'fontSize'];
const BOOL_KEYS = ['enableNewTab', 'showSearchBar', 'enableContextMenu', 'timeTrackerEnabled', 'showGames', 'showSpeedTest', 'showBookmarks', 'layoutLocked'];

chrome.storage.sync.get(null, (cfg) => {
  if (cfg.theme) setActiveTheme(cfg.theme);
  SLIDER_KEYS.forEach((key) => {
    if (cfg[key]) {
      $(key).value = cfg[key];
      $(key + 'Val').textContent = cfg[key] + (key === 'opacity' ? '%' : 'px');
    }
  });
  BOOL_KEYS.forEach((key) => {
    if (cfg[key] !== undefined) {
      const el = $(key);
      if (el) el.checked = cfg[key];
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

BOOL_KEYS.forEach((key) => {
  const el = $(key);
  if (el) el.addEventListener('change', (e) => save(key, e.target.checked));
});

function save(key, value) {
  chrome.storage.sync.set({ [key]: value });
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, { action: 'settingChanged', key, value }).catch(() => {});
    });
  });
}

function sendBookmarkMessage(action) {
  chrome.tabs.query({ url: 'chrome-extension://*/_generated_background_page.html' }, () => {});
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.url && tab.url.startsWith('chrome-extension://')) {
        chrome.tabs.sendMessage(tab.id, { action: 'bookmarkAction', subAction: action }).catch(() => {});
      }
    });
  });
}

$('bmResetPos')?.addEventListener('click', () => {
  chrome.storage.local.set({ bookmarks: null });
  sendBookmarkMessage('reload');
});

$('bmClearAll')?.addEventListener('click', () => {
  if (confirm('Delete all bookmarks?')) {
    chrome.storage.local.set({ bookmarks: [] });
    sendBookmarkMessage('reload');
  }
});

$('resetBtn')?.addEventListener('click', () => {
  chrome.storage.sync.set(DEFAULTS, () => {
    SLIDER_KEYS.forEach((key) => {
      $(key).value = DEFAULTS[key];
      $(key + 'Val').textContent = DEFAULTS[key] + (key === 'opacity' ? '%' : 'px');
    });
    BOOL_KEYS.forEach((key) => {
      const el = $(key);
      if (el) el.checked = DEFAULTS[key];
    });
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
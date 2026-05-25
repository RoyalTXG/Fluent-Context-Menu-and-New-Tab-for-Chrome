// background.js

// ── Browser Theme ─────────────────────────────────────────────────────────
const BROWSER_THEMES = {
  dark:     { frame:'#0f0f14', toolbar:'#1c1c23', tab_text:'#e8e8ee', bookmark_text:'#e8e8ee', ntp_background:'#0f0f14', ntp_text:'#e8e8ee', accent:'#90c4ff' },
  light:    { frame:'#e8e8f0', toolbar:'#ffffff', tab_text:'#1a1a2e', bookmark_text:'#1a1a2e', ntp_background:'#f0f0f5', ntp_text:'#1a1a2e', accent:'#2563eb' },
  ocean:    { frame:'#050d1a', toolbar:'#0a1a30', tab_text:'#c8e0ff', bookmark_text:'#c8e0ff', ntp_background:'#050d1a', ntp_text:'#c8e0ff', accent:'#60a5fa' },
  midnight: { frame:'#040408', toolbar:'#0a0a12', tab_text:'#d8d8ea', bookmark_text:'#d8d8ea', ntp_background:'#040408', ntp_text:'#d8d8ea', accent:'#90c4ff' },
  nord:     { frame:'#1e2329', toolbar:'#2e3440', tab_text:'#e5e9f0', bookmark_text:'#e5e9f0', ntp_background:'#1e2329', ntp_text:'#e5e9f0', accent:'#88c0d0' },
  forest:   { frame:'#0a140e', toolbar:'#122018', tab_text:'#c8e0c8', bookmark_text:'#c8e0c8', ntp_background:'#0a140e', ntp_text:'#c8e0c8', accent:'#6abf6a' },
  sunset:   { frame:'#1a0d0e', toolbar:'#261417', tab_text:'#f5d8d0', bookmark_text:'#f5d8d0', ntp_background:'#1a0d0e', ntp_text:'#f5d8d0', accent:'#f07864' },
  dracula:  { frame:'#14111c', toolbar:'#1e1a2e', tab_text:'#f8f8f2', bookmark_text:'#f8f8f2', ntp_background:'#14111c', ntp_text:'#f8f8f2', accent:'#bd93f9' },
};

function applyBrowserTheme(themeName) {
  if (!chrome.theme) return;
  const t = BROWSER_THEMES[themeName] || BROWSER_THEMES.dark;
  chrome.theme.update({
    colors: {
      frame: t.frame,
      frame_inactive: t.frame,
      toolbar: t.toolbar,
      tab_text: t.tab_text,
      tab_background_text: t.tab_text,
      bookmark_text: t.bookmark_text,
      ntp_background: t.ntp_background,
      ntp_text: t.ntp_text,
      button_background: t.accent,
    }
  });
}

// ── Message Router ────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openTab' || message.action === 'openNewTab') {
    chrome.tabs.create({ url: message.url });
  }
  if (message.action === 'openWindow') {
    chrome.windows.create({ url: message.url, type: 'normal' });
  }
  if (message.action === 'openIncognito') {
    chrome.windows.create({ url: message.url, incognito: true, type: 'normal' });
  }
  if (message.action === 'downloadImage') {
    chrome.downloads.download({
      url: message.url,
      filename: message.filename || undefined
    });
  }
  if (message.action === 'proxyFetchImage') {
    fetch(message.url)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => sendResponse({ dataUrl: reader.result, type: blob.type });
        reader.readAsDataURL(blob);
      })
      .catch(err => sendResponse({ error: err.toString() }));
    return true;
  }
  if (message.action === 'getTimeData') {
    chrome.storage.local.get('timeData', (data) => sendResponse(data.timeData || {}));
    return true;
  }
});

const DEFAULTS = {
  theme: 'dark', opacity: 85, blur: 20, radius: 10, fontSize: 13,
  enableNewTab: true, showSearchBar: true,
  timeTrackerEnabled: true, showGames: true, showSpeedTest: true, showBookmarks: true,
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(null, (existing) => {
    const toSet = {};
    Object.entries(DEFAULTS).forEach(([key, value]) => {
      if (existing[key] === undefined) toSet[key] = value;
    });
    if (Object.keys(toSet).length > 0) chrome.storage.sync.set(toSet);
    applyBrowserTheme(existing.theme || 'dark');
  });
});

// ── Time Tracker ──────────────────────────────────────────────────────────
let activeTabId = null;
let activeWindowId = null;
let sessionStart = Date.now();
let todayStr = new Date().toISOString().split('T')[0];

function getToday() {
  return new Date().toISOString().split('T')[0];
}

async function recordTime() {
  const now = Date.now();
  const elapsed = now - sessionStart;
  if (elapsed < 2000) { sessionStart = now; return; }
  const ts = getToday();
  if (ts !== todayStr) todayStr = ts;
  chrome.storage.local.get('timeData', (data) => {
    const timeData = data.timeData || {};
    timeData[todayStr] = (timeData[todayStr] || 0) + elapsed;
    chrome.storage.local.set({ timeData });
  });
  sessionStart = now;
}

chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
  recordTime();
  activeTabId = tabId;
  activeWindowId = windowId;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete' && tabId === activeTabId) recordTime();
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    recordTime();
  } else {
    sessionStart = Date.now();
    activeWindowId = windowId;
  }
});

chrome.alarms.create('timeTracker', { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'timeTracker') {
    chrome.storage.sync.get('timeTrackerEnabled', (data) => {
      if (data.timeTrackerEnabled !== false) recordTime();
    });
  }
});

recordTime();

chrome.storage.onChanged.addListener((changes) => {
  if (changes.timeTrackerEnabled !== undefined) {
    if (changes.timeTrackerEnabled.newValue) {
      sessionStart = Date.now();
    } else {
      recordTime();
    }
  }
  if (changes.theme !== undefined) {
    applyBrowserTheme(changes.theme.newValue);
  }
});
// ── Theme definitions for New Tab ─────────────────────────────────────────
const NTP_THEMES = {
  dark:   { bg:'#0f0f14', card:'rgba(255,255,255,.06)', text:'#e8e8ee', sub:'rgba(255,255,255,.45)', border:'rgba(255,255,255,.10)', input:'rgba(255,255,255,.08)', placeholder:'rgba(255,255,255,.30)', accent:'#90c4ff' },
  light:  { bg:'#f0f0f5', card:'rgba(0,0,0,.06)', text:'#1a1a2e', sub:'rgba(0,0,0,.42)', border:'rgba(0,0,0,.10)', input:'rgba(0,0,0,.06)', placeholder:'rgba(0,0,0,.30)', accent:'#2563eb' },
  ocean:  { bg:'#050d1a', card:'rgba(60,140,255,.10)', text:'#c8e0ff', sub:'rgba(130,180,255,.50)', border:'rgba(60,140,255,0.2)', input:'rgba(60,140,255,.12)', placeholder:'rgba(130,180,255,.30)', accent:'#60a5fa' },
  midnight:{bg:'#040408', card:'rgba(255,255,255,.06)', text:'#d8d8ea', sub:'rgba(200,200,255,.40)', border:'rgba(255,255,255,.09)', input:'rgba(255,255,255,.07)', placeholder:'rgba(200,200,255,.25)', accent:'#90c4ff' },
  nord:   { bg:'#1e2329', card:'rgba(136,192,208,.10)', text:'#e5e9f0', sub:'rgba(216,222,233,.45)', border:'rgba(136,192,208,.18)', input:'rgba(136,192,208,.12)', placeholder:'rgba(216,222,233,.30)', accent:'#88c0d0' },
  forest: { bg:'#0a140e', card:'rgba(80,160,80,.10)', text:'#c8e0c8', sub:'rgba(160,210,160,.45)', border:'rgba(80,160,80,.18)', input:'rgba(80,160,80,.12)', placeholder:'rgba(160,210,160,.30)', accent:'#6abf6a' },
  sunset: { bg:'#1a0d0e', card:'rgba(240,120,100,.10)', text:'#f5d8d0', sub:'rgba(240,180,160,.45)', border:'rgba(240,120,100,.18)', input:'rgba(240,120,100,.12)', placeholder:'rgba(240,180,160,.30)', accent:'#f07864' },
  dracula:{ bg:'#14111c', card:'rgba(189,147,249,.10)', text:'#f8f8f2', sub:'rgba(248,248,242,.42)', border:'rgba(189,147,249,.18)', input:'rgba(189,147,249,.12)', placeholder:'rgba(248,248,242,.28)', accent:'#bd93f9' },
};

function applyTheme(themeName) {
  const t = NTP_THEMES[themeName] || NTP_THEMES.dark;
  const s = document.documentElement.style;
  s.setProperty('--ntp-bg', t.bg);
  s.setProperty('--ntp-card', t.card);
  s.setProperty('--ntp-text', t.text);
  s.setProperty('--ntp-sub', t.sub);
  s.setProperty('--ntp-border', t.border);
  s.setProperty('--ntp-input', t.input);
  s.setProperty('--ntp-placeholder', t.placeholder);
  s.setProperty('--ntp-accent', t.accent);
}

chrome.storage.sync.get(['enableNewTab','showSearchBar','timeTrackerEnabled','showGames','showSpeedTest','theme'], (data) => {
  applyTheme(data.theme || 'dark');
  if (data.enableNewTab === false) {
    window.location.replace('https://www.google.com/_/chrome/newtab');
    return;
  }
  if (data.showSearchBar === false) {
    document.querySelector('.search-wrap').style.display = 'none';
  }
  if (data.timeTrackerEnabled !== false) {
    document.getElementById('statsRow').style.display = 'flex';
    loadTimeData();
  }
  if (data.showSpeedTest !== false) {
    document.getElementById('widgetSpeed').style.display = 'block';
  }
  if (data.showGames !== false) {
    document.getElementById('widgetSnake').style.display = 'block';
    document.getElementById('widgetWordle').style.display = 'block';
  }
});

// Listen for theme changes from popup
chrome.storage.onChanged.addListener((changes) => {
  if (changes.theme) applyTheme(changes.theme.newValue);
});

// ── Clock ─────────────────────────────────────────────────────────────────
function tick() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('clock').textContent = h + ':' + m;
  document.getElementById('date').textContent = now.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });
}
tick();
setInterval(tick, 1000);

// ── Search ────────────────────────────────────────────────────────────────
let searchMode = 'web';
const searchUrls = {
  web:   (q) => 'https://www.google.com/search?q=' + q,
  img:   (q) => 'https://www.google.com/search?tbm=isch&q=' + q,
  video: (q) => 'https://www.google.com/search?tbm=vid&q=' + q,
};
const placeholders = {
  web:   'Search Google...',
  img:   'Search Google Images...',
  video: 'Search Google Videos...',
};

function setMode(mode) {
  searchMode = mode;
  document.querySelectorAll('.search-tab').forEach((t) => t.classList.remove('active'));
  document.getElementById('tab-' + mode).classList.add('active');
  const textContainer = document.getElementById('textSearchContainer');
  const dropzoneContainer = document.getElementById('imageDropzone');
  if (mode === 'revImg') {
    textContainer.style.display = 'none';
    dropzoneContainer.style.display = 'flex';
  } else {
    textContainer.style.display = 'flex';
    dropzoneContainer.style.display = 'none';
    document.getElementById('searchInput').placeholder = placeholders[mode];
    document.getElementById('searchInput').focus();
    document.getElementById('searchInput').value = '';
  }
}

function doSearch() {
  if (searchMode === 'revImg') return;
  const q = document.getElementById('searchInput').value.trim();
  if (!q) return;
  window.location.href = searchUrls[searchMode](encodeURIComponent(q));
}

document.getElementById('tab-web').addEventListener('click', () => setMode('web'));
document.getElementById('tab-img').addEventListener('click', () => setMode('img'));
document.getElementById('tab-video').addEventListener('click', () => setMode('video'));
document.getElementById('tab-revImg').addEventListener('click', () => setMode('revImg'));
document.getElementById('searchBtn').addEventListener('click', doSearch);
document.getElementById('searchInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
document.getElementById('searchInput').focus();

// ── Reverse Image Upload ──────────────────────────────────────────────────
document.getElementById('imageDropzone').addEventListener('click', () => {
  document.getElementById('imageUpload').click();
});
document.getElementById('imageUpload').addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) processImageFile(e.target.files[0]);
});

async function handleGlobalPaste(e) {
  try {
    const clipboardItems = await navigator.clipboard.read();
    for (const item of clipboardItems) {
      const imageTypes = item.types.filter(type => type.startsWith('image/'));
      if (imageTypes.length > 0) {
        if (e) e.preventDefault();
        const blob = await item.getType(imageTypes[0]);
        const file = new File([blob], "pasted-image.png", { type: blob.type });
        setMode('revImg');
        processImageFile(file);
        return true;
      }
    }
  } catch (err) {
    if (e && e.clipboardData) {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          if (e) e.preventDefault();
          setMode('revImg');
          processImageFile(items[i].getAsFile());
          return true;
        }
      }
    }
  }
}
document.addEventListener('paste', handleGlobalPaste);
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') handleGlobalPaste(e);
});
document.addEventListener('custom-paste-image', (e) => {
  if (e.detail && e.detail instanceof File) { setMode('revImg'); processImageFile(e.detail); }
});

function processImageFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('dropzoneText').style.display = 'none';
    document.getElementById('imagePreview').src = e.target.result;
    document.getElementById('imagePreview').style.display = 'block';
    document.getElementById('uploadingText').style.display = 'block';
    document.getElementById('imageDropzone').style.pointerEvents = 'none';
    setTimeout(() => submitToGoogleLens(file), 400);
  };
  reader.readAsDataURL(file);
}

function submitToGoogleLens(file) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://lens.google.com/v3/upload';
  form.enctype = 'multipart/form-data';
  const input = document.createElement('input');
  input.type = 'file';
  input.name = 'encoded_image';
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  input.files = dataTransfer.files;
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
}

// ── Stats: Time Tracker ──────────────────────────────────────────────────
function loadTimeData() {
  chrome.runtime.sendMessage({ action: 'getTimeData' }, (timeData) => {
    if (!timeData) return;
    const today = new Date().toISOString().split('T')[0];
    const ms = timeData[today] || 0;
    const mins = Math.floor(ms / 60000);
    const hrs = Math.floor(mins / 60);
    const el = document.getElementById('timeToday');
    if (hrs > 0) el.textContent = `${hrs}h ${mins % 60}m`;
    else el.textContent = `${mins}m`;
  });
  // Refresh every 30s
  setTimeout(loadTimeData, 30000);
}

// ── Widget Toggles ────────────────────────────────────────────────────────
function setupToggle(toggleId, bodyId, onOpen) {
  const toggle = document.getElementById(toggleId);
  const body = document.getElementById(bodyId);
  let opened = false;
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    body.classList.toggle('open');
    if (!opened && body.classList.contains('open')) {
      opened = true;
      onOpen();
    }
  });
}

setupToggle('toggleSpeed', 'bodySpeed', () => {
  const st = new SpeedTest(document.getElementById('bodySpeed'));
  st.run();
});

let snake = null;
setupToggle('toggleSnake', 'bodySnake', () => {
  snake = new SnakeGame(document.getElementById('bodySnake'));
  snake.start();
});

let wordle = null;
setupToggle('toggleWordle', 'bodyWordle', () => {
  wordle = new WordleGame(document.getElementById('bodyWordle'));
  wordle.start();
});

// ── Bookmark Manager ─────────────────────────────────────────────────────
let bm = null;
chrome.storage.sync.get(['showBookmarks'], (data) => {
  if (data.showBookmarks === false) return;
  bm = new BookmarkManager(document.getElementById('bmCanvas'));
  bm.showTutorial();
});
document.getElementById('bmAddBtn').addEventListener('click', () => { if (bm) bm.addLinkModal(); });
document.getElementById('bmHelpBtn').addEventListener('click', () => { if (bm) bm.showTutorialHelp(); });

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'bookmarkAction' && msg.subAction === 'reload' && bm) {
    bm.load();
  }
});

// ── Hide Chrome's NTP footer ─────────────────────────────────────────────
function hideFooter() {
  const sel = '#ntp-footer, ntp-footer, [id*="ntp-footer"], [class*="ntp-footer"]';
  document.querySelectorAll(sel).forEach((el) => el.remove());
}
hideFooter();
new MutationObserver(hideFooter).observe(document.body, { childList: true, subtree: true });
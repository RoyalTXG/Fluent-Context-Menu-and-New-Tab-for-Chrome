chrome.storage.sync.get(['enableNewTab', 'showSearchBar'], (data) => {
  if (data.enableNewTab === false) {
    window.location.replace('https://www.google.com/_/chrome/newtab');
    return;
  }
  if (data.showSearchBar === false) {
    document.querySelector('.search-wrap').style.display = 'none';
  }
});

// ── Clock ────────────────────────────────────────────────────────────────
function tick() {
  const now = new Date();
  const h   = String(now.getHours()).padStart(2, '0');
  const m   = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('clock').textContent = h + ':' + m;
  document.getElementById('date').textContent  = now.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });
}
tick();
setInterval(tick, 1000);

// ── Search ───────────────────────────────────────────────────────────────
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

document.getElementById('tab-web').addEventListener('click',    () => setMode('web'));
document.getElementById('tab-img').addEventListener('click',    () => setMode('img'));
document.getElementById('tab-video').addEventListener('click',  () => setMode('video'));
document.getElementById('tab-revImg').addEventListener('click', () => setMode('revImg'));

document.getElementById('searchBtn').addEventListener('click', doSearch);
document.getElementById('searchInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doSearch();
});

// Auto-focus text box on load
document.getElementById('searchInput').focus();

// ── NEW: Image Upload & Paste Logic ──────────────────────────────────────

// 1. Handle file selection via Click
document.getElementById('imageDropzone').addEventListener('click', () => {
  document.getElementById('imageUpload').click();
});

document.getElementById('imageUpload').addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) {
    processImageFile(e.target.files[0]);
  }
});

// 2. The Master Paste Handler (Catches Native Paste & Ctrl+V Keystrokes)
async function handleGlobalPaste(e) {
  try {
    // Force read the clipboard using the modern API
    const clipboardItems = await navigator.clipboard.read();
    for (const item of clipboardItems) {
      const imageTypes = item.types.filter(type => type.startsWith('image/'));
      if (imageTypes.length > 0) {
        if (e) e.preventDefault(); // Stop normal text pasting
        
        const blob = await item.getType(imageTypes[0]);
        const file = new File([blob], "pasted-image.png", { type: blob.type });
        
        setMode('revImg');
        processImageFile(file);
        return true;
      }
    }
  } catch (err) {
    // Fallback for older browser behavior
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

// Listen to the native paste event (Triggers via browser Edit menu)
document.addEventListener('paste', handleGlobalPaste);

// Listen aggressively for the Ctrl+V / Cmd+V keystroke anywhere on the page
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
    handleGlobalPaste(e);
  }
});

// 3. Handle custom paste events coming from our Content Script context menu
document.addEventListener('custom-paste-image', (e) => {
  if (e.detail && e.detail instanceof File) {
    setMode('revImg');
    processImageFile(e.detail);
  }
});

// 4. Display preview and submit to Google Lens
function processImageFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('dropzoneText').style.display = 'none';
    document.getElementById('imagePreview').src = e.target.result;
    document.getElementById('imagePreview').style.display = 'block';
    document.getElementById('uploadingText').style.display = 'block';
    
    document.getElementById('imageDropzone').style.pointerEvents = 'none';

    setTimeout(() => {
      submitToGoogleLens(file);
    }, 400);
  };
  reader.readAsDataURL(file);
}

// 5. Create an invisible form and fire it off to Google Lens
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

// ── Hide Chrome's NTP footer attribution ─────────────────────────────────
function hideFooter() {
  const sel = '#ntp-footer, ntp-footer, [id*="ntp-footer"], [class*="ntp-footer"]';
  document.querySelectorAll(sel).forEach((el) => el.remove());
}
hideFooter();
new MutationObserver(hideFooter).observe(document.body, { childList: true, subtree: true });
const THEMES = {
  dark:  { bg: 'rgba(28,28,35,{a})',  text: '#e8e8ee', sub: 'rgba(255,255,255,.35)', sep: 'rgba(255,255,255,.1)',  hover: 'rgba(255,255,255,.08)', border: 'rgba(255,255,255,.12)' },
  light: { bg: 'rgba(245,245,250,{a})', text: '#1a1a2e', sub: 'rgba(0,0,0,.3)',        sep: 'rgba(0,0,0,.08)',    hover: 'rgba(0,0,0,.06)',       border: 'rgba(0,0,0,.12)'  },
  ocean: { bg: 'rgba(10,25,50,{a})',   text: '#b8d4ff', sub: 'rgba(100,160,255,.4)', sep: 'rgba(60,140,255,.2)', hover: 'rgba(60,140,255,.12)', border: 'rgba(60,140,255,.25)'},
  midnight:{ bg:'rgba(8,8,12,{a})',    text: '#d0d0e0', sub: 'rgba(200,200,255,.3)', sep: 'rgba(255,255,255,.06)',hover: 'rgba(255,255,255,.05)', border:'rgba(255,255,255,.08)'},
  nord:  { bg: 'rgba(46,52,64,{a})',   text: '#d8dee9', sub: 'rgba(216,222,233,.4)', sep: 'rgba(216,222,233,.1)',  hover: 'rgba(136,192,208,.15)', border: 'rgba(136,192,208,.25)' },
  forest:{ bg: 'rgba(20,35,25,{a})',   text: '#b8d4b8', sub: 'rgba(160,200,160,.4)', sep: 'rgba(160,200,160,.12)', hover: 'rgba(80,160,80,.15)',  border: 'rgba(80,160,80,.25)' },
  sunset:{ bg: 'rgba(40,20,25,{a})',   text: '#f0d0c8', sub: 'rgba(240,180,160,.4)', sep: 'rgba(240,180,160,.12)', hover: 'rgba(240,120,100,.15)', border: 'rgba(240,120,100,.25)' },
  dracula:{bg: 'rgba(40,32,54,{a})',   text: '#f8f8f2', sub: 'rgba(248,248,242,.4)', sep: 'rgba(248,248,242,.1)',  hover: 'rgba(189,147,249,.15)', border: 'rgba(189,147,249,.25)' },
};

let cfg = { theme:'dark', opacity:85, blur:20, radius:10, fontSize:13 };
let menu = null;

chrome.storage.sync.get(null, (data) => { if(data) Object.assign(cfg, data); });
chrome.storage.onChanged.addListener((changes) => {
  Object.entries(changes).forEach(([k,v]) => cfg[k] = v.newValue);
});

// NEW Helper: Securely fetch image data bypassing CORS via background.js
function getSafeImageData(url) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'proxyFetchImage', url: url }, (response) => {
      if (response && response.dataUrl) resolve(response);
      else reject(response ? response.error : 'Unknown error');
    });
  });
}

// Helper: Download images (Bypassing CORS)
async function downloadImage(url, format) {
  if (format === 'default') {
    chrome.runtime.sendMessage({ action: 'downloadImage', url: url });
    return;
  }
  
  try {
    const { dataUrl } = await getSafeImageData(url);
    const img = new Image();
    img.src = dataUrl;
    await new Promise(r => img.onload = r);

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0);

    const newUrl = canvas.toDataURL(`image/${format}`);
    const ext = format === 'jpeg' ? 'jpg' : 'png';
    chrome.runtime.sendMessage({ action: 'downloadImage', url: newUrl, filename: `download.${ext}` });
  } catch (err) {
    alert('Website strictly blocked this image. Downloading default format instead.');
    chrome.runtime.sendMessage({ action: 'downloadImage', url: url });
  }
}

// Helper: Copy Image to Clipboard (Bypassing CORS & enforcing PNG rule)
async function copyImageToClipboard(url) {
  try {
    const { dataUrl, type } = await getSafeImageData(url);
    
    // Convert the base64 string back into a Blob
    const res = await fetch(dataUrl);
    const originalBlob = await res.blob();
    
    // Chrome clipboard STRICTLY requires 'image/png'. 
    // If it's a JPG or WEBP, we must redraw it as a PNG first!
    if (originalBlob.type !== 'image/png') {
      const img = new Image();
      img.src = dataUrl;
      await new Promise(r => img.onload = r);
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      
      canvas.toBlob(async (pngBlob) => {
        await navigator.clipboard.write([ new ClipboardItem({ 'image/png': pngBlob }) ]);
      }, 'image/png');
    } else {
      // It's already a PNG, copy directly
      await navigator.clipboard.write([ new ClipboardItem({ [originalBlob.type]: originalBlob }) ]);
    }
  } catch (err) {
    console.error(err);
    alert('Failed to copy image. The website is enforcing strict security protocols.');
  }
}


function findLink(el) {
  if (el.tagName === 'A' && el.href) return el.href;
  if (el.closest) {
    const a = el.closest('a');
    if (a && a.href) return a.href;
  }
  return null;
}

// Dynamic menu builder
function getMenuItems(target) {
  const selection = window.getSelection().toString().trim();
  
  // Deep check for editable areas
  const isContentEditable = target.isContentEditable || (target.closest && target.closest('[contenteditable="true"]'));
  
  // NEW: Check if the user is clicking our custom image dropzone on the New Tab page
  const isDropzone = target.closest && target.closest('.image-dropzone');
  
  const isEditable = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || isContentEditable || isDropzone;
  const isImage = target && target.tagName === 'IMG' && target.src;
  
  const items = [];

  // 1. DYNAMIC EDIT GROUP
  const editItems = [];
  
  // Copy logic
  if (selection) {
    editItems.push({ id:'copy', label:'Copy Text', icon:'📋', shortcut:'Ctrl+C', action: () => document.execCommand('copy') });
  } else if (isImage) {
    editItems.push({ id:'copyImg', label:'Copy Image', icon:'📋', action: () => copyImageToClipboard(target.src) });
  }

  // Cut logic
  if (selection && (isEditable && !isDropzone)) {
    editItems.push({ id:'cut', label:'Cut', icon:'✂️', shortcut:'Ctrl+X', action: () => document.execCommand('cut') });
  }

  // Paste logic (Appears if clicking a text box OR the image dropzone)
  if (isEditable) {
    editItems.push({ id:'paste', label:'Paste', icon:'📌', shortcut:'Ctrl+V', action: async () => {
      try {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          const imageTypes = item.types.filter(type => type.startsWith('image/'));
          if (imageTypes.length > 0) {
            const blob = await item.getType(imageTypes[0]);
            
            // NEW: If pasting into the New Tab Dropzone, send the file directly to newtab.js
            if (isDropzone) {
              const file = new File([blob], "pasted-image.png", { type: blob.type });
              document.dispatchEvent(new CustomEvent('custom-paste-image', { detail: file }));
              return;
            }

            // Normal text-editor image paste
            if (isContentEditable) {
              const url = URL.createObjectURL(blob);
              document.execCommand('insertImage', false, url);
              return;
            }
          }
        }
        
        // Fallback for text pasting (skip if clicking the dropzone)
        if (!isDropzone) {
          const text = await navigator.clipboard.readText();
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            const start = target.selectionStart;
            const end = target.selectionEnd;
            target.value = target.value.substring(0, start) + text + target.value.substring(end);
            target.selectionStart = target.selectionEnd = start + text.length;
          } else {
            document.execCommand('insertText', false, text);
          }
        }
      } catch (e) {
        document.execCommand('paste'); 
      }
    }});
    
    if (!isDropzone) {
      editItems.push({ id:'selall', label:'Select All', icon:'🔲', shortcut:'Ctrl+A', action: () => document.execCommand('selectAll') });
    }
  }

  if (editItems.length > 0) items.push({ group: 'Edit', items: editItems });

  // 2. SEARCH SELECTION
  if (selection) {
    items.push({ group: 'Search', items: [
      { id:'search', label:'Search Web', icon:'🔍', action: () => window.open(`https://google.com/search?q=${encodeURIComponent(selection)}`) }
    ]});
  }

  // 3. IMAGE GROUP
  if (isImage && !isDropzone) {
    items.push({
      group: 'Image', items: [
        { id:'copyImgUrl',label:'Copy Image Link',       icon:'🔗', action: () => navigator.clipboard.writeText(target.src) },
        { id:'revSearch', label:'Search Image (Google)', icon:'🖼️', action: () => window.open(`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(target.src)}`) },
        { id:'saveDef',   label:'Save Image (Default)',  icon:'💾', action: () => downloadImage(target.src, 'default') },
        { id:'savePng',   label:'Save as PNG',           icon:'🖼️', action: () => downloadImage(target.src, 'png') },
        { id:'saveJpg',   label:'Save as JPG',           icon:'📸', action: () => downloadImage(target.src, 'jpeg') }
      ]
    });
  }

  // 4. LINK GROUP
  if (!isDropzone) {
    const linkUrl = findLink(target);
    if (linkUrl) {
      const isHttp = linkUrl.startsWith('http://') || linkUrl.startsWith('https://');
      const linkItems = [
        { id:'openNewTab', label:'Open in New Tab', icon:'📄', action: () => chrome.runtime.sendMessage({ action: 'openNewTab', url: linkUrl }) },
      ];
      if (isHttp) {
        linkItems.push(
          { id:'openNewWin',  label:'Open in New Window',   icon:'🪟', action: () => chrome.runtime.sendMessage({ action: 'openWindow', url: linkUrl }) },
          { id:'openIncog',   label:'Open in Incognito',    icon:'👁️', action: () => chrome.runtime.sendMessage({ action: 'openIncognito', url: linkUrl }) }
        );
      }
      linkItems.push(
        { id:'copyLink',    label:'Copy Link Address',    icon:'🔗', action: () => navigator.clipboard.writeText(linkUrl) }
      );
      items.push({ group: 'Link', items: linkItems });
    }
  }

  // 5. STANDARD PAGE TOOLS
  items.push({ group: 'Page', items: [
    { id:'src',    label:'View Source', icon:'🌐', shortcut:'Ctrl+U', action: () => chrome.runtime.sendMessage({ action: 'openTab', url: 'view-source:' + location.href }) },
    { id:'print',  label:'Print',       icon:'🖨️', shortcut:'Ctrl+P', action: () => window.print() },
    { id:'reload', label:'Reload Page', icon:'🔄', shortcut:'F5',     action: () => location.reload() },
  ]});

  return items;
}

function buildMenu(x, y, target) {
  removeMenu();
  const t = THEMES[cfg.theme] || THEMES.dark;
  const alpha = (cfg.opacity / 100).toFixed(2);
  const bgColor = t.bg.replace('{a}', alpha);

  menu = document.createElement('div');
  menu.id = 'fluent-ctx-menu';
  menu.setAttribute('role', 'menu');
  Object.assign(menu.style, {
    position: 'fixed', zIndex: '2147483647', top: y + 'px', left: x + 'px',
    minWidth: '220px', background: bgColor, backdropFilter: `blur(${cfg.blur}px)`,
    webkitBackdropFilter: `blur(${cfg.blur}px)`, borderRadius: cfg.radius + 'px',
    border: `0.5px solid ${t.border}`, boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
    padding: '4px 0', fontSize: cfg.fontSize + 'px',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
    animation: 'fluentIn .12s cubic-bezier(.2,0,.2,1)', transformOrigin:'top left', userSelect: 'none',
  });

  const activeItems = getMenuItems(target);

  activeItems.forEach(group => {
    const hdr = document.createElement('div');
    hdr.textContent = group.group.toUpperCase();
    Object.assign(hdr.style, { padding:'4px 12px 2px', fontSize:'10px', letterSpacing:'.08em', color: t.sub });
    menu.appendChild(hdr);

    group.items.forEach(item => {
      const row = document.createElement('div');
      row.setAttribute('role', 'menuitem');
      row.setAttribute('tabindex', '0');
      row.innerHTML = `
        <span class="fctx-icon">${item.icon}</span>
        <span class="fctx-label">${item.label}</span>
        ${item.shortcut ? `<span class="fctx-key">${item.shortcut}</span>` : ''}
      `;
      Object.assign(row.style, {
        display:'flex', alignItems:'center', gap:'10px',
        padding:'7px 12px', cursor:'pointer', color: t.text,
        borderRadius: '6px', margin:'1px 4px', transition:'background .1s'
      });
      row.onmouseenter = () => row.style.background = t.hover;
      row.onmouseleave = () => row.style.background = '';
      row.onclick = () => { removeMenu(); item.action?.(); };
      menu.appendChild(row);
    });

    const sep = document.createElement('hr');
    Object.assign(sep.style, { border:'none', borderTop:`0.5px solid ${t.sep}`, margin:'3px 10px' });
    menu.appendChild(sep);
  });

  document.body.appendChild(menu);
  clamp(menu, x, y);
}

function clamp(el, x, y) {
  const r = el.getBoundingClientRect();
  if(x + r.width  > window.innerWidth)  el.style.left = (x - r.width)  + 'px';
  if(y + r.height > window.innerHeight) el.style.top  = (y - r.height) + 'px';
}

function removeMenu() {
  if(menu) { menu.remove(); menu = null; }
}

document.addEventListener('contextmenu', e => {
  if (e.shiftKey) return; 
  if (e.target && (e.target.tagName === 'VIDEO' || e.target.tagName === 'AUDIO')) return;

  e.preventDefault();
  buildMenu(e.clientX, e.clientY, e.target);
}, true);

document.addEventListener('mousedown', e => {
  if (e.button === 2) return; // Ignore right-clicks
  if (menu && menu.contains(e.target)) return;
  removeMenu(); 
}, true); 

document.addEventListener('keydown', e => { if(e.key === 'Escape') removeMenu(); });
window.addEventListener('blur', () => removeMenu());
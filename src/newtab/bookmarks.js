class BookmarkManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.bookmarks = [];
    this.drag = null;
    this.resize = null;
    this.load();
  }

  async load() {
    const data = await chrome.storage.local.get('bookmarks');
    this.bookmarks = data.bookmarks || [];
    this.render();
  }

  async save() {
    await chrome.storage.local.set({ bookmarks: this.bookmarks });
  }

  add(type, data) {
    const bm = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      type,
      x: 20 + (this.bookmarks.length % 6) * 90,
      y: 20 + Math.floor(this.bookmarks.length / 6) * 100,
      width: type === 'image' ? 120 : 64,
      height: type === 'image' ? 120 : 64,
      ...data,
    };
    this.bookmarks.push(bm);
    this.save();
    this.render();
    return bm;
  }

  remove(id) {
    this.bookmarks = this.bookmarks.filter(b => b.id !== id);
    this.save();
    this.render();
  }

  update(id, props) {
    const bm = this.bookmarks.find(b => b.id === id);
    if (bm) Object.assign(bm, props);
    this.save();
  }

  render() {
    this.canvas.innerHTML = '';
    this.bookmarks.forEach(bm => {
      const el = document.createElement('div');
      el.className = 'bm-item';
      el.dataset.id = bm.id;
      el.style.left = bm.x + 'px';
      el.style.top = bm.y + 'px';
      el.style.width = bm.width + 'px';
      el.classList.add('bm-item-' + bm.type);

      if (bm.type === 'link') {
        const img = document.createElement('img');
        img.className = 'bm-icon';
        img.src = bm.icon || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2360a5fa"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>';
        img.draggable = false;
        el.appendChild(img);
        const label = document.createElement('span');
        label.className = 'bm-label';
        label.textContent = bm.title || bm.url;
        el.appendChild(label);
        el.addEventListener('click', (e) => {
          if (this.drag || this.resize || this._dragMoved) return;
          window.open(bm.url, '_blank');
        });
      } else {
        el.style.height = bm.height + 'px';
        const img = document.createElement('img');
        img.className = 'bm-img';
        img.src = bm.imageData;
        img.draggable = false;
        el.appendChild(img);
        const del = document.createElement('button');
        del.className = 'bm-del';
        del.textContent = '×';
        del.addEventListener('click', (e) => { e.stopPropagation(); this.remove(bm.id); });
        el.appendChild(del);
        const resizeH = document.createElement('div');
        resizeH.className = 'bm-resize';
        el.appendChild(resizeH);
      }

      const ctx = document.createElement('div');
      ctx.className = 'bm-ctx';
      ctx.textContent = '⋯';
      ctx.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showCtx(e, bm);
      });
      el.appendChild(ctx);

      this.makeDraggable(el, bm);
      this.canvas.appendChild(el);
    });
  }

  makeDraggable(el, bm) {
    let startX, startY, startL, startT;

    const onDown = (e) => {
      if (e.button !== 0) return;
      const t = e.target;
      if (t.closest('.bm-del') || t.closest('.bm-resize') || t.closest('.bm-ctx')) return;
      this.drag = bm.id;
      this._dragMoved = false;
      startX = e.clientX;
      startY = e.clientY;
      startL = bm.x;
      startT = bm.y;
      el.style.zIndex = 999;
      e.preventDefault();
    };

    const onMove = (e) => {
      if (this.drag !== bm.id) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) this._dragMoved = true;
      bm.x = startL + dx;
      bm.y = startT + dy;
      el.style.left = bm.x + 'px';
      el.style.top = bm.y + 'px';
    };

    const onUp = () => {
      if (this.drag === bm.id) {
        this.drag = null;
        el.style.zIndex = '';
        if (this._dragMoved) this.update(bm.id, { x: bm.x, y: bm.y });
      }
    };

    el.addEventListener('mousedown', onDown);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);

    // Resize for images
    const rh = el.querySelector('.bm-resize');
    if (rh) {
      let rStartX, rStartY, rStartW, rStartH;
      rh.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        this.resize = bm.id;
        rStartX = e.clientX;
        rStartY = e.clientY;
        rStartW = bm.width;
        rStartH = bm.height;
      });
      const rMove = (e) => {
        if (this.resize !== bm.id) return;
        const dw = e.clientX - rStartX;
        const dh = e.clientY - rStartY;
        bm.width = Math.max(40, rStartW + dw);
        bm.height = Math.max(40, rStartH + dh);
        el.style.width = bm.width + 'px';
        el.style.height = bm.height + 'px';
      };
      const rUp = () => {
        if (this.resize === bm.id) {
          this.resize = null;
          this.update(bm.id, { width: bm.width, height: bm.height });
        }
      };
      document.addEventListener('mousemove', rMove);
      document.addEventListener('mouseup', rUp);
    }
  }

  showCtx(e, bm) {
    const existing = document.querySelector('.bm-ctx-menu');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.className = 'bm-ctx-menu';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';

    const items = [];
    if (bm.type === 'link') {
      items.push({ label: 'Open in New Tab', action: () => window.open(bm.url, '_blank') });
      items.push({ label: 'Copy URL', action: () => navigator.clipboard.writeText(bm.url) });
    }
    items.push({ label: 'Delete', action: () => this.remove(bm.id), danger: true });

    items.forEach(item => {
      const btn = document.createElement('div');
      btn.className = 'bm-ctx-item' + (item.danger ? ' bm-ctx-danger' : '');
      btn.textContent = item.label;
      btn.addEventListener('click', () => { menu.remove(); item.action(); });
      menu.appendChild(btn);
    });

    document.body.appendChild(menu);
    const close = (e2) => {
      if (!menu.contains(e2.target)) { menu.remove(); document.removeEventListener('click', close); }
    };
    setTimeout(() => document.addEventListener('click', close), 10);
  }

  async addLinkModal() {
    const overlay = document.createElement('div');
    overlay.className = 'bm-overlay';
    overlay.innerHTML = `
      <div class="bm-modal">
        <h3>Add Bookmark</h3>
        <div class="bm-modal-body">
          <div class="bm-modal-tabs">
            <button class="bm-tab active" data-tab="link">Link</button>
            <button class="bm-tab" data-tab="image">Image</button>
          </div>
          <div class="bm-tab-content" id="bmLinkTab">
            <input class="bm-input" id="bmUrlInput" type="text" placeholder="Enter URL (e.g. https://google.com)" autocomplete="off">
            <input class="bm-input" id="bmTitleInput" type="text" placeholder="Title (optional)" autocomplete="off">
            <div id="bmUrlPreview" class="bm-preview"></div>
          </div>
          <div class="bm-tab-content" id="bmImageTab" style="display:none">
            <div class="bm-dropzone" id="bmImageDropzone">
              <span>Drop an image here or click to upload</span>
              <input type="file" id="bmImageFile" accept="image/*" hidden>
            </div>
            <div class="bm-or">or paste image URL</div>
            <input class="bm-input" id="bmImageUrlInput" type="text" placeholder="Paste image URL..." autocomplete="off">
            <div id="bmImagePreview" class="bm-preview"></div>
          </div>
        </div>
        <div class="bm-modal-footer">
          <button class="bm-btn bm-btn-secondary" id="bmCancel">Cancel</button>
          <button class="bm-btn bm-btn-primary" id="bmModalAddBtn">Add</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const tabBtns = overlay.querySelectorAll('.bm-tab');
    tabBtns.forEach(btn => btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('bmLinkTab').style.display = btn.dataset.tab === 'link' ? 'block' : 'none';
      document.getElementById('bmImageTab').style.display = btn.dataset.tab === 'image' ? 'block' : 'none';
    }));

    // URL preview
    const urlInput = document.getElementById('bmUrlInput');
    const titleInput = document.getElementById('bmTitleInput');
    const preview = document.getElementById('bmUrlPreview');
    let previewTimeout;

    urlInput.addEventListener('input', () => {
      clearTimeout(previewTimeout);
      previewTimeout = setTimeout(() => {
        const url = urlInput.value.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          preview.innerHTML = '';
          return;
        }
        try {
          const domain = new URL(url).hostname;
          preview.innerHTML = `<img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" onerror="this.style.display='none'"> <span>${domain}</span>`;
          if (!titleInput.value) titleInput.placeholder = `Title (${domain})`;
        } catch { preview.innerHTML = ''; }
      }, 400);
    });

    // Image dropzone
    const dz = document.getElementById('bmImageDropzone');
    const fileInput = document.getElementById('bmImageFile');
    let imageDataUrl = null;

    dz.addEventListener('click', () => fileInput.click());
    dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.style.borderColor = 'var(--ntp-accent)'; });
    dz.addEventListener('dragleave', () => { dz.style.borderColor = ''; });
    dz.addEventListener('drop', (e) => {
      e.preventDefault();
      dz.style.borderColor = '';
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) readImageFile(file);
    });
    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) readImageFile(fileInput.files[0]);
    });

    function readImageFile(file) {
      const r = new FileReader();
      r.onload = (e) => {
        imageDataUrl = e.target.result;
        const ip = document.getElementById('bmImagePreview');
        ip.innerHTML = `<img src="${imageDataUrl}" style="max-width:200px;max-height:120px;border-radius:6px">`;
        dz.style.display = 'none';
        document.querySelector('.bm-or').style.display = 'none';
        document.getElementById('bmImageUrlInput').style.display = 'none';
      };
      r.readAsDataURL(file);
    }

    const imgUrlInput = document.getElementById('bmImageUrlInput');
    imgUrlInput.addEventListener('input', () => {
      const url = imgUrlInput.value.trim();
      const ip = document.getElementById('bmImagePreview');
      if (url.match(/\.(png|jpg|jpeg|gif|webp)(\?|$)/i)) {
        ip.innerHTML = `<img src="${url}" style="max-width:200px;max-height:120px;border-radius:6px" onerror="ip.innerHTML='Invalid image URL'">`;
        imageDataUrl = url;
      } else {
        ip.innerHTML = '';
      }
    });

    document.getElementById('bmCancel').addEventListener('click', () => overlay.remove());

    document.getElementById('bmModalAddBtn').addEventListener('click', () => {
      const activeTab = overlay.querySelector('.bm-tab.active').dataset.tab;
      if (activeTab === 'link') {
        let url = urlInput.value.trim();
        if (!url) return;
        if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
        try {
          const domain = new URL(url).hostname;
          const title = titleInput.value.trim() || domain;
          const icon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
          this.add('link', { url, title, icon });
          overlay.remove();
        } catch { alert('Invalid URL'); }
      } else {
        if (imageDataUrl) {
          this.add('image', { imageData: imageDataUrl, title: 'Image' });
          overlay.remove();
        }
      }
    });
  }

  showTutorial() {
    chrome.storage.local.get('bookmarkTutorialShown', (data) => {
      if (data.bookmarkTutorialShown) return;
      this._showTutorialModal();
    });
  }

  _showTutorialModal() {
    const overlay = document.createElement('div');
    overlay.className = 'bm-overlay';
    overlay.innerHTML = `
      <div class="bm-modal" style="max-width:420px">
        <h3>Bookmarks</h3>
        <div class="bm-modal-body" style="text-align:left;line-height:1.6">
          <p style="margin-bottom:6px"><b>Link bookmarks</b> — Click the <b>+</b> button, choose <b>Link</b>, paste a URL, and optionally set a title. The favicon loads automatically.</p>
          <p style="margin-bottom:6px"><b>Image bookmarks</b> — Click <b>+</b>, choose <b>Image</b>, then upload a file, paste an image URL, or drag & drop an image into the box.</p>
          <p style="margin-bottom:6px"><b>Move & resize</b> — Drag any bookmark to reposition. Image bookmarks have a resize handle at the bottom-right corner.</p>
          <p style="margin-bottom:0"><b>Edit & delete</b> — Hover a bookmark and click <b>⋯</b> for options. Image bookmarks also have a <b>×</b> button to delete.</p>
        </div>
        <div class="bm-modal-footer">
          <button class="bm-btn bm-btn-primary" id="bmTutDone">Got it</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.getElementById('bmTutDone').addEventListener('click', () => {
      chrome.storage.local.set({ bookmarkTutorialShown: true });
      overlay.remove();
    });
  }

  showTutorialHelp() {
    this._showTutorialModal();
  }
}
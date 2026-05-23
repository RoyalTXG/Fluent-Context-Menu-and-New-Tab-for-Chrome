const $ = id => document.getElementById(id);
const save = (key, val) => chrome.storage.sync.set({ [key]: val });

// Load saved settings
chrome.storage.sync.get(null, cfg => {
  if(cfg.theme)   setActiveTheme(cfg.theme);
  if(cfg.opacity) { $('opacity').value = cfg.opacity; $('opacityVal').textContent = cfg.opacity + '%'; }
  if(cfg.blur)    { $('blur').value    = cfg.blur;    $('blurVal').textContent    = cfg.blur    + 'px'; }
  if(cfg.radius)  { $('radius').value  = cfg.radius;  $('radiusVal').textContent  = cfg.radius  + 'px'; }
});

// Theme buttons
document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    setActiveTheme(btn.dataset.theme);
    save('theme', btn.dataset.theme);
  });
});

function setActiveTheme(name) {
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-theme="${name}"]`)?.classList.add('active');
}

// Sliders
$('opacity').oninput = e => { $('opacityVal').textContent = e.target.value + '%'; save('opacity', +e.target.value); };
$('blur').oninput    = e => { $('blurVal').textContent    = e.target.value + 'px'; save('blur',    +e.target.value); };
$('radius').oninput  = e => { $('radiusVal').textContent  = e.target.value + 'px'; save('radius',  +e.target.value); };

chrome.runtime.onMessage.addListener((msg) => {
  if(msg.action === 'openSettings') chrome.runtime.openOptionsPage();
});
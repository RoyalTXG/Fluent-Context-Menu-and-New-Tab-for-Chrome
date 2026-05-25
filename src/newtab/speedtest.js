class SpeedTest {
  constructor(container) {
    this.container = container;
    this.running = false;
  }

  async run() {
    if (this.running) return;
    this.running = true;

    this.container.innerHTML = '';
    const wrap = document.createElement('div');
    Object.assign(wrap.style, { display:'flex', flexDirection:'column', alignItems:'center', gap:'10px', padding:'12px 0' });

    const status = document.createElement('div');
    status.id = 'stStatus';
    Object.assign(status.style, { fontSize:'13px', color:'rgba(255,255,255,.4)' });
    status.textContent = 'Testing...';

    const result = document.createElement('div');
    result.id = 'stResult';
    Object.assign(result.style, { fontSize:'32px', fontWeight:'200', color:'#e8e8ee', letterSpacing:'-1px', display:'none' });

    const detail = document.createElement('div');
    detail.id = 'stDetail';
    Object.assign(detail.style, { fontSize:'11px', color:'rgba(255,255,255,.3)', display:'none' });

    const barOuter = document.createElement('div');
    Object.assign(barOuter.style, { width:'260px', height:'4px', borderRadius:'2px', background:'rgba(255,255,255,.08)', overflow:'hidden' });
    const bar = document.createElement('div');
    bar.id = 'stBar';
    Object.assign(bar.style, { height:'100%', width:'0%', background:'linear-gradient(90deg,#60a5fa,#4ade80)', borderRadius:'2px', transition:'width .3s' });
    barOuter.appendChild(bar);

    const btn = document.createElement('button');
    btn.id = 'stBtn';
    btn.textContent = '↻ Test Again';
    Object.assign(btn.style, { padding:'6px 16px', borderRadius:'8px', border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)', color:'rgba(255,255,255,.5)', cursor:'pointer', fontSize:'11px', display:'none' });
    btn.addEventListener('click', () => this.run());

    wrap.appendChild(status);
    wrap.appendChild(result);
    wrap.appendChild(detail);
    wrap.appendChild(barOuter);
    wrap.appendChild(btn);
    this.container.appendChild(wrap);

    try {
      // Use a single large reliable file and measure via HEAD for accurate size
      const urls = [
        { url: 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js', label: 'lodash' },
        { url: 'https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js', label: 'dayjs' },
        { url: 'https://cdn.jsdelivr.net/npm/axios@1.7.2/dist/axios.min.js', label: 'axios' },
        { url: 'https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js', label: 'react' },
      ];

      let totalBytes = 0;
      const startTime = performance.now();

      for (let i = 0; i < urls.length; i++) {
        status.textContent = `Downloading ${urls[i].label} (${i + 1}/${urls.length})`;
        bar.style.width = `${((i + 1) / urls.length) * 100}%`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const resp = await fetch(urls[i].url, { signal: controller.signal });
        const cl = resp.headers.get('Content-Length');
        const blob = await resp.blob();
        clearTimeout(timeout);
        totalBytes += cl ? parseInt(cl) : blob.size;
      }

      const elapsed = (performance.now() - startTime) / 1000;
      const mbps = (totalBytes * 8) / 1000000 / elapsed;

      status.style.display = 'none';
      result.style.display = 'block';
      detail.style.display = 'block';
      btn.style.display = 'block';
      bar.style.width = '100%';

      if (mbps >= 50) result.style.color = '#4ade80';
      else if (mbps >= 10) result.style.color = '#eab308';
      else result.style.color = '#f87171';

      result.textContent = `${mbps.toFixed(1)} Mbps`;
      detail.innerHTML = `Downloaded ${(totalBytes / 1000000).toFixed(2)} MB in ${elapsed.toFixed(1)}s`;
    } catch (err) {
      const el = document.getElementById('stStatus');
      if (el) {
        el.textContent = err.name === 'AbortError' ? 'Request timed out. Try again.' : 'Test failed. Check connection.';
      }
      bar.style.width = '0%';
      btn.style.display = 'block';
    }
    this.running = false;
  }
}
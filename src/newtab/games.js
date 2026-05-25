class SnakeGame {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.canvas.width = 300;
    this.canvas.height = 300;
    this.ctx = this.canvas.getContext('2d');
    this.gridSize = 15;
    this.tileCount = 20;
    this.running = false;
    this.loop = null;
    this.reset();
  }

  reset() {
    this.snake = [{ x: 10, y: 10 }];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.food = this.spawn();
    this.score = 0;
    this.over = false;
  }

  spawn() {
    const pos = { x: Math.floor(Math.random() * this.tileCount), y: Math.floor(Math.random() * this.tileCount) };
    return this.snake.some(s => s.x === pos.x && s.y === pos.y) ? this.spawn() : pos;
  }

  start() {
    this.container.innerHTML = '';
    const wrap = document.createElement('div');
    Object.assign(wrap.style, { display:'flex', flexDirection:'column', alignItems:'center', gap:'8px', padding:'10px 0' });

    const hdr = document.createElement('div');
    Object.assign(hdr.style, { display:'flex', justifyContent:'space-between', width:'300px', fontSize:'13px', color:'rgba(255,255,255,.5)' });
    hdr.innerHTML = `<span>🐍 Score: <b id="snakeScore" style="color:#e8e8ee">0</b></span><span style="cursor:pointer;color:#60a5fa" id="snakeRestart">↻ Restart</span>`;
    wrap.appendChild(hdr);

    wrap.appendChild(this.canvas);
    this.container.appendChild(wrap);
    this.reset();

    document.getElementById('snakeRestart')?.addEventListener('click', () => this.restart());
    this.running = true;
    this.loop = setInterval(() => this.tick(), 120);
    document.addEventListener('keydown', this.keyHandler = (e) => this.handleKey(e));
  }

  handleKey(e) {
    const k = e.key;
    if (k.startsWith('Arrow')) e.preventDefault();
    if (k === 'ArrowUp' && this.dir.y !== 1) this.nextDir = { x: 0, y: -1 };
    if (k === 'ArrowDown' && this.dir.y !== -1) this.nextDir = { x: 0, y: 1 };
    if (k === 'ArrowLeft' && this.dir.x !== 1) this.nextDir = { x: -1, y: 0 };
    if (k === 'ArrowRight' && this.dir.x !== -1) this.nextDir = { x: 1, y: 0 };
  }

  tick() {
    if (this.over) return;
    this.dir = { ...this.nextDir };
    const head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };
    if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount || this.snake.some(s => s.x === head.x && s.y === head.y)) {
      this.over = true;
      this.draw();
      return;
    }
    this.snake.unshift(head);
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score++;
      document.getElementById('snakeScore').textContent = this.score;
      this.food = this.spawn();
    } else {
      this.snake.pop();
    }
    this.draw();
  }

  draw() {
    const ctx = this.ctx, gs = this.gridSize;
    ctx.fillStyle = '#0f0f14';
    ctx.fillRect(0, 0, 300, 300);
    for (let i = 0; i < this.tileCount; i++) {
      for (let j = 0; j < this.tileCount; j++) {
        ctx.fillStyle = (i + j) % 2 === 0 ? '#13131a' : '#0f0f14';
        ctx.fillRect(i * gs, j * gs, gs, gs);
      }
    }
    this.snake.forEach((s, i) => {
      ctx.beginPath();
      ctx.arc(s.x * gs + gs / 2, s.y * gs + gs / 2, gs / 2 - 1, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? '#e8e8ee' : 'rgba(232,232,238,.6)';
      ctx.fill();
    });
    ctx.beginPath();
    ctx.arc(this.food.x * gs + gs / 2, this.food.y * gs + gs / 2, gs / 2 - 1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    ctx.fill();
    if (this.over) {
      ctx.fillStyle = 'rgba(0,0,0,.6)';
      ctx.fillRect(0, 0, 300, 300);
      ctx.fillStyle = '#e8e8ee';
      ctx.font = '18px -apple-system,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', 150, 140);
      ctx.font = '13px -apple-system,sans-serif';
      ctx.fillStyle = 'rgba(232,232,238,.5)';
      ctx.fillText(`Score: ${this.score}`, 150, 170);
    }
  }

  stop() {
    this.running = false;
    clearInterval(this.loop);
    if (this.keyHandler) document.removeEventListener('keydown', this.keyHandler);
  }

  restart() {
    this.stop();
    this.start();
  }
}

const WORDLE_WORDS = ['about','above','abuse','actor','acute','admit','adopt','adult','after','again','agent','agree','ahead','alarm','album','alert','alias','alien','align','alike','alive','allow','alone','along','alter','among','ample','angel','anger','angle','angry','apart','apple','apply','arena','argue','arise','armor','array','aside','asset','atlas','avoid','award','aware','awful','bacon','badge','basic','basis','beach','beard','beast','begin','being','below','bench','berry','birth','black','blade','blame','bland','blank','blast','blaze','bleak','blend','blind','blink','bliss','block','blood','bloom','blown','board','bonus','boost','booth','bound','brain','brand','brave','bread','break','breed','brick','brief','bring','broad','brook','brown','brush','buddy','build','built','bunch','burst','buyer','cabin','cable','candy','carry','catch','cause','cease','chain','chair','chalk','champ','chaos','charm','chart','chase','cheap','check','cheek','cheer','chief','child','china','civic','civil','claim','clash','class','clean','clear','clerk','click','cliff','climb','cling','clock','clone','close','cloth','cloud','coach','coast','color','comet','coral','could','count','court','cover','crack','craft','crash','crazy','cream','creek','crime','crisp','cross','crowd','crown','crush','curve','cycle','daily','dance','death','decay','delay','delta','demon','deny','depth','derby','devil','diary','dirty','donor','doubt','dough','draft','drain','drake','drama','drank','drawn','dream','dress','dried','drift','drink','drive','drone','drool','drove','dying','eager','early','earth','eight','elder','elect','elite','empty','enemy','enjoy','enter','entry','equal','equip','error','essay','event','every','exact','exile','exist','extra','fable','facet','faint','fairy','faith','false','fancy','fatal','fault','feast','fence','ferry','fetch','fever','fiber','field','fifth','fifty','fight','final','first','fixed','flame','flash','flesh','fleet','floor','flour','fluid','flush','focal','focus','force','forge','forth','forum','found','frame','frank','fraud','fresh','front','frost','froze','fruit','fully','funny','giant','given','glass','gleam','globe','gloom','glory','glove','grace','grade','graft','grain','grand','grant','grape','grasp','grass','grave','graze','great','greed','green','greet','grief','grill','grind','groan','gross','group','grove','grown','guard','guess','guide','guilt','habit','happy','harsh','haven','heart','heavy','hedge','hound','house','human','humor','hurry','ideal','image','imply','index','inner','input','issue','ivory','jewel','joint','judge','juice','knock','label','labor','large','laser','later','laugh','layer','learn','leave','legal','lemon','level','light','limit','linen','liver','local','logic','loose','lover','lower','loyal','lucky','lunar','lunch','magic','major','maker','manor','maple','march','marry','marsh','match','mayor','media','merit','metal','meter','might','minor','minus','mirth','model','money','month','moral','motor','mount','mouse','mouth','movie','music','naive','nerve','never','newly','night','noble','noise','north','notch','novel','nurse','occur','ocean','offer','often','olive','onset','opera','orbit','order','other','outer','oxide','ozone','paint','panel','panic','paper','party','pasta','patch','pause','peace','pearl','pedal','penny','phase','phone','photo','piano','piece','pilot','pinch','pitch','pixel','pizza','place','plain','plane','plant','plaza','plead','pluck','plumb','plume','plump','plunge','plunk','point','polar','pouch','pound','power','press','price','pride','prime','print','prior','prism','prize','probe','prone','proof','prose','proud','prove','psalm','pulse','punch','pupil','purge','purse','quest','queue','quick','quiet','quota','quote','radar','radio','raise','rally','ranch','range','rapid','ratio','reach','ready','realm','rebel','refer','reign','relax','relay','renal','renew','reply','rider','ridge','rifle','rigid','rival','river','roast','robot','rocky','rogue','rough','round','route','royal','ruler','rural','salad','sauce','scale','scene','scope','score','scout','screw','seize','sense','serve','setup','seven','shade','shaft','shake','shall','shame','shape','share','shark','sharp','shave','shear','sheep','sheer','sheet','shelf','shell','shift','shine','shirt','shock','shore','short','shout','shown','siege','sight','sigma','since','skill','skull','slash','slave','sleep','slice','slide','slope','small','smart','smell','smile','smoke','snack','snake','solid','solve','sorry','sound','south','space','spare','spark','speak','speed','spend','spent','spice','spike','spill','spine','spite','split','spoke','spoon','sport','spray','squad','stack','staff','stage','stain','stair','stake','stale','stalk','stall','stamp','stand','stare','stark','start','state','stead','steak','steal','steam','steel','steep','steer','stern','stick','stiff','still','sting','stock','stole','stone','stood','stool','store','storm','story','stout','stove','strap','straw','strip','stuck','stuff','stump','style','sugar','suite','sunny','super','surge','swamp','swarm','swear','sweat','sweep','sweet','swept','swift','swing','swirl','sword','swore','sworn','synod','table','taste','teach','tempo','tempt','tense','tenth','theft','their','theme','there','these','thick','thief','thing','think','third','thorn','those','three','threw','throw','thumb','tidal','tiger','tight','timer','tired','title','today','token','total','touch','towel','tower','toxic','trace','track','trade','trail','train','trait','trash','treat','trend','trial','tribe','trick','tried','troop','truck','truly','trump','trunk','trust','truth','tumor','twist','ultra','uncle','under','union','unite','unity','until','upper','upset','urban','usage','usual','valid','value','valve','vapor','vault','venue','verse','video','vigor','viral','visit','vista','vital','vivid','vocal','vodka','voice','voter','vowel','wafer','waste','watch','water','weary','weave','wedge','weigh','weird','whale','wheat','wheel','where','which','while','white','whole','whose','width','witch','woman','world','worry','worse','worst','worth','would','wound','write','wrong','wrote','yacht','yearn','yield','young','youth','zebra'];

class WordleGame {
  constructor(container) {
    this.container = container;
    this.word = '';
    this.guesses = [];
    this.attempt = 0;
    this.maxAttempts = 6;
    this.over = false;
    this.won = false;
    this.grid = [];
  }

  getDailyWord() {
    const start = new Date(2024, 0, 1);
    const diff = Math.floor((Date.now() - start.getTime()) / 86400000);
    return WORDLE_WORDS[diff % WORDLE_WORDS.length];
  }

  start() {
    this.word = this.getDailyWord();
    this.guesses = [];
    this.attempt = 0;
    this.over = false;
    this.won = false;
    this.container.innerHTML = '';
    const wrap = document.createElement('div');
    Object.assign(wrap.style, { display:'flex', flexDirection:'column', alignItems:'center', gap:'8px', padding:'10px 0' });

    const hdr = document.createElement('div');
    Object.assign(hdr.style, { fontSize:'13px', color:'rgba(255,255,255,.5)', display:'flex', gap:'12px' });
    hdr.innerHTML = `<span>Wordle</span><span style="cursor:pointer;color:#60a5fa" id="wordleRestart">↻ New</span>`;
    wrap.appendChild(hdr);

    const grid = document.createElement('div');
    grid.id = 'wordleGrid';
    Object.assign(grid.style, { display:'grid', gridTemplateColumns:'repeat(5,44px)', gap:'4px', margin:'6px 0' });
    for (let i = 0; i < 30; i++) {
      const c = document.createElement('div');
      Object.assign(c.style, { width:'44px', height:'44px', borderRadius:'6px', border:'1px solid rgba(255,255,255,.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', fontWeight:'600', color:'#e8e8ee', background:'rgba(255,255,255,.04)', transition:'all .2s' });
      grid.appendChild(c);
    }
    wrap.appendChild(grid);

    const inputRow = document.createElement('div');
    Object.assign(inputRow.style, { display:'flex', gap:'6px', alignItems:'center' });
    const inp = document.createElement('input');
    inp.id = 'wordleInput';
    inp.type = 'text';
    inp.maxLength = 5;
    inp.autocomplete = 'off';
    inp.spellcheck = false;
    Object.assign(inp.style, { width:'100px', padding:'8px 12px', borderRadius:'8px', border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.06)', color:'#e8e8ee', fontSize:'14px', outline:'none', textTransform:'uppercase', letterSpacing:'2px' });
    const btn = document.createElement('button');
    btn.textContent = 'Guess';
    Object.assign(btn.style, { padding:'8px 14px', borderRadius:'8px', border:'none', background:'rgba(100,160,255,.2)', color:'#90c4ff', cursor:'pointer', fontSize:'12px', fontWeight:'600' });
    inputRow.appendChild(inp);
    inputRow.appendChild(btn);

    const msg = document.createElement('div');
    msg.id = 'wordleMsg';
    Object.assign(msg.style, { fontSize:'12px', color:'rgba(255,255,255,.4)', minHeight:'18px', textAlign:'center' });

    wrap.appendChild(inputRow);
    wrap.appendChild(msg);
    this.container.appendChild(wrap);

    const submit = () => this.guess(inp.value.trim().toLowerCase());
    btn.addEventListener('click', submit);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    document.getElementById('wordleRestart')?.addEventListener('click', () => { this.start(); });
    inp.focus();
  }

  guess(word) {
    if (this.over || word.length !== 5) return;
    if (!WORDLE_WORDS.includes(word)) { document.getElementById('wordleMsg').textContent = 'Not in word list'; return; }
    const msg = document.getElementById('wordleMsg');
    msg.textContent = '';
    const cells = document.getElementById('wordleGrid').children;
    const target = this.word;
    const result = ['absent','absent','absent','absent','absent'];
    const used = [false,false,false,false,false];

    for (let i = 0; i < 5; i++) {
      if (word[i] === target[i]) { result[i] = 'correct'; used[i] = true; }
    }
    for (let i = 0; i < 5; i++) {
      if (result[i] === 'correct') continue;
      for (let j = 0; j < 5; j++) {
        if (!used[j] && word[i] === target[j]) { result[i] = 'present'; used[j] = true; break; }
      }
    }

    const colors = { correct: '#3a8c3a', present: '#8c7a3a', absent: 'rgba(255,255,255,.08)' };
    for (let i = 0; i < 5; i++) {
      const cell = cells[this.attempt * 5 + i];
      cell.textContent = word[i].toUpperCase();
      cell.style.background = colors[result[i]];
      cell.style.borderColor = 'transparent';
    }
    this.attempt++;

    if (result.every(r => r === 'correct')) {
      this.over = true;
      this.won = true;
      msg.textContent = `🎉 You got it! ${this.word.toUpperCase()}`;
      msg.style.color = '#4ade80';
    } else if (this.attempt >= this.maxAttempts) {
      this.over = true;
      msg.textContent = `The word was ${this.word.toUpperCase()}`;
      msg.style.color = '#f87171';
    }

    document.getElementById('wordleInput').value = '';
    if (!this.over) document.getElementById('wordleInput').focus();
  }
}
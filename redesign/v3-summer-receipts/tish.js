/* Tish, summer edition: a pixel seahorse who grows into a leafy sea dragon as visitors find treasures.
   Everything is drawn procedurally at low resolution and scaled with nearest-neighbour, so the pixel art stays crisp.
   Also exposes window.Pixel, which draws the treasure sprites in the same style. */
(() => {
  const W = 40, H = 46, SCALE = 2.25;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const C = {
    body: '#58D6A5', shade: '#2FAE7E', belly: '#A6EDCF', line: '#17493A', hi: '#C4F8E2', fin: '#8FE3C0',
    cheek: '#FF9DB0', white: '#FFFFFF', eye: '#0E2E24',
    leaf: '#C9E86B', leaf2: '#8CC34D', leafLine: '#3F6B22', sun: '#FFE07A',
  };

  /* ---------- pixel helpers ---------- */
  const key = (x, y) => x + ',' + y;
  function paintMask(ctx, mask, colorAt) {
    mask.forEach(k => {
      const [x, y] = k.split(',').map(Number);
      const edge = !mask.has(key(x + 1, y)) || !mask.has(key(x - 1, y)) || !mask.has(key(x, y + 1)) || !mask.has(key(x, y - 1));
      ctx.fillStyle = colorAt(x, y, edge); ctx.fillRect(x, y, 1, 1);
    });
  }
  function discs(mask, list, x0 = 0, y0 = 0, x1 = W, y1 = H) {
    list.forEach(([cx, cy, r]) => {
      for (let y = Math.max(y0, Math.floor(cy - r - 1)); y <= Math.min(y1 - 1, Math.ceil(cy + r + 1)); y++)
        for (let x = Math.max(x0, Math.floor(cx - r - 1)); x <= Math.min(x1 - 1, Math.ceil(cx + r + 1)); x++)
          if (Math.hypot(x + .5 - cx, y + .5 - cy) < r) mask.add(key(x, y));
    });
  }
  function capsule(mask, ax, ay, bx, by, r) {
    const n = Math.ceil(Math.hypot(bx - ax, by - ay) * 2);
    const list = []; for (let i = 0; i <= n; i++) list.push([ax + (bx - ax) * i / n, ay + (by - ay) * i / n, r]);
    discs(mask, list);
  }
  const px = (ctx, x, y, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); };

  /* ---------- the seahorse ---------- */
  // spine from neck to the curled tail: [x, y, radius]
  const SPINE = [[19.6, 15.8, 3.8], [21.6, 19.6, 5.4], [23.3, 24.2, 6.3], [23.1, 29.2, 5.7], [21, 33.2, 4.4], [18.3, 36.1, 3.3],
    [16, 38.9, 2.6], [15.3, 41.8, 2.1], [16.9, 43.7, 1.8], [19.3, 43.5, 1.5], [20.6, 41.8, 1.3], [19.8, 40.3, 1.1]];
  // where fronds sprout as Tish grows: [x, y, angle]
  const FRONDS = [[18.2, 2.8, -2.1], [14.2, 11.6, -2.8], [17.2, 21.4, -2.9], [29.2, 23.4, -.2], [16.6, 32.4, 2.8], [25.6, 33.2, .7]];

  function seahorse(ctx, t, o) {
    const sway = reduce ? 0 : Math.sin(t / 900) * .5;
    const spine = SPINE.map(([x, y, r], i) => {
      const k = Math.max(0, i - 4);
      const tail = reduce ? 0 : Math.sin(t / 620 - i * .55) * k * .11;
      return [x + tail + sway * (i / SPINE.length), y, r];
    });
    const mask = new Set();
    discs(mask, spine);
    discs(mask, [[19.4, 9.4, 5.2], [16.6, 11, 3.6], [18.2, 4.2, 1.8], [20.4, 3.8, 1.3]]);
    capsule(mask, 23.2, 11.2, 29.4, 13.6, 1.75);
    discs(mask, [[30.2, 13.8, 2.05]]);

    // fronds are drawn behind the body so they read as growing out of it
    const n = Math.min(o.fronds || 0, FRONDS.length);
    for (let i = 0; i < n; i++) frond(ctx, t, FRONDS[i], i, o.growT && i === n - 1 ? o.growT : 1);

    const sp = y => { let best = spine[0]; spine.forEach(s => { if (Math.abs(s[1] - y) < Math.abs(best[1] - y)) best = s; }); return best; };
    paintMask(ctx, mask, (x, y, edge) => {
      if (edge) return C.line;
      if (y < 16) return (x < 19 && y < 9 && x > 15) ? C.hi : (y > 12 && x < 18 ? C.shade : C.body);
      const [sx, , r] = sp(y);
      if (x + .5 > sx + r * .28 && y < 35) return y % 3 === 0 ? C.shade : C.belly;
      if (x + .5 < sx - r * .38) return C.shade;
      return C.body;
    });

    // dorsal fin: fluttering rays off the back
    for (let y = 21; y <= 29; y++) {
      let bx = 40; mask.forEach(k => { const [x, yy] = k.split(',').map(Number); if (yy === y && x < bx) bx = x; });
      const L = Math.round(2 + 2.2 * (reduce ? .6 : .5 + .5 * Math.sin(t / (o.moving ? 55 : 110) + y * .9)) - Math.abs(y - 25) * .3);
      for (let k = 1; k <= L; k++) px(ctx, bx - k, y, k === L ? C.line : C.fin);
    }
    // face
    const ex = 20.6, ey = 8;
    if (o.sleep || o.blink) { px(ctx, ex, ey + 1, C.eye); px(ctx, ex + 1, ey + 1, C.eye); }
    else { px(ctx, ex, ey, C.white); px(ctx, ex + 1, ey, C.eye); px(ctx, ex, ey + 1, C.eye); px(ctx, ex + 1, ey + 1, C.eye); }
    px(ctx, 22, 12, C.cheek);
    if (o.happy) { px(ctx, 31.4, 15, C.line); px(ctx, 32, 14, C.line); }
    else px(ctx, 32, 14.4, C.line);
    // coronet sparkle once fully grown
    if (o.crown) { px(ctx, 24, 1, C.sun); px(ctx, 23, 2, C.sun); px(ctx, 25, 2, C.sun); px(ctx, 24, 3, C.sun); }

    let x0 = W, x1 = 0, y0 = H, y1 = 0;
    mask.forEach(k => { const [x, y] = k.split(',').map(Number); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
    return { x0: x0 - 4, x1: x1 + 2, y0: y0 - 2, y1: y1 + 1 };
  }

  function frond(ctx, t, [ax, ay, a], i, grow) {
    const ang = a + (reduce ? 0 : Math.sin(t / 540 + i * 1.7) * .22);
    const len = 2.6 * grow, cx = ax + Math.cos(ang) * len, cy = ay + Math.sin(ang) * len;
    for (let k = 0; k <= len; k += .6) px(ctx, ax + Math.cos(ang) * k, ay + Math.sin(ang) * k, C.leafLine);
    const rx = 3.8 * grow, ry = 2 * grow, lx = cx + Math.cos(ang) * rx * .8, ly = cy + Math.sin(ang) * rx * .8;
    const ca = Math.cos(-ang), sa = Math.sin(-ang);
    for (let y = Math.floor(ly - rx - 1); y <= ly + rx + 1; y++) for (let x = Math.floor(lx - rx - 1); x <= lx + rx + 1; x++) {
      const dx = x + .5 - lx, dy = y + .5 - ly, u = dx * ca - dy * sa, v = dx * sa + dy * ca, d = Math.hypot(u / rx, v / ry);
      if (d > 1) continue;
      px(ctx, x, y, d > .72 ? C.leafLine : (v > 0 ? C.leaf2 : C.leaf));
    }
  }

  /* ---------- treasure sprites (16×16) ---------- */
  const TC = { line: '#4A2A1C', sand: '#F6D7A8', sand2: '#E9B97A', coral: '#FF9C7A', coral2: '#F2735A', pearl: '#FFF4E6', glass: '#9FE3D0', glass2: '#5CC4AE', sky: '#DDF6FF', cork: '#B98A5A' };
  const SPRITES = {
    scallop(ctx) {
      const m = new Set();
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const dx = x + .5 - 8, dy = y + .5 - 10.5; if (dy < 1.5 && Math.hypot(dx, dy * 1.12) < 7.2) m.add(key(x, y)); }
      discs(m, [[8, 12.6, 2.2]]); discs(m, [[5.2, 12.8, 1.4], [10.8, 12.8, 1.4]]);
      paintMask(ctx, m, (x, y, e) => e ? TC.line : (Math.abs(((Math.atan2(y + .5 - 12, x + .5 - 8) + Math.PI) * 5) % 2 - 1) < .32 ? TC.coral2 : (y < 7 && x < 8 ? TC.pearl : TC.coral)));
    },
    starfish(ctx) {
      const m = new Set();
      for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * Math.PI * 2 / 5; const l = []; for (let j = 0; j <= 10; j++) l.push([8 + Math.cos(a) * j * .62, 8.8 + Math.sin(a) * j * .62, 2.6 - j * .09]); discs(m, l); }
      discs(m, [[8, 8.8, 3]]);
      paintMask(ctx, m, (x, y, e) => e ? TC.line : ((x * 7 + y * 3) % 5 === 0 ? TC.sand : (y > 9 ? TC.coral2 : TC.coral)));
    },
    seaglass(ctx) {
      const m = new Set();
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const dx = x + .5 - 8, dy = y + .5 - 8.5; if (Math.abs(dx * .8 + dy * .3) + Math.abs(dy * .9 - dx * .2) < 6.4) m.add(key(x, y)); }
      paintMask(ctx, m, (x, y, e) => e ? '#2B6B5E' : (x + y < 12 ? TC.sky : (x + y < 16 ? TC.glass : TC.glass2)));
    },
    conch(ctx) {
      const m = new Set();
      discs(m, [[7, 9, 4.6], [10.2, 6.6, 3.2], [12.4, 4.6, 1.9], [13.6, 3.2, 1.1], [4.4, 12.2, 2.6], [2.6, 13.8, 1.4]]);
      paintMask(ctx, m, (x, y, e) => e ? TC.line : ((x - y + 20) % 4 === 0 ? TC.sand2 : (x < 7 && y > 8 ? TC.coral : TC.sand)));
      px(ctx, 6, 10, TC.coral2); px(ctx, 7, 11, TC.coral2); px(ctx, 5, 11, TC.pearl);
    },
    sanddollar(ctx) {
      const m = new Set(); discs(m, [[8, 8, 6.6]]);
      paintMask(ctx, m, (x, y, e) => e ? TC.line : (x + y < 11 ? TC.pearl : TC.sand));
      for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * Math.PI * 2 / 5; for (let r = 1.6; r < 4.6; r += .8) px(ctx, 7.6 + Math.cos(a) * r, 7.6 + Math.sin(a) * r, TC.sand2); }
      px(ctx, 7.6, 7.6, TC.line);
    },
    bottle(ctx) {
      const m = new Set();
      discs(m, [[8, 10.4, 4.2], [8, 12, 4.2]]); capsule(m, 8, 3.4, 8, 7, 1.6);
      paintMask(ctx, m, (x, y, e) => e ? '#2B6B5E' : (y < 5 ? TC.cork : (x < 7 && y < 11 ? TC.sky : TC.glass)));
      for (let y = 9; y <= 13; y++) px(ctx, 9, y, TC.pearl); px(ctx, 10, 10, TC.pearl); px(ctx, 10, 12, TC.pearl);
    },
  };
  const spriteCache = {};
  function sprite(id, scale = 4, silhouette = false) {
    const k = id + scale + silhouette; if (spriteCache[k]) return spriteCache[k];
    const c = document.createElement('canvas'); c.width = 16; c.height = 16; const g = c.getContext('2d');
    SPRITES[id] && SPRITES[id](g);
    if (silhouette) { g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgba(20,20,19,.16)'; g.fillRect(0, 0, 16, 16); }
    const out = document.createElement('canvas'); out.width = 16 * scale; out.height = 16 * scale;
    const o = out.getContext('2d'); o.imageSmoothingEnabled = false; o.drawImage(c, 0, 0, out.width, out.height);
    return (spriteCache[k] = out.toDataURL());
  }
  window.Pixel = { sprite };

  /* ---------- public: static mark for the nav ---------- */
  window.tishMark = (o = {}) => {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    seahorse(c.getContext('2d'), o.t || 0, o);
    return c.toDataURL();
  };

  /* ---------- runtime ---------- */
  const root = document.getElementById('tish'); if (!root) return;
  const canvas = document.getElementById('tishCanvas'), ctx = canvas.getContext('2d');
  canvas.width = W; canvas.height = H;
  const bubble = document.getElementById('tishBubble');
  const hit = document.createElement('div'); hit.className = 'hit'; root.appendChild(hit);
  root.style.width = W * SCALE + 'px'; root.style.height = H * SCALE + 'px';
  canvas.style.width = W * SCALE + 'px'; canvas.style.height = H * SCALE + 'px';

  const TOTAL = 6;
  const S = {
    stage: 'horse', found: new Set(), fronds: 0, growAt: 0, x: 90, y: innerHeight - 8, dir: 1, perch: null, off: .5, target: .5,
    jump: null, nextWander: 0, sleepUntil: 0, happyUntil: 0, hop: 0, blinkAt: 2000, talkCooldown: 0,
    mouse: null, lastMove: 0, vx: 0, vy: 0, bubbles: [], nextBubble: 0,
  };
  const zones = { printer: [.74, .9], contact: [.08, .4], sign: [.64, .76], closing: [1.2, 1.45], intro: [.62, .86], stage: [.62, .9], minis: [.3, .7], board: [.04, .3], bento: [.1, .5], shelf: [.1, .6], darkroom: [.1, .3], default: [.08, .92] };

  function pickPerch() {
    let best = null, bestScore = Infinity;
    document.querySelectorAll('[data-perch]').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < 200 || r.top > innerHeight - 50 || r.width < 120 || r.bottom < 0) return;
      const score = Math.abs(r.top - innerHeight * .45);
      if (score < bestScore) { bestScore = score; best = el; }
    });
    return best;
  }
  function spot(el, off) {
    if (!el) return { x: 60 + off * 140, y: innerHeight - 10 };
    const r = el.getBoundingClientRect(), z = zones[el.dataset.perch] || zones.default;
    const k = z[0] + (z[1] - z[0]) * off;
    return { x: Math.min(r.left + r.width * k, innerWidth - 70), y: r.top + 2 };
  }

  /* ---------- speech ---------- */
  let bubbleTimer;
  const prog = () => `<div class="prog">${Array.from({ length: TOTAL }, (_, i) => `<i class="${i < S.fronds ? 'on' : ''}"></i>`).join('')}</div>`;
  function say(html, { actions = [], hold = 3600, progress = false } = {}) {
    clearTimeout(bubbleTimer);
    bubble.innerHTML = `<div>${html}</div>` + (progress ? prog() : '') +
      (actions.length ? `<div class="acts">${actions.map((a, i) => `<button data-i="${i}" class="${a.primary ? 'pri' : ''}">${a.label}</button>`).join('')}</div>` : '');
    bubble.querySelectorAll('button').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); actions[+b.dataset.i].run(); }));
    bubble.classList.add('on');
    if (hold) bubbleTimer = setTimeout(() => bubble.classList.remove('on'), hold);
  }
  const hush = () => bubble.classList.remove('on');
  const go = id => { hush(); window.App && window.App.go(id); };

  // "click me and I'll take you there"
  function whereTo() {
    say('Where to? Hop on.', { hold: 0, actions: [
      { label: 'Work', primary: true, run: () => go('work') }, { label: 'Process', run: () => go('process') },
      { label: 'Journey', run: () => go('journey') }, { label: 'About her', run: () => go('about') }, { label: 'Say hi', run: () => go('contact') }] });
  }
  function menu() {
    if (S.stage === 'dragon') {
      say('Look at me! A real leafy sea dragon. Thank you for exploring. Want to say hi to Aatisha?', { hold: 0, actions: [
        { label: 'Copy her email', primary: true, run: () => { window.App?.copyEmail(); hush(); } },
        { label: 'Where to?', run: whereTo }] });
      return;
    }
    const left = TOTAL - S.fronds;
    say(`Hi! I’m <b>Tish</b>, a seahorse… for now. There are ${TOTAL} treasures tucked around this page. Each one grows me a leaf. <span class="dim">${S.fronds}/${TOTAL}</span>`, { hold: 0, progress: true, actions: [
      { label: 'Where to?', primary: true, run: whereTo },
      { label: left ? 'A hint, please' : 'All found!', run: () => { hush(); window.App?.hint(); } },
      { label: 'Nap', run: () => { S.sleepUntil = performance.now() + 20000; say('zzz… (bubbles)', { hold: 1400 }); } },
    ] });
  }
  const onPoke = e => { e.stopPropagation(); S.hop = 1.6; S.happyUntil = performance.now() + 900; S.sleepUntil = 0; puff(3); bubble.classList.contains('on') ? hush() : menu(); };
  hit.addEventListener('click', onPoke);
  root.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPoke(e); } });
  document.addEventListener('click', e => { if (!bubble.contains(e.target)) hush(); });
  addEventListener('pointermove', e => { S.mouse = { x: e.clientX, y: e.clientY }; S.lastMove = performance.now(); }, { passive: true });

  /* ---------- reactions & growth ---------- */
  const reactions = {
    receipt: 'Ooh, a fresh receipt. Still warm.', story: 'A good story! Read to the end… I heard something washes up there.',
    process: 'So many sticky notes. Seahorses love a good cluster.', journey: 'So many stops. Where to next?', about: 'Summer prints! I’m in none of them. Rude.',
    cmdk: 'Keyboard person! Respect.',
  };
  function discover(k) {
    if (S.found.has(k)) return;
    S.found.add(k);
    const now = performance.now();
    S.hop = 1.4; S.happyUntil = now + 1200;
    if (reactions[k] && now > S.talkCooldown && S.stage !== 'dragon') { S.talkCooldown = now + 8000; say(reactions[k], { hold: 3200 }); }
  }
  function grow(n, { quiet = false } = {}) {
    const was = S.fronds; S.fronds = Math.max(0, Math.min(TOTAL, n));
    if (S.fronds > was && !quiet) { S.growAt = performance.now(); S.hop = 1.8; S.happyUntil = S.growAt + 1600; puff(5); }
    if (S.fronds >= TOTAL && S.stage !== 'dragon') {
      S.stage = 'dragon';
      if (!quiet) { burst(S.x, S.y - 60); document.dispatchEvent(new CustomEvent('tish:grown')); }
    } else if (S.fronds < TOTAL) S.stage = 'horse';
  }
  function puff(n) { if (reduce) return; for (let i = 0; i < n; i++) S.bubbles.push({ x: 31 + Math.random() * 2, y: 11, r: Math.random() < .4 ? 1.5 : 1, vx: (Math.random() - .3) * .02, t0: performance.now() + i * 140 }); }
  function burst(x, y) {
    if (reduce) return;
    for (let i = 0; i < 24; i++) {
      const d = document.createElement('i'), a = Math.random() * Math.PI * 2, r = 50 + Math.random() * 90, s = 4 + Math.random() * 5;
      Object.assign(d.style, { position: 'fixed', left: x + 'px', top: y + 'px', width: s + 'px', height: s + 'px', zIndex: 62, pointerEvents: 'none', background: [C.body, C.sun, C.leaf, C.cheek][i % 4], transition: 'transform 1s cubic-bezier(.16,1,.3,1), opacity 1s' });
      document.body.appendChild(d);
      requestAnimationFrame(() => { d.style.transform = `translate(${Math.cos(a) * r}px, ${Math.sin(a) * r}px) rotate(${Math.random() * 180}deg)`; d.style.opacity = 0; });
      setTimeout(() => d.remove(), 1100);
    }
  }

  /* ---------- loop ---------- */
  const ease = k => 1 - Math.pow(1 - k, 3);
  let last = performance.now();
  function tick(t) {
    const dt = Math.min(50, t - last); last = t;
    const sleeping = t < S.sleepUntil;
    let moving = false, lift = 0;

    if (S.stage === 'dragon' && S.mouse && t - S.lastMove < 2600) {
      // fully grown: drifts after the cursor like it's swimming
      const tx = S.mouse.x + 56, ty = S.mouse.y + 40;
      S.vx += (tx - S.x) * .0025 * dt / 16; S.vy += (ty - S.y) * .0025 * dt / 16;
      S.vx *= .9; S.vy *= .9; S.x += S.vx; S.y += S.vy; S.perch = null; S.jump = null;
      moving = Math.hypot(S.vx, S.vy) > .6; if (Math.abs(S.vx) > .3) S.dir = S.vx > 0 ? 1 : -1;
    } else if (S.jump) {
      const k = Math.min(1, (t - S.jump.t0) / S.jump.dur), to = spot(S.perch, S.off);
      S.x = S.jump.x + (to.x - S.jump.x) * ease(k);
      S.y = S.jump.y + (to.y - S.jump.y) * ease(k) - Math.sin(k * Math.PI) * S.jump.h;
      S.dir = to.x >= S.jump.x ? 1 : -1; moving = true;
      if (k >= 1) S.jump = null;
    } else {
      const p = pickPerch();
      if (p !== S.perch) {
        const from = { x: S.x, y: S.y };
        S.perch = p; S.off = S.target = .5;
        const to = spot(p, S.off);
        if (reduce || Math.hypot(to.x - from.x, to.y - from.y) > innerHeight * 1.2) { S.x = to.x; S.y = to.y; }
        else { S.jump = { t0: t, dur: 900, x: from.x, y: from.y, h: 30 + Math.min(80, Math.abs(to.y - from.y) * .15) }; puff(2); }
      } else {
        if (!sleeping && t > S.nextWander) { S.target = Math.random(); S.nextWander = t + 3500 + Math.random() * 5000; }
        const z = S.perch ? (zones[S.perch.dataset.perch] || zones.default) : [0, 1];
        const w = S.perch ? S.perch.getBoundingClientRect().width * (z[1] - z[0]) : 140;
        const diff = S.target - S.off, step = (.02 * dt / 16) * 60 / Math.max(60, w);
        if (!sleeping && !reduce && Math.abs(diff) * w > 1.5) { S.off += Math.sign(diff) * Math.min(Math.abs(diff), step); moving = true; S.dir = Math.sign(diff) || S.dir; }
        const at = spot(S.perch, S.off); S.x = at.x; S.y = at.y;
        if (!moving && S.mouse && Math.abs(S.mouse.x - S.x) < 280 && Math.abs(S.mouse.y - S.y) < 220) S.dir = S.mouse.x > S.x ? 1 : -1;
      }
    }
    // swimming lifts Tish off the edge; resting lets the tail hold on
    S.lift = (S.lift || 0) + ((moving ? 7 : 0) - (S.lift || 0)) * .08;
    lift = S.lift + (reduce ? 0 : Math.sin(t / 700) * (moving ? 1.5 : .8));
    S.hop *= .86;
    if (!reduce && !sleeping && t > S.nextBubble) { puff(1 + (Math.random() < .3)); S.nextBubble = t + 2600 + Math.random() * 4000; }

    // draw
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (S.dir < 0) { ctx.translate(W, 0); ctx.scale(-1, 1); }
    const blink = t > S.blinkAt && t < S.blinkAt + 140; if (t > S.blinkAt + 140) S.blinkAt = t + 2200 + Math.random() * 3000;
    const growT = S.growAt && t - S.growAt < 700 ? Math.max(.2, ease((t - S.growAt) / 700)) : 0;
    const box = seahorse(ctx, t, { moving, sleep: sleeping, blink, happy: t < S.happyUntil, fronds: S.fronds, growT, crown: S.stage === 'dragon' });
    // bubbles rise from the snout
    S.bubbles = S.bubbles.filter(b => {
      const age = t - b.t0; if (age < 0) return true; if (age > 1500) return false;
      const by = b.y - age * .012, bx = b.x + Math.sin(age / 160) * .6 + age * b.vx;
      ctx.fillStyle = 'rgba(23,73,58,.55)';
      if (b.r > 1) { ctx.fillRect(Math.round(bx), Math.round(by) - 1, 1, 1); ctx.fillRect(Math.round(bx) - 1, Math.round(by), 1, 1); ctx.fillRect(Math.round(bx) + 1, Math.round(by), 1, 1); ctx.fillRect(Math.round(bx), Math.round(by) + 1, 1, 1); }
      else ctx.fillRect(Math.round(bx), Math.round(by), 1, 1);
      return by > 0;
    });
    ctx.restore();
    if (sleeping) { const z = (t / 900) % 1; ctx.fillStyle = C.line; ctx.font = '6px monospace'; ctx.globalAlpha = 1 - z; ctx.fillText('z', (S.dir < 0 ? 4 : 30) + z * 3, 8 - z * 6); ctx.globalAlpha = 1; }

    const hopY = S.hop * 4;
    const ox = S.x - (W * SCALE) / 2, oy = S.y - H * SCALE + 2 - lift - hopY;
    root.style.transform = `translate(${ox}px, ${oy}px)`;
    const bx0 = S.dir < 0 ? W - box.x1 : box.x0, bx1 = S.dir < 0 ? W - box.x0 : box.x1;
    Object.assign(hit.style, { left: bx0 * SCALE + 'px', top: box.y0 * SCALE + 'px', width: (bx1 - bx0) * SCALE + 'px', height: (box.y1 - box.y0) * SCALE + 'px' });
    if (bubble.classList.contains('on')) {
      const bw = bubble.offsetWidth, bh = bubble.offsetHeight;
      const top = oy + box.y0 * SCALE - 12 - bh;
      bubble.style.left = Math.max(12, Math.min(innerWidth - bw - 12, S.x - 40)) + 'px';
      bubble.style.top = Math.max(84, top) + 'px';
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  window.Tish = {
    discover, say, hush, grow, menu,
    get grown() { return S.stage === 'dragon'; },
    react(type) { if (type === 'print' || type === 'happy') { S.hop = 1.8; S.happyUntil = performance.now() + 1400; puff(2); } },
  };
})();

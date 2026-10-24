/* Tish: a pixel caterpillar that grows into a butterfly as visitors explore.
   Sprites are drawn procedurally at 48×36 and scaled up with nearest-neighbour, so the pixel art stays crisp. */
(() => {
  const W = 48, H = 36, SCALE = 2.5;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const C = { body: '#58D6A5', shade: '#2FAE7E', line: '#17493A', hi: '#C4F8E2', cheek: '#FF9DB0', dot: '#FFE07A', cocoon: '#D8C08A', cocoonD: '#A98C52', white: '#FFFFFF' };

  /* ---------- pixel helpers ---------- */
  function px(ctx, x, y, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
  function blob(ctx, cx, cy, rx, ry, fill, line, shade, hi) {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry, d = Math.hypot(dx, dy);
        if (d > 1) continue;
        const edge = d > 1 - 1.15 / Math.min(rx, ry);
        let c = edge ? line : (shade && dy > .35 ? shade : fill);
        if (!edge && hi && dx < -.1 && dy < -.25 && d < .75) c = hi;
        ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  /* ---------- sprites ---------- */
  function caterpillar(ctx, t, o) {
    const n = o.segments, gap = 5.2, rB = 3.7, rH = 4.7;
    const len = (n - 1) * gap + rH * 2;
    const x0 = W / 2 - len / 2 + rB, base = 33;
    for (let i = 0; i < n; i++) {
      const isHead = i === n - 1;
      const r = isHead ? rH : rB;
      const lift = o.moving ? Math.max(0, Math.sin(t / 110 - i * .95)) * 2.2 : (o.sleep ? 0 : Math.max(0, Math.sin(t / 700 - i * .6)) * .6);
      const squash = o.hop ? -o.hop : 0;
      const cx = x0 + i * gap + (o.moving ? Math.sin(t / 110 - i * .95) * .5 : 0);
      const cy = base - r - lift + squash * (isHead ? 1 : .6);
      blob(ctx, cx, cy, r, r * (isHead ? 1 : .92), C.body, C.line, C.shade, C.hi);
      if (!isHead) { px(ctx, cx - .5, cy - r + 1.5, C.dot); px(ctx, cx - .5, base, C.line); px(ctx, cx + 1.2, base, C.line); }
      if (isHead) {
        // antennae
        const wob = Math.sin(t / 260) * .8;
        for (let k = 1; k <= 4; k++) { px(ctx, cx - .3 + k * .15, cy - r - k + .5, C.line); px(ctx, cx + 2 + k * .45 + wob * k / 4, cy - r - k + 1.2, C.line); }
        px(ctx, cx + .3, cy - r - 4.2, C.line); px(ctx, cx + 4 + wob, cy - r - 3, C.line);
        // face
        const ex = cx + 1.4, ey = cy - 1.2;
        if (o.sleep || o.blink) { px(ctx, ex, ey + 1, C.line); px(ctx, ex + 1, ey + 1, C.line); }
        else { px(ctx, ex, ey, C.line); px(ctx, ex, ey + 1, C.line); px(ctx, ex + 1, ey, C.line); px(ctx, ex + 1, ey + 1, C.line); px(ctx, ex, ey, C.white); }
        px(ctx, cx + 3.2, cy + 1.4, C.cheek);
        if (o.happy) { px(ctx, cx + 2, cy + 2, C.line); px(ctx, cx + 3, cy + 2.6, C.line); px(ctx, cx + 4, cy + 2, C.line); }
        else px(ctx, cx + 2.6, cy + 2.2, C.line);
      }
    }
    return { x0: x0 - rB - 1, x1: x0 + (n - 1) * gap + rH + 5, y0: base - rH * 2 - 6, y1: base + 1 };
  }

  function cocoon(ctx, t, o) {
    const cx = W / 2, top = 8, sway = reduce ? 0 : Math.sin(t / 500) * 1.2, glow = o.glow;
    for (let y = 0; y < top; y++) px(ctx, cx + sway * y / top * .3, y + 4, C.line);
    const rx = 6, ry = 10, cy = top + 4 + ry;
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
      const off = sway * (y - (cy - ry)) / (ry * 2);
      for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
        const dx = (x + .5 - cx - off) / rx, dy = (y + .5 - cy) / ry, d = Math.hypot(dx, dy);
        if (d > 1) continue;
        let c = d > .86 ? C.line : ((y % 4 === 0) ? C.cocoonD : C.cocoon);
        if (glow && d < .6 && Math.random() < glow) c = C.hi;
        ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1);
      }
    }
    return { x0: cx - rx - 2, x1: cx + rx + 2, y0: 4, y1: cy + ry + 1 };
  }

  function butterfly(ctx, t, o, cx = W / 2, cy = 18) {
    const f = o.still ? 1 : .28 + .72 * Math.abs(Math.sin(t / (o.rest ? 520 : 95)));
    [[-1], [1]].forEach(([s]) => {
      blob(ctx, cx + s * (1 + 6.5 * f), cy - 3, 7 * f + .6, 6.4, C.body, C.line, C.shade, C.hi);
      blob(ctx, cx + s * (1 + 4.6 * f), cy + 5, 5 * f + .6, 4.6, C.body, C.line, C.shade, null);
      if (f > .5) { px(ctx, cx + s * (1 + 7 * f), cy - 4, C.dot); px(ctx, cx + s * (1 + 4.5 * f), cy + 5, C.white); }
    });
    for (let y = cy - 6; y <= cy + 8; y++) { px(ctx, cx - .5, y, C.line); px(ctx, cx + .5, y, C.line); }
    blob(ctx, cx, cy - 8, 2.2, 2.2, C.line, C.line);
    for (let k = 1; k <= 4; k++) { px(ctx, cx - 1 - k * .7, cy - 10 - k, C.line); px(ctx, cx + 1 + k * .7, cy - 10 - k, C.line); }
    return { x0: cx - 15, x1: cx + 15, y0: cy - 15, y1: cy + 11 };
  }

  /* ---------- public: static mark for the nav ---------- */
  window.tishMark = () => {
    const c = document.createElement('canvas'); c.width = 32; c.height = 27;
    butterfly(c.getContext('2d'), 0, { still: true }, 16, 14);
    return c.toDataURL();
  };

  /* ---------- runtime ---------- */
  const root = document.getElementById('tish'); if (!root) return;
  const canvas = document.getElementById('tishCanvas'), ctx = canvas.getContext('2d');
  const bubble = document.getElementById('tishBubble');
  const hit = document.createElement('div'); hit.className = 'hit'; root.appendChild(hit);
  root.style.width = W * SCALE + 'px'; root.style.height = H * SCALE + 'px';
  canvas.style.width = W * SCALE + 'px'; canvas.style.height = H * SCALE + 'px';

  const KEYS = ['receipt', 'story', 'process', 'journey', 'about', 'cmdk'];
  const S = {
    stage: 'cat', found: new Set(), x: 90, y: innerHeight - 8, dir: 1, perch: null, off: .5, target: .5,
    jump: null, nextWander: 0, sleepUntil: 0, happyUntil: 0, hop: 0, blinkAt: 2000, talkCooldown: 0,
    mouse: null, lastMove: 0, vx: 0, vy: 0, emergeAt: 0,
  };
  const zones = { printer: [.74, .9], contact: [.08, .4], sign: [.64, .76], closing: [1.2, 1.45], default: [.08, .92] };

  function perchRect(el) {
    const r = el.getBoundingClientRect();
    const z = zones[el.dataset.perch] || zones.default;
    return { r, z };
  }
  function pickPerch() {
    let best = null, bestScore = Infinity;
    document.querySelectorAll('[data-perch]').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < 90 || r.top > innerHeight - 50 || r.width < 120 || r.bottom < 0) return;
      const score = Math.abs(r.top - innerHeight * .45);
      if (score < bestScore) { bestScore = score; best = el; }
    });
    return best;
  }
  function spot(el, off) {
    if (!el) return { x: 60 + off * 140, y: innerHeight - 6 };
    const { r, z } = perchRect(el);
    const k = z[0] + (z[1] - z[0]) * off;
    return { x: Math.min(r.left + r.width * k, innerWidth - 70), y: r.top + 2 };
  }

  /* ---------- speech ---------- */
  let bubbleTimer;
  function say(html, { actions = [], hold = 3600, progress = false } = {}) {
    clearTimeout(bubbleTimer);
    bubble.innerHTML = `<div>${html}</div>` +
      (progress ? `<div class="prog">${KEYS.map((k, i) => `<i class="${i < Math.min(S.found.size, KEYS.length) ? 'on' : ''}"></i>`).join('')}</div>` : '') +
      (actions.length ? `<div class="acts">${actions.map((a, i) => `<button data-i="${i}" class="${a.primary ? 'pri' : ''}">${a.label}</button>`).join('')}</div>` : '');
    bubble.querySelectorAll('button').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); actions[+b.dataset.i].run(); }));
    bubble.classList.add('on');
    if (hold) bubbleTimer = setTimeout(() => bubble.classList.remove('on'), hold);
  }
  const hush = () => bubble.classList.remove('on');

  function menu() {
    if (S.stage === 'fly') {
      say('I made it! Thanks for exploring. Want to say hi to Aatisha?', { hold: 0, actions: [
        { label: 'Copy her email', primary: true, run: () => { window.App?.copyEmail(); hush(); } },
        { label: 'Keep flying', run: hush }] });
      return;
    }
    if (S.stage === 'cocoon') { say('Shh… I’m becoming something.', { hold: 2400 }); return; }
    say(`Hi! I’m <b>Tish</b>. I’m a caterpillar… for now. Look around and I’ll grow. <span style="opacity:.6">${Math.min(S.found.size, KEYS.length)}/${KEYS.length}</span>`, { hold: 0, progress: true, actions: [
      { label: 'How do I grow?', primary: true, run: () => say('Print a receipt, open a story, scroll through the process, peek at the journey, try ⌘K… I’m not picky.', { hold: 5200, progress: true }) },
      { label: 'Nap time', run: () => { S.sleepUntil = performance.now() + 20000; say('zzz…', { hold: 1400 }); } },
    ] });
  }
  const onPoke = e => { e.stopPropagation(); S.hop = 1.6; S.happyUntil = performance.now() + 900; S.sleepUntil = 0; bubble.classList.contains('on') ? hush() : menu(); };
  hit.addEventListener('click', onPoke);
  root.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPoke(e); } });
  document.addEventListener('click', e => { if (!bubble.contains(e.target)) hush(); });
  addEventListener('pointermove', e => { S.mouse = { x: e.clientX, y: e.clientY }; S.lastMove = performance.now(); }, { passive: true });

  /* ---------- growth ---------- */
  const reactions = {
    receipt: 'Ooh, fresh receipt. Still warm.', story: 'A good story! I’m feeling longer already.',
    process: 'Look at all those sticky notes…', journey: 'So many stops. Where to next?', about: 'She reads a lot. I eat leaves. Same thing.',
    cmdk: 'Keyboard person! Respect.',
  };
  function discover(key) {
    if (S.found.has(key) || S.stage === 'fly') return;
    S.found.add(key);
    const now = performance.now();
    S.hop = 1.4; S.happyUntil = now + 1200;
    const n = [...S.found].filter(k => KEYS.includes(k)).length;
    if ((n >= KEYS.length || (key === 'contact' && n >= 3)) && S.stage === 'cat') return metamorphose();
    if (reactions[key] && now > S.talkCooldown) { S.talkCooldown = now + 7000; say(`${reactions[key]} <span style="opacity:.6">${n}/${KEYS.length}</span>`, { progress: true, hold: 3200 }); }
  }
  function metamorphose() {
    S.stage = 'cocoon'; S.emergeAt = performance.now() + (reduce ? 400 : 3200);
    say('Hold on… something’s happening.', { hold: 2600 });
  }
  function emerge() {
    S.stage = 'fly'; S.vx = 0; S.vy = -4;
    burst(S.x, S.y - 40);
    say('Ta-da! This is only the start. Thanks for sticking around.', { hold: 5200, actions: [{ label: 'Say hi to Aatisha', primary: true, run: () => { window.App?.copyEmail(); hush(); } }] });
    document.dispatchEvent(new CustomEvent('tish:emerged'));
  }
  function burst(x, y) {
    if (reduce) return;
    for (let i = 0; i < 22; i++) {
      const d = document.createElement('i'), a = Math.random() * Math.PI * 2, r = 50 + Math.random() * 90, s = 4 + Math.random() * 5;
      Object.assign(d.style, { position: 'fixed', left: x + 'px', top: y + 'px', width: s + 'px', height: s + 'px', zIndex: 62, pointerEvents: 'none', background: ['#58D6A5', '#FFE07A', '#C4F8E2', '#FF9DB0'][i % 4], transition: 'transform 1s cubic-bezier(.16,1,.3,1), opacity 1s', imageRendering: 'pixelated' });
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
    let moving = false;

    if (S.stage === 'fly') {
      const idle = !S.mouse || t - S.lastMove > 2600;
      let tx, ty;
      if (idle) { const p = spot(S.perch = pickPerch(), .5); tx = p.x; ty = p.y - 30; }
      else { tx = S.mouse.x + 46; ty = S.mouse.y - 34; }
      S.vx += (tx - S.x) * .004 * dt / 16; S.vy += (ty - S.y) * .004 * dt / 16;
      S.vx *= .9; S.vy *= .9;
      S.x += S.vx; S.y += S.vy + (reduce ? 0 : Math.sin(t / 260) * .25);
      S.rest = idle && Math.hypot(tx - S.x, ty - S.y) < 8;
    } else if (S.jump) {
      const k = Math.min(1, (t - S.jump.t0) / S.jump.dur), to = spot(S.perch, S.off);
      S.x = S.jump.x + (to.x - S.jump.x) * ease(k);
      S.y = S.jump.y + (to.y - S.jump.y) * ease(k) - Math.sin(k * Math.PI) * S.jump.h;
      S.dir = to.x >= S.jump.x ? 1 : -1;
      if (k >= 1) S.jump = null;
    } else {
      const p = pickPerch();
      if (p !== S.perch) {
        const from = { x: S.x, y: S.y };
        S.perch = p; S.off = S.target = .5;
        const to = spot(p, S.off);
        if (reduce || Math.hypot(to.x - from.x, to.y - from.y) > innerHeight * 1.2) { S.x = to.x; S.y = to.y; }
        else S.jump = { t0: t, dur: 720, x: from.x, y: from.y, h: 60 + Math.min(120, Math.abs(to.y - from.y) * .2) };
      } else {
        if (!sleeping && S.stage === 'cat' && t > S.nextWander) { S.target = Math.random(); S.nextWander = t + 3000 + Math.random() * 5000; }
        const w = S.perch ? S.perch.getBoundingClientRect().width * ((zones[S.perch.dataset.perch] || zones.default)[1] - (zones[S.perch.dataset.perch] || zones.default)[0]) : 140;
        const diff = S.target - S.off, step = (.018 * dt / 16) * 60 / Math.max(60, w);
        if (!sleeping && S.stage === 'cat' && !reduce && Math.abs(diff) * w > 1.5) { S.off += Math.sign(diff) * Math.min(Math.abs(diff), step); moving = true; S.dir = Math.sign(diff) || S.dir; }
        const at = spot(S.perch, S.off); S.x = at.x; S.y = at.y;
        if (!moving && S.mouse && Math.abs(S.mouse.x - S.x) < 260 && Math.abs(S.mouse.y - S.y) < 200) S.dir = S.mouse.x > S.x ? 1 : -1;
      }
    }
    if (S.stage === 'cocoon' && t > S.emergeAt) emerge();
    S.hop *= .86;

    // draw
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (S.dir < 0 && S.stage === 'cat') { ctx.translate(W, 0); ctx.scale(-1, 1); }
    const blink = t > S.blinkAt && t < S.blinkAt + 140; if (t > S.blinkAt + 140) S.blinkAt = t + 2200 + Math.random() * 3000;
    let box;
    if (S.stage === 'cat') {
      const segs = 3 + Math.min(3, S.found.size);
      box = caterpillar(ctx, t, { segments: segs, moving: moving || !!S.jump, sleep: sleeping, blink, happy: t < S.happyUntil, hop: S.hop });
    } else if (S.stage === 'cocoon') {
      box = cocoon(ctx, t, { glow: Math.max(0, 1 - (S.emergeAt - t) / 1800) * .5 });
    } else {
      box = butterfly(ctx, t, { rest: S.rest });
    }
    ctx.restore();
    if (sleeping && S.stage === 'cat') { const z = (t / 900) % 1; ctx.fillStyle = C.line; ctx.font = '6px monospace'; ctx.globalAlpha = 1 - z; ctx.fillText('z', 34 + z * 4, 14 - z * 8); ctx.globalAlpha = 1; }

    // position: sprite bottom-centre sits on (x, y); butterflies float around their centre
    const ox = S.x - (W * SCALE) / 2, oy = S.stage === 'fly' ? S.y - (H * SCALE) / 2 : S.y - H * SCALE + 2;
    root.style.transform = `translate(${ox}px, ${oy}px)`;
    if (box) {
      const bx0 = S.dir < 0 && S.stage === 'cat' ? W - box.x1 : box.x0, bx1 = S.dir < 0 && S.stage === 'cat' ? W - box.x0 : box.x1;
      Object.assign(hit.style, { left: bx0 * SCALE + 'px', top: box.y0 * SCALE + 'px', width: (bx1 - bx0) * SCALE + 'px', height: (box.y1 - box.y0) * SCALE + 'px' });
    }
    if (bubble.classList.contains('on')) {
      const bw = bubble.offsetWidth, bh = bubble.offsetHeight;
      const top = (S.stage === 'fly' ? S.y - 40 : S.y - 70) - bh;
      bubble.style.left = Math.max(12, Math.min(innerWidth - bw - 12, S.x - 30)) + 'px';
      bubble.style.top = Math.max(76, top) + 'px';
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  window.Tish = { discover, say, react(type) { if (type === 'print') { S.hop = 1.8; S.happyUntil = performance.now() + 1400; } } };

  setTimeout(() => { if (!S.found.size) say('Psst. I’m Tish. Press the green button.', { hold: 3800 }); }, 2600);
})();

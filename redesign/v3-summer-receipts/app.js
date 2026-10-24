/* Aatisha Cyrill: portfolio v3 (summer receipts) interactions */
(() => {
  const D = window.DATA, IMG = window.IMG, S = D.summer;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => 1 - Math.pow(1 - t, 3);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tish = key => window.Tish && window.Tish.discover(key);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new window.Lenis({ duration: 1.1, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
  }
  const scrollToEl = el => lenis ? lenis.scrollTo(el, { offset: -20 }) : el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const el = $(id); if (!el) return; e.preventDefault(); scrollToEl(el);
  }));
  const lockScroll = on => { document.documentElement.style.overflow = on ? 'hidden' : ''; if (lenis) on ? lenis.stop() : lenis.start(); };

  /* ---------- toast & email ---------- */
  let toastT;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2200); }
  async function copyEmail() {
    try { await navigator.clipboard.writeText(D.email); } catch (e) { /* clipboard may be blocked on file:// */ }
    toast('Email copied. Talk soon ✦');
    const m = $('#mailText'); if (m) { m.textContent = 'Copied!'; setTimeout(() => m.textContent = D.email, 1600); }
  }
  window.App = { copyEmail, go: id => { const el = $('#' + id); if (el) scrollToEl(el); }, hint: () => treasureHint() };
  $('#mailBtn').addEventListener('click', copyEmail);

  /* ---------- nav, clock, brand ---------- */
  const nav = $('#nav');
  addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 20), { passive: true });
  const setMark = o => { if (!window.tishMark) return; const mark = window.tishMark(o); $('.brand-mark').style.backgroundImage = `url(${mark})`; $('#favicon').href = mark; };
  setMark();
  const clock = $('#clock');
  const tick = () => { clock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
  tick(); setInterval(tick, 15000);
  const sectionIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    $$('.nav-links a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['work', 'process', 'journey', 'about'].forEach(id => sectionIO.observe($('#' + id)));

  /* ---------- intro: the name, cut out of the frame ---------- */
  const cutName = $('#cutName'), intro = $('#intro');
  $$('span', cutName).forEach(line => { line.innerHTML = [...line.textContent].map(ch => `<i>${ch}</i>`).join(''); });
  const letters = $$('i', cutName);
  if (!reduce) {
    intro.addEventListener('pointermove', e => {
      letters.forEach(l => {
        const r = l.getBoundingClientRect(), d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        l.style.setProperty('--lift', (-Math.max(0, 1 - d / 320) * 0.06).toFixed(3) + 'em');
      });
    });
    intro.addEventListener('pointerleave', () => letters.forEach(l => l.style.setProperty('--lift', '0em')));
    let introOn = true;
    new IntersectionObserver(es => es.forEach(e => introOn = e.isIntersecting)).observe(intro);
    const par = () => { if (introOn) cutName.style.transform = `translateY(${Math.min(scrollY, innerHeight) * .22}px)`; requestAnimationFrame(par); };
    requestAnimationFrame(par);
  }

  /* ---------- reveal ---------- */
  const revealIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  const observeReveals = root => $$('[data-reveal]', root).forEach((el, i) => { if (!el.style.getPropertyValue('--d') && el.closest('.hero')) el.style.setProperty('--d', (i * .08) + 's'); revealIO.observe(el); });
  observeReveals(document);

  /* ---------- marquee ---------- */
  const partners = ['MyWorker.AI', 'UW–Madison Libraries', 'Amazon × Shopbop', 'SSEC · Space Science & Engineering Center', 'Sustain Dane', 'Trader Joe’s (research)', 'Rover (usability study)', 'SF Tech Week 2025'];
  $('#marquee').innerHTML = [...partners, ...partners].map(p => `<span class="marquee-item"><i></i>${p}</span>`).join('');

  /* ---------- hero previews ---------- */
  const pc = $('#previewCard');
  $$('.hl[data-preview]').forEach(a => {
    const p = D.projects.find(x => x.id === a.dataset.preview);
    a.addEventListener('mouseenter', () => { pc.innerHTML = `<img src="${p.papers[2]}" alt=""><div><b>${esc(p.title)}</b><span>${esc(p.line)}</span></div>`; pc.classList.add('on'); });
    a.addEventListener('mousemove', e => { pc.style.left = Math.min(innerWidth - 320, e.clientX + 18) + 'px'; pc.style.top = Math.min(innerHeight - 260, e.clientY + 22) + 'px'; });
    a.addEventListener('mouseleave', () => pc.classList.remove('on'));
    a.addEventListener('click', e => { e.preventDefault(); pc.classList.remove('on'); openStory(p.id); });
  });

  /* =========================================================
     RECEIPT PRINTER
     ========================================================= */
  const receipts = [
    { title: 'THE BASICS', lines: [['Product design', '×1'], ['UX research', '×1'], ['Front-end dev', 'incl.'], ['Listening', 'first'], ['AI curiosity', 'high']], total: ['TOTAL', '1 designer w/ heart'] },
    { title: 'RESEARCH', lines: [['Founder interviews', '7'], ['AI usability sessions', '6'], ['MINDS interviews', '9'], ['TJ’s interviews', '9'], ['Aisle inquiries', '6'], ['Survey voices', '25+']], total: ['TOTAL', '60+ voices heard'] },
    { title: 'IMPACT', lines: [['Founder time saved', '~6h/wk'], ['Report generation', '−65%'], ['Support requests', '−50%*'], ['Wanted stock check', '64%'], ['Demo videos killed', '1']], total: ['TOTAL', 'evidence > adjectives'], note: '*projected' },
    { title: 'OFF THE CLOCK', lines: [['Books on the shelf', '15'], ['Cities collected', '4'], ['Plants monitored', '1'], ['Sites hand-built', 'this one'], ['Curiosity', '∞']], total: ['TOTAL', 'a whole person'] },
  ];
  const modes = ['BASICS', 'RESEARCH', 'IMPACT', 'OFF-CLOCK'];
  const modeNames = ['The basics', 'Research', 'Impact', 'Off the clock'];
  let sel = 0, printed = 0, printing = false, roll = 'full';   // roll: full → empty (after the grand total)
  const seen = new Set();
  const win = $('#paperWindow'), hero = $('.hero'), printer = $('#printer'), lcd = $('#lcd'), led = $('#led'), knob = $('#knob'), btn = $('#printBtn');
  const setLCD = s => { lcd.textContent = s; };
  function barcode() {
    let x = 0, stops = [];
    while (x < 100) { const w = [.6, 1, 1.4, 2.2][Math.random() * 4 | 0], gap = [.6, 1, 1.6][Math.random() * 3 | 0]; stops.push(`#2A2925 ${x}% ${x + w}%`, `transparent ${x + w}% ${x + w + gap}%`); x += w + gap; }
    return `linear-gradient(90deg, ${stops.join(',')})`;
  }
  function receiptHTML(r, n) {
    const d = new Date();
    const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `<div class="r-head"><b>AATISHA CYRILL</b><span>DESIGN &amp; RESEARCH CO.</span><span>EST. 2018 · LISTENING SINCE</span></div>
      <div class="r-meta"><span>ORDER</span><span>#${String(n).padStart(4, '0')}</span><span>CUSTOMER</span><span>you!</span><span>DATE</span><span>${date}</span><span>TIME</span><span>${time}</span></div>
      <hr><div class="r-title">— ${r.title} —</div>
      ${r.lines.map(([a, b]) => `<div class="r-line"><span>${a}</span><i></i><span>${b}</span></div>`).join('')}
      <hr><div class="r-total"><span>${r.total[0]}</span><span>${r.total[1]}</span></div>
      ${r.note ? `<div style="font-size:10px;color:#6E6C66;margin-top:4px">${r.note}</div>` : ''}
      <div class="barcode" style="background:${barcode()}"></div>
      <div class="r-foot"><b>THANK YOU, COME AGAIN</b><br>scroll for the full story ↓</div>`;
  }
  function finalHTML(n) {
    const d = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    const lines = [['Receipts printed', String(printed - 1)], ['Voices heard', '60+'], ['Founder time saved', '~6h/wk'], ['Report generation', '−65%'], ['Designers available', '1']];
    return `<div class="r-edge"></div>
      <div class="r-head"><b>AATISHA CYRILL</b><span>ORDER #${String(n).padStart(4, '0')} · ${d}</span></div>
      <hr><div class="r-title">— GRAND TOTAL —</div>
      ${lines.map(([a, b]) => `<div class="r-line"><span>${a}</span><i></i><span>${b}</span></div>`).join('')}
      <hr><div class="r-due"><span>TOTAL DUE</span><b>1 conversation</b></div>
      <div class="r-stampzone"><button class="r-stamp" type="button" data-nodrag aria-label="Stamp the receipt as verified">STAMP HERE<small>click to verify</small></button></div>
      <div class="r-foot"><b>END OF ROLL</b><br>thanks for reading every receipt</div>
      <div class="r-cta" data-nodrag><a href="#contact" data-go="contact">Say hello →</a><button type="button" data-go="resume">Résumé</button></div>`;
  }
  const hint = $('#hintText'), hintDefault = hint.textContent;
  const idleMsg = () => roll === 'empty' ? 'OUT OF PAPER' : printer.classList.contains('final-ready') ? 'FINAL RECEIPT ↵' : 'PRESS PRINT';
  function stamp(el) {
    if (el.classList.contains('stamped')) return;
    el.classList.add('stamped');
    const zone = $('.r-stampzone', el);
    $('.r-stamp', zone).remove();
    zone.insertAdjacentHTML('beforeend', `<div class="stamp-ink">VERIFIED<small>${printed - 1} RECEIPTS · 60+ VOICES</small></div>`);
    if (!reduce) {
      setTimeout(() => {
        el.animate([{ translate: '0 0' }, { translate: '0 3px' }, { translate: '0 0' }], { duration: 180, easing: 'ease-out' });
        printer.animate([{ translate: '0 0' }, { translate: '0 2px' }, { translate: '0 0' }], { duration: 200, easing: 'ease-out' });
      }, 230);
    }
    navigator.vibrate?.(18);
    setLCD('VERIFIED ✓'); hint.textContent = 'Verified. Say hello, or hold the button to load a fresh roll.';
    window.Tish && (window.Tish.react('print'), window.Tish.say('Verified! She really does bring receipts.', { hold: 3200 }));
    setTimeout(() => { if (roll === 'empty' && !holdStart) setLCD('OUT OF PAPER'); }, 1900);
  }
  function wireFinal(el) {
    $$('[data-nodrag]', el).forEach(n => n.addEventListener('pointerdown', e => e.stopPropagation()));
    $('.r-stamp', el).addEventListener('click', () => stamp(el));
    $$('[data-go]', el).forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      a.dataset.go === 'resume' ? openRecruiter() : scrollToEl($('#contact'));
    }));
  }
  let torn = [];
  function tear(el, auto) {
    const hr = hero.getBoundingClientRect(), r = el.getBoundingClientRect();
    el.classList.add('torn');
    hero.appendChild(el);
    el.style.left = (r.left - hr.left) + 'px'; el.style.top = (r.top - hr.top) + 'px'; el.style.bottom = 'auto';
    el.style.setProperty('--rot', '0deg');
    torn.push(el);
    if (torn.length > 4) { const old = torn.shift(); old.style.transition = 'opacity .5s'; old.style.opacity = 0; setTimeout(() => old.remove(), 500); }
    if (auto) {
      // tuck the previous receipt behind the printer's right shoulder, like a small pile
      const pr = printer.getBoundingClientRect(), k = torn.length - 1;
      el.style.zIndex = 1;
      requestAnimationFrame(() => {
        el.style.transition = 'left .9s var(--ease), top .9s var(--ease), transform .9s var(--spring)';
        el.style.left = clamp(pr.right - hr.left - 170 + k * 12, 8, hr.width - r.width - 8) + 'px';
        el.style.top = (pr.top - hr.top - 200 + k * 8) + 'px';
        el.style.setProperty('--rot', (7 + Math.random() * 6) + 'deg');
      });
    }
    makeDraggable(el);
  }
  function makeDraggable(el) {
    if (el._drag) return; el._drag = true;
    el.addEventListener('pointerdown', e => {
      if (!el.classList.contains('torn')) { if (!el.dataset.done) return; tear(el); }
      e.preventDefault(); el.setPointerCapture(e.pointerId); el.classList.add('dragging');
      el.style.transition = 'transform .2s var(--ease)'; el.style.zIndex = 30 + torn.length;
      let lx = e.clientX, ly = e.clientY, vx = 0;
      const move = ev => {
        const dx = ev.clientX - lx, dy = ev.clientY - ly; lx = ev.clientX; ly = ev.clientY; vx = vx * .7 + dx * .3;
        el.style.left = (parseFloat(el.style.left) + dx) + 'px'; el.style.top = (parseFloat(el.style.top) + dy) + 'px';
        el.style.setProperty('--rot', clamp(vx * 1.2, -18, 18) + 'deg');
      };
      const up = () => { el.classList.remove('dragging'); el.style.transition = ''; el.style.setProperty('--rot', (Math.random() * 8 - 4) + 'deg'); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); };
      el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    });
  }
  async function print() {
    if (printing) return; printing = true;
    const prev = win.querySelector('.receipt'); if (prev) tear(prev, true);
    // on stacked layouts, bring the whole paper path into view before printing
    const wr = win.getBoundingClientRect();
    if (wr.top < 64 && wr.height + 90 < innerHeight) { const y = scrollY + wr.top - 76; lenis ? lenis.scrollTo(y) : scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }); }
    const isFinal = seen.size === receipts.length, n = ++printed;
    if (!isFinal) seen.add(sel);
    printer.classList.remove('final-ready');
    btn.classList.add('down'); setTimeout(() => btn.classList.remove('down'), 160);
    const el = document.createElement('div');
    el.className = isFinal ? 'receipt final' : 'receipt';
    el.innerHTML = isFinal ? finalHTML(n) : receiptHTML(receipts[sel], n);
    win.appendChild(el); makeDraggable(el);
    if (isFinal) wireFinal(el);
    const h = el.offsetHeight + 12; el.style.transform = `translateY(${h}px)`;
    printer.classList.add('busy', 'jolt'); led.classList.add('on'); setLCD('PRINTING');
    window.Tish && window.Tish.react('print');
    const steps = reduce ? 1 : Math.ceil(h / 16);
    for (let i = 1; i <= steps; i++) {
      el.style.transition = reduce ? 'none' : 'transform 55ms linear';
      el.style.transform = `translateY(${h - (h * i) / steps}px)`;
      await new Promise(res => setTimeout(res, reduce ? 0 : 42 + Math.random() * 40));
    }
    el.style.transition = 'transform .9s var(--spring)'; el.style.transform = 'translateY(0) rotate(-1.2deg)';
    printer.classList.remove('busy', 'jolt'); led.classList.remove('on');
    el.dataset.done = 1; printing = false;
    tish('receipt');
    if (isFinal) {
      // the end of the roll feeds all the way out and settles in front of the printer, fully readable
      setTimeout(() => {
        const hr = hero.getBoundingClientRect(), pr = printer.getBoundingClientRect(), navH = $('#nav').offsetHeight;
        tear(el);
        el.style.zIndex = 25;
        requestAnimationFrame(() => {
          el.style.transition = 'top .8s var(--spring), transform .8s var(--spring)';
          el.style.top = Math.max(navH + 8 - hr.top, pr.top - hr.top - el.offsetHeight + 22) + 'px';
          el.style.setProperty('--rot', '-2deg');
        });
      }, reduce ? 0 : 450);
      roll = 'empty'; printer.classList.add('empty'); btn.querySelector('span').textContent = 'REFILL';
      setLCD('STAMP IT ↑'); hint.textContent = 'That’s the end of the roll. Stamp your receipt.';
      return;
    }
    setLCD('TEAR IT OFF ↑');
    // the dial clicks on to the next receipt you haven't printed yet
    // right away, so even rapid presses walk through all four and reach the end of the roll
    const next = [1, 2, 3].map(k => (sel + k) % receipts.length).find(k => !seen.has(k));
    if (next === undefined) {
      printer.classList.add('final-ready'); hint.textContent = 'All four printed. One last receipt left on the roll.';
      setTimeout(() => { if (!printing && roll === 'full') setLCD('FINAL RECEIPT ↵'); }, 1400);
    } else {
      setSel(next, { spin: true, quiet: true });
      setTimeout(() => { if (!printing && roll === 'full' && !printer.classList.contains('final-ready')) setLCD('PRESS AGAIN?'); }, 2400);
    }
  }
  /* ---- out of paper: press and hold to load a fresh roll ---- */
  let holdStart = 0, holdRaf = 0, holdVia = '', swallowClick = false;
  const HOLD_MS = 1100;
  const setHold = v => btn.style.setProperty('--hold', v);
  function refill() {
    roll = 'full'; seen.clear();
    printer.classList.remove('empty'); printer.classList.add('refilled'); setTimeout(() => printer.classList.remove('refilled'), 900);
    btn.querySelector('span').textContent = 'PRINT'; setHold(0);
    torn.forEach(t => { t.style.transition = 'opacity .6s, transform .6s'; t.style.opacity = 0; setTimeout(() => t.remove(), 600); }); torn = [];
    setSel(0, { quiet: true }); setLCD('PAPER LOADED');
    hint.textContent = hintDefault; navigator.vibrate?.([8, 40, 8]);
    window.Tish && window.Tish.say('Fresh roll! Round two.', { hold: 2200 });
    setTimeout(() => { if (!printing && roll === 'full') setLCD('READY'); }, 1600);
  }
  function holdTick() {
    const k = clamp((performance.now() - holdStart) / HOLD_MS);
    setHold(k);
    if (k >= 1) { swallowClick = holdVia === 'pointer'; endHold(true); refill(); return; }
    holdRaf = requestAnimationFrame(holdTick);
  }
  function startHold(via) {
    if (roll !== 'empty' || holdStart) return;
    holdStart = performance.now(); holdVia = via; btn.classList.add('holding'); setLCD('LOADING PAPER');
    holdRaf = requestAnimationFrame(holdTick);
  }
  function endHold(done, released) {
    if (!holdStart) return;
    const quick = performance.now() - holdStart < 260;
    cancelAnimationFrame(holdRaf); holdStart = 0; btn.classList.remove('holding');
    if (done) return;
    setHold(0);
    if (released && holdVia === 'pointer') swallowClick = true;   // the click that follows pointerup is ours
    quick ? nope() : setLCD('HOLD TO REFILL');
  }
  function nope() {
    btn.classList.remove('nope'); void btn.offsetWidth; btn.classList.add('nope');
    setLCD('HOLD TO REFILL'); hint.textContent = 'Out of paper. Press and hold the button to refill.';
  }
  btn.addEventListener('pointerdown', e => { if (roll === 'empty' && e.button === 0) startHold('pointer'); });
  btn.addEventListener('pointerup', () => endHold(false, true));
  ['pointerleave', 'pointercancel'].forEach(t => btn.addEventListener(t, () => endHold(false, false)));
  btn.addEventListener('contextmenu', e => { if (roll === 'empty') e.preventDefault(); });
  btn.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && roll === 'empty') { e.preventDefault(); if (!e.repeat) startHold('key'); } });
  btn.addEventListener('keyup', e => { if ((e.key === 'Enter' || e.key === ' ') && holdVia === 'key') { e.preventDefault(); endHold(false, true); } });
  btn.addEventListener('click', e => {
    if (swallowClick) { swallowClick = false; return; }
    if (roll === 'empty') return e.detail === 0 ? null : nope();
    print();
  });
  setTimeout(() => { if (!printing && !dialTouched) setLCD('READY'); }, 1800);

  /* ---- selector dial: drag, click, scroll or arrow keys ---- */
  const DETENTS = [-105, -35, 35, 105], MIN = -135, MAX = 135;
  const dots = $('#dialDots');
  dots.innerHTML = DETENTS.map(a => `<i style="--a:${a}deg"></i>`).join('');
  let rot = DETENTS[0], dialTouched = false, lcdTimer, dialTold = false;
  const setRot = a => { rot = a; knob.style.setProperty('--rot', a + 'deg'); };
  function setSel(i, { spin = true, quiet = false } = {}) {
    const changed = i !== sel; sel = i;
    if (spin) setRot(DETENTS[i]);
    $$('i', dots).forEach((d, k) => d.classList.toggle('on', k === i));
    $('#counter').textContent = `${String(i + 1).padStart(2, '0')}/${String(receipts.length).padStart(2, '0')}`;
    knob.setAttribute('aria-valuenow', i + 1); knob.setAttribute('aria-valuetext', modeNames[i]);
    if (quiet) return;
    dialTouched = true;
    if (changed) { led.classList.add('on'); setTimeout(() => { if (!printing) led.classList.remove('on'); }, 90); navigator.vibrate?.(6); }
    setLCD(`▸ ${String(i + 1).padStart(2, '0')} ${modes[i]}`);
    clearTimeout(lcdTimer); lcdTimer = setTimeout(() => { if (!printing) setLCD(idleMsg()); }, 1600);
    if (!dialTold && window.Tish) { dialTold = true; window.Tish.react('print'); window.Tish.say('Ooh, a menu. Pick a receipt, any receipt.', { hold: 2800 }); }
  }
  const nearest = a => DETENTS.reduce((b, d, k) => Math.abs(d - a) < Math.abs(DETENTS[b] - a) ? k : b, 0);
  const busy = () => { knob.classList.remove('locked'); void knob.offsetWidth; knob.classList.add('locked'); setLCD('HOLD ON…'); };
  const step = d => { if (printing) return busy(); setSel(clamp(sel + d, 0, receipts.length - 1)); };
  setSel(0, { quiet: true });

  knob.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (printing) return busy();
    knob.setPointerCapture(e.pointerId); knob.focus({ preventScroll: true });
    const kr = knob.getBoundingClientRect(), cx = kr.left + kr.width / 2, cy = kr.top + kr.height / 2;
    const ang = ev => Math.atan2(ev.clientX - cx, cy - ev.clientY) * 180 / Math.PI;
    let last = ang(e), moved = 0;
    const move = ev => {
      let d = ang(ev) - last; last += d;
      if (d > 180) d -= 360; if (d < -180) d += 360;
      moved += Math.abs(d);
      if (moved < 3) return;
      knob.classList.add('dragging');
      setRot(clamp(rot + d, MIN, MAX));
      const k = nearest(rot); if (k !== sel) setSel(k, { spin: false });
    };
    const up = () => {
      knob.classList.remove('dragging');
      knob.removeEventListener('pointermove', move); knob.removeEventListener('pointerup', up); knob.removeEventListener('pointercancel', up);
      if (moved < 3) setSel((sel + 1) % receipts.length);     // a plain click steps forward and wraps
      else setSel(nearest(rot));                                // let go and it springs into the nearest detent
    };
    knob.addEventListener('pointermove', move); knob.addEventListener('pointerup', up); knob.addEventListener('pointercancel', up);
  });
  let wheelAt = 0;
  knob.addEventListener('wheel', e => {
    e.preventDefault();
    const now = performance.now(); if (now - wheelAt < 140 || Math.abs(e.deltaY) < 2) return; wheelAt = now;
    step(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });
  knob.addEventListener('keydown', e => {
    const k = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (k) { e.preventDefault(); e.stopPropagation(); step(k); }
    else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); if (!printing) setSel(e.key === 'Home' ? 0 : receipts.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); roll === 'empty' ? nope() : print(); }
  });

  /* =========================================================
     WORK: folders
     ========================================================= */
  const P = D.projects, stageEl = $('#stageFolder'), minis = $('#minis');
  let cur = 0, swapping = false;
  const tintVars = p => `--tint:${p.tint};--deep:${p.tintDeep};--fink:${p.ink}`;
  function stageHTML(p, i) {
    return `<div class="f-back"></div>
      <div class="f-papers">${p.papers.map((src, k) => `<img class="p${k + 1}" src="${src}" alt="" loading="${i ? 'lazy' : 'eager'}">`).join('')}</div>
      <div class="f-front"><div class="f-copy">
        <div class="f-top"><span class="f-kicker">${esc(p.kicker)}</span></div></div>
        <div class="f-bottom f-copy"><div><h3>${esc(p.title)}</h3><p>${esc(p.line)}</p>
          <div class="f-acts"><span class="pill f-open" data-open>Open the story ↗</span>
            <button class="f-step" type="button" data-step="-1" aria-label="Previous story">←</button><button class="f-step" type="button" data-step="1" aria-label="Next story">→</button>
            <span class="f-count">${String(i + 1).padStart(2, '0')} / ${String(P.length).padStart(2, '0')}</span></div></div>
          <div class="f-metric"><b>${esc(p.metric[0])}</b><span>${esc(p.metric[1])}</span></div></div>
      </div>`;
  }
  function paintStage(i) {
    const p = P[i];
    stageEl.setAttribute('style', tintVars(p)); stageEl.dataset.id = p.id;
    stageEl.setAttribute('aria-label', `${p.title}. Open the story`);
    stageEl.innerHTML = stageHTML(p, i);
    $$('.mini', minis).forEach((m, k) => m.setAttribute('aria-selected', k === i ? 'true' : 'false'));
  }
  minis.innerHTML = P.map((p, i) => `<button class="mini" role="tab" type="button" data-k="${i}" style="${tintVars(p)}" aria-selected="false">
      <span class="m-back"></span><img class="m-paper" src="${p.papers[2]}" alt="" loading="lazy"><span class="m-front"><small>${esc(p.kicker)}</small><b>${esc(p.title)}</b></span></button>`).join('');
  paintStage(0);
  function show(i) {
    i = (i + P.length) % P.length;
    if (i === cur || swapping) return;
    swapping = true; cur = i;
    const p = P[i];
    if (reduce) { paintStage(i); swapping = false; return; }
    stageEl.classList.remove('peek'); stageEl.classList.add('sink');
    // the same folder stays on the table: its colour morphs while the papers swap
    stageEl.style.setProperty('--tint', p.tint); stageEl.style.setProperty('--deep', p.tintDeep); stageEl.style.setProperty('--fink', p.ink);
    setTimeout(() => {
      paintStage(i);
      stageEl.classList.remove('sink'); stageEl.classList.add('rise', 'sink');
      void stageEl.offsetWidth;
      stageEl.classList.remove('rise', 'sink'); stageEl.classList.add('peek');
      setTimeout(() => { stageEl.classList.remove('peek'); swapping = false; }, 900);
    }, 430);
  }
  stageEl.addEventListener('click', e => {
    const st = e.target.closest('[data-step]'); if (st) { e.stopPropagation(); show(cur + +st.dataset.step); return; }
    openStory(P[cur].id);
  });
  stageEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { if (e.target.closest('[data-step]')) return; e.preventDefault(); openStory(P[cur].id); }
  });
  minis.addEventListener('click', e => { const m = e.target.closest('.mini'); if (m) show(+m.dataset.k); });
  $('#work').addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1); }
  });
  let sx = null;
  stageEl.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') sx = e.clientX; });
  stageEl.addEventListener('pointerup', e => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 60) { e.preventDefault(); show(cur + (dx < 0 ? 1 : -1)); stageEl.dataset.swiped = 1; setTimeout(() => delete stageEl.dataset.swiped, 50); } });
  stageEl.addEventListener('click', e => { if (stageEl.dataset.swiped) e.stopImmediatePropagation(); }, true);
  $('#more').innerHTML = D.more.map(m => `<a class="more-card" href="${m.href}" target="_blank" rel="noopener"><img src="${m.img}" alt="" loading="lazy"><div><small>${m.kicker}</small><b>${m.title} ↗</b><span>${m.line}</span></div></a>`).join('') +
    `<a class="more-link" href="#lab">Earlier engineering<br>work ↓</a>`;
  $('#more .more-link').addEventListener('click', e => { e.preventDefault(); scrollToEl($('#lab')); });

  // cursor pill
  const pill = $('#cursorPill'); let pillOn = false, px = 0, py = 0, tx = 0, ty = 0;
  stageEl.addEventListener('mouseenter', () => { pillOn = true; pill.classList.add('on'); });
  stageEl.addEventListener('mouseleave', () => { pillOn = false; pill.classList.remove('on'); });
  stageEl.addEventListener('mouseover', e => pill.classList.toggle('on', pillOn && !e.target.closest('[data-step]')));
  addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  (function follow() { px = lerp(px, tx, .22); py = lerp(py, ty, .22); if (pillOn) pill.style.left = px + 'px', pill.style.top = py + 'px'; requestAnimationFrame(follow); })();

  /* =========================================================
     STORY overlay
     ========================================================= */
  const story = $('#story'), sheet = $('#storySheet');
  let lastFocus = null, current = null;
  function storyHTML(p) {
    const i = D.projects.indexOf(p), nx = D.projects[(i + 1) % D.projects.length];
    return `<div class="st-bar"><span class="crumbs">Work / <b>${esc(p.title)}</b></span>
      <div class="acts"><button class="icon-btn" data-next aria-label="Next story">→</button><button class="icon-btn" data-close aria-label="Close story">✕</button></div></div>
      <div class="st-body" style="--tint:${p.tint}">
        <p class="label">${esc(p.kicker)}</p>
        <h2 class="st-title">${esc(p.title)}</h2>
        <p class="st-line">${esc(p.line)}</p>
        <div class="st-meta">${Object.entries(p.meta).map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b></div>`).join('')}</div>
        <div class="st-hero"><img src="${p.papers[2]}" alt="${esc(p.title)} final design"></div>
        <section class="st-section"><p class="label">The question</p><p class="st-q">${esc(p.question)}</p></section>
        <section class="st-section"><p class="label">What I heard</p><div class="st-quotes">${p.heard.map(([q, s]) => `<figure><blockquote>“${esc(q)}”</blockquote><figcaption>${esc(s)}</figcaption></figure>`).join('')}</div></section>
        <section class="st-section"><p class="label">The insight</p><div class="st-insight"><small>Synthesis</small>${esc(p.insight)}</div></section>
        <section class="st-section"><p class="label">What I did</p><div><div class="st-moves">${p.moves.map(([t, d], k) => `<div><i>0${k + 1}</i><b>${esc(t)}</b><span>${esc(d)}</span></div>`).join('')}</div>
          <div class="st-gallery">${p.gallery.map(g => `<img src="${g}" alt="" loading="lazy">`).join('')}</div></div></section>
        <section class="st-section"><p class="label">Outcome</p><div class="st-outcome">${p.outcome.map(([a, b]) => `<div><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join('')}</div></section>
        <section class="st-section"><p class="label">What I’d do next</p><div><p class="st-next">${esc(p.next)}</p>${found.has('conch') ? '' : `<div class="st-shell"><button class="treasure" data-t="conch" type="button" aria-label="A conch shell, washed up at the end of the story"></button><p>You read all the way to the end. That deserves a treasure.</p></div>`}</div></section>
        <div class="st-foot"><a class="pill pill-ghost" href="${p.caseStudy}" target="_blank" rel="noopener">Read the full case study ↗</a>
          <button class="st-nextcard" data-next><img src="${nx.papers[2]}" alt=""><div><small>Next story</small><b>${esc(nx.title)} →</b></div></button></div>
      </div>`;
  }
  function openStory(id) {
    const p = D.projects.find(x => x.id === id); if (!p) return;
    current = p; lastFocus = document.activeElement;
    sheet.innerHTML = storyHTML(p); sheet.scrollTop = 0;
    const c = $('.treasure', sheet); if (c) { c.style.backgroundImage = `url(${window.Pixel.sprite('conch', 4)})`; c.addEventListener('click', ev => { ev.stopPropagation(); collect('conch', c); }); }
    if (story.hidden) { story.hidden = false; lockScroll(true); requestAnimationFrame(() => requestAnimationFrame(() => story.classList.add('open'))); }
    setTimeout(() => sheet.focus({ preventScroll: true }), 60);
    tish('story');
  }
  function closeStory() {
    story.classList.remove('open'); lockScroll(false);
    setTimeout(() => { story.hidden = true; }, 650);
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
  }
  story.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) closeStory();
    else if (e.target.closest('[data-next]')) { const i = D.projects.indexOf(current); openStory(D.projects[(i + 1) % D.projects.length].id); }
  });

  /* =========================================================
     PROCESS: scroll-scrubbed affinity map
     ========================================================= */
  const board = $('#board'), proc = $('#process');
  const A = D.affinity;
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const notes = A.notes.map(([q, src, c, color], i) => {
    const el = document.createElement('div'); el.className = 'note'; el.style.background = color;
    el.innerHTML = `${esc(q)}<small>${esc(src)}</small>`; board.appendChild(el);
    return { el, c, sx: rnd(), sy: rnd(), sr: rnd() * 24 - 12, jr: rnd() * 6 - 3, jx: rnd() * 22 - 11 };
  });
  const tags = A.clusters.map((c, i) => { const t = document.createElement('div'); t.className = 'cluster-tag'; t.textContent = c.name; board.appendChild(t); return t; });
  const insights = A.clusters.map((c, i) => { const t = document.createElement('div'); t.className = 'insight'; t.innerHTML = `<small>Insight 0${i + 1}</small>${esc(c.insight)}`; board.appendChild(t); return t; });
  const titles = [['Sixty voices.', 'Scattered.'], ['Patterns', 'emerging.'], ['Three truths,', 'decided.']];
  let lastStep = -1, procSeen = false;
  function layoutBoard() {
    const bw = board.clientWidth, bh = board.clientHeight;
    const nw = notes[0].el.offsetWidth, nh = Math.max(...notes.map(n => n.el.offsetHeight));
    const cols = [.18, .5, .82].map(f => f * bw);
    const counts = [0, 0, 0];
    const most = Math.max(...[0, 1, 2].map(c => notes.filter(n => n.c === c).length));
    // keep each note's source label visible, but compress on short boards so insights still fit below
    const step = Math.max(28, Math.min(nh + 8, (bh - 64 - 132 - nh) / Math.max(1, most - 1)));
    notes.forEach(n => {
      n.x0 = 16 + n.sx * (bw - nw - 32); n.y0 = 16 + n.sy * (bh - nh - 32);
      const k = counts[n.c]++;
      n.x1 = cols[n.c] - nw / 2 + n.jx; n.y1 = 64 + k * step;
    });
    tags.forEach((t, i) => { t.style.left = cols[i] + 'px'; });
    insights.forEach((t, i) => { t.style.left = cols[i] + 'px'; t.style.width = Math.min(bw * .3, 260) + 'px'; });
  }
  function renderBoard() {
    const r = proc.getBoundingClientRect();
    const total = r.height - innerHeight;
    const p = clamp(-r.top / total);
    $('#scrubBar').style.transform = `scaleX(${p})`;
    notes.forEach((n, i) => {
      const k = ease(clamp((p - .12 - i * .018) / .38));
      const x = lerp(n.x0, n.x1, k), y = lerp(n.y0, n.y1, k), rot = lerp(n.sr, n.jr, k);
      n.el.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
      n.el.style.zIndex = k > .5 ? 10 + i : i;
    });
    tags.forEach(t => t.style.opacity = clamp((p - .5) / .1));
    insights.forEach((t, i) => t.classList.toggle('on', p > .66 + i * .06));
    const s = p < .3 ? 0 : p < .64 ? 1 : 2;
    if (s !== lastStep) {
      lastStep = s;
      $$('#steps li').forEach((li, i) => li.classList.toggle('on', i === s));
      $('#processTitle').innerHTML = `${titles[s][0]} <em>${titles[s][1]}</em>`;
    }
    if (p > .8 && !procSeen) { procSeen = true; tish('process'); }
    proc.classList.toggle('settled', p > .72);
  }
  layoutBoard(); renderBoard();
  addEventListener('resize', () => { layoutBoard(); renderBoard(); });
  let procVisible = false;
  new IntersectionObserver(es => es.forEach(e => procVisible = e.isIntersecting)).observe(proc);
  (function loop() { if (procVisible) renderBoard(); requestAnimationFrame(loop); })();

  /* =========================================================
     JOURNEY timeline
     ========================================================= */
  const J = D.journey, tl = $('#timeline');
  const pos = v => ((v - J.start) / (J.end - J.start)) * 100;
  const tintOf = id => (D.projects.find(p => p.id === id) || {}).tint;
  const inkOf = id => (D.projects.find(p => p.id === id) || {}).ink;
  let bi = 0;
  tl.innerHTML = `<div class="tl-pre"><span class="chip">2018 – 2023</span> Before this: engineering projects in Angular, Spring Boot, PHP and IoT, which is where I learned to think in systems.</div>
    <div class="tl-grid">
      <div class="tl-axis">${[2024, 2025, 2026].map(y => `<span style="left:${pos(y)}%">${y}</span>`).join('')}</div>
      <div class="tl-lines">${[2024, 2024.5, 2025, 2025.5, 2026, 2026.5].map(y => `<i style="left:${pos(y)}%;opacity:${y % 1 ? .5 : 1}"></i>`).join('')}</div>
      ${J.lanes.map(lane => `<div class="tl-lane">${lane.map(b => `<div class="tl-bar ${b.kind || ''}" style="left:${pos(b.a)}%;width:${pos(b.b) - pos(b.a)}%;--i:${bi++};${b.id ? `--c:${tintOf(b.id)};--fc:${inkOf(b.id)}` : ''}" ${b.id ? `data-id="${b.id}" tabindex="0" role="button"` : ''} data-t="${esc(b.t)}" data-s="${esc(b.s)}"><b>${esc(b.t)}</b><small>${esc(b.s)}</small></div>`).join('')}</div>`).join('')}
      <div class="tl-now" style="left:${pos(J.now)}%"></div>
      <div class="tl-tip" id="tlTip"></div>
    </div>`;
  const tip = $('#tlTip'), grid = $('.tl-grid', tl);
  $$('.tl-bar', tl).forEach(b => {
    b.addEventListener('mouseenter', () => {
      tip.innerHTML = `<b>${b.dataset.t}</b><span>${b.dataset.s}</span>${b.dataset.id ? '<em>Click to open story →</em>' : ''}`;
      const gr = grid.getBoundingClientRect(), br = b.getBoundingClientRect();
      tip.style.left = clamp(br.left - gr.left, 0, gr.width - 270) + 'px';
      tip.style.top = (br.top - gr.top - 92) + 'px';
      tip.classList.add('on');
    });
    b.addEventListener('mouseleave', () => tip.classList.remove('on'));
    if (b.dataset.id) {
      b.addEventListener('click', () => openStory(b.dataset.id));
      b.addEventListener('keydown', e => { if (e.key === 'Enter') openStory(b.dataset.id); });
    }
  });
  new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { tl.classList.add('in'); tish('journey'); o.disconnect(); } }), { threshold: .4 }).observe(tl);

  /* =========================================================
     LAB bento
     ========================================================= */
  const viz = {
    ar: () => `<div class="viz viz-ar"><div class="ar-card"><span>AATISHA CYRILL</span><b>Product designer</b><span>scan me ↗</span><i></i></div></div>`,
    plant: () => `<div class="viz"><div class="plant"><div class="pot"><div class="leaf"></div><div class="base"></div></div><div class="meter">soil moisture<div class="bar"><i></i></div>status<div class="leds"><i class="r"></i><i></i><i class="g"></i></div></div></div></div>`,
    code: () => `<div class="viz"><pre class="code" data-type></pre></div>`,
    writing: t => `<div class="viz" style="place-items:stretch;background:transparent"><ul class="posts">${t.posts.map(([a, h]) => `<li><a href="${h}" target="_blank" rel="noopener">${esc(a)}<span>↗</span></a></li>`).join('')}</ul></div>`,
    img: t => `<div class="viz viz-img"><img src="${t.img}" alt="" loading="lazy"></div>`,
  };
  const sizes = ['', '', '', 'wide', 'mid'];
  $('#bento').innerHTML = D.lab.map((t, i) => {
    const Tag = t.href ? 'a' : 'div';
    return `<${Tag} class="tile ${sizes[i]}" data-reveal style="--d:${i * .06}s" ${t.href ? `href="${t.href}" target="_blank" rel="noopener"` : ''} data-kind="${t.kind}">
      ${t.href ? '<span class="corner">↗</span>' : ''}${viz[t.kind](t)}
      <div class="txt"><small>${esc(t.meta)}</small><b>${esc(t.title)}</b>${t.body ? `<p>${esc(t.body)}</p>` : ''}</div></${Tag}>`;
  }).join('');
  observeReveals($('#bento'));
  const arTile = $('.tile[data-kind="ar"]'), arCard = $('.ar-card');
  arTile.addEventListener('pointermove', e => { const r = arTile.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; arCard.style.transform = `rotateX(${-y * 30}deg) rotateY(${x * 40}deg)`; });
  arTile.addEventListener('pointerleave', () => arCard.style.transform = '');
  const codeLines = [
    ['c', '// 2019 · online assessment platform'],
    ['', '<span class="k">@PostMapping</span>(<span class="s">"/submit"</span>)'],
    ['', '<span class="k">public</span> Result grade(Code c) {'],
    ['', '  <span class="k">return</span> compiler.run(c)'],
    ['', '    .compare(testCases);'],
    ['', '}'],
  ];
  const pre = $('[data-type]');
  let typed = false;
  new IntersectionObserver(es => es.forEach(async e => {
    if (!e.isIntersecting || typed) return; typed = true;
    for (let loop = 0; loop < 50; loop++) {
      let html = '';
      for (const [cls, line] of codeLines) {
        const plain = line.replace(/<[^>]+>/g, '');
        for (let i = 0; i <= plain.length; i += 2) { pre.innerHTML = html + (cls ? `<span class="c">${plain.slice(0, i)}</span>` : esc(plain.slice(0, i))) + '<span class="cur"></span>'; await new Promise(r => setTimeout(r, reduce ? 0 : 28)); }
        html += (cls ? `<span class="c">${line}</span>` : line) + '\n';
      }
      pre.innerHTML = html + '<span class="cur"></span>';
      await new Promise(r => setTimeout(r, 4000));
    }
  }), { threshold: .4 }).observe(pre);

  /* =========================================================
     ABOUT
     ========================================================= */
  const room = $('#darkroom'), printsEl = $('#prints'), pnote = $('#printNote'), pctrl = $('#printCtrl'), pcount = $('#printCount');
  const PR = S.prints;
  printsEl.innerHTML = PR.map((p, i) => `<figure class="print" data-i="${i}"><img src="${p.src}" alt="${esc(p.cap)}" loading="lazy" draggable="false"><figcaption>${esc(p.cap)}</figcaption></figure>`).join('');
  const cards = $$('.print', printsEl);
  let order = PR.map((_, i) => i);
  const POS = [[0, 0, -2], [12, 8, 4], [-12, 14, -5], [6, 20, 6], [-4, 24, -3], [0, 28, 2]];
  function layout() {
    order.forEach((idx, depth) => {
      const el = cards[idx], [x, y, r] = POS[Math.min(depth, POS.length - 1)];
      el.style.zIndex = PR.length - depth; el.style.setProperty('--x', x + 'px'); el.style.setProperty('--y', y + 'px'); el.style.setProperty('--r', r + 'deg');
      el.setAttribute('aria-hidden', depth ? 'true' : 'false');
    });
    pnote.classList.add('swap');
    setTimeout(() => { pnote.textContent = PR[order[0]].note; pnote.classList.remove('swap'); }, 200);
    pcount.textContent = `${order[0] + 1} / ${PR.length}`;
  }
  let opened = false;
  function openEnvelope() {
    if (opened) return; opened = true;
    room.classList.add('open'); pctrl.hidden = false;
    cards.forEach((c, k) => { c.style.transitionDelay = (k * 60) + 'ms'; setTimeout(() => c.style.transitionDelay = '', 900); });
    layout(); cards[order[0]].classList.add('developing'); cards[order[0]].dataset.dev = 1;
    window.Tish && window.Tish.react('happy');
  }
  $('#envelope').addEventListener('click', openEnvelope);
  function toss(dir = 1) {
    if (!opened) return openEnvelope();
    const top = cards[order[0]];
    top.style.setProperty('--x', dir * 360 + 'px'); top.style.setProperty('--y', '-30px'); top.style.setProperty('--r', dir * 22 + 'deg');
    setTimeout(() => {
      order.push(order.shift()); layout();
      const nt = cards[order[0]]; if (!nt.dataset.dev) { nt.dataset.dev = 1; nt.classList.add('developing'); }
    }, 240);
  }
  function back() { if (!opened) return openEnvelope(); order.unshift(order.pop()); layout(); }
  pctrl.addEventListener('click', e => { const b = e.target.closest('[data-print]'); if (b) +b.dataset.print > 0 ? toss(1) : back(); });
  printsEl.addEventListener('pointerdown', e => {
    const el = e.target.closest('.print'); if (!el || !opened || +el.dataset.i !== order[0]) return;
    e.preventDefault(); el.setPointerCapture(e.pointerId); el.classList.add('dragging');
    const x0 = e.clientX, y0 = e.clientY; let dx = 0, dy = 0;
    const move = ev => { dx = ev.clientX - x0; dy = ev.clientY - y0; el.style.setProperty('--x', dx + 'px'); el.style.setProperty('--y', dy + 'px'); el.style.setProperty('--r', (dx / 14 - 2) + 'deg'); };
    const up = () => {
      el.classList.remove('dragging'); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      if (Math.abs(dx) > 80) toss(Math.sign(dx)); else if (Math.abs(dx) < 4 && Math.abs(dy) < 4) toss(1); else layout();
    };
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  });
  addEventListener('keydown', e => {
    if (!opened || !room.contains(document.activeElement)) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); toss(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
  });
  const cities = [['San Francisco', 'san-francisco'], ['New York', 'new-york'], ['Seattle', 'seattle']];
  $('#postcards').innerHTML = cities.map(([n, f], i) => `<figure class="postcard" style="--r:${[-5, 3, -2][i]}deg"><video muted loop playsinline preload="none" poster="${IMG}about/${f}-thumbnail.png" src="${IMG}about/${f}.mp4"></video><span>${n}</span></figure>`).join('');
  $$('.postcard').forEach(p => { const v = $('video', p); p.addEventListener('mouseenter', () => v.play().catch(() => {})); p.addEventListener('mouseleave', () => v.pause()); p.addEventListener('click', () => v.paused ? v.play().catch(() => {}) : v.pause()); });
  const shelf = $('#shelf'), note = $('#shelfNote');
  shelf.innerHTML = D.books.map(([t, f], i) => `<button class="book" style="--r:${[-2, 1, -1, 2, 0, -1.5, 1.5][i % 7]}deg" aria-label="${esc(t)}" data-t="${esc(t)}"><img src="${IMG}about/${f}" alt="" loading="lazy"></button>`).join('');
  shelf.insertAdjacentHTML('afterend', '<div class="shelf-base"></div>');
  $$('.book', shelf).forEach(b => {
    const show = () => { note.style.opacity = 0; setTimeout(() => { note.textContent = b.dataset.t; note.style.opacity = 1; }, 140); };
    b.addEventListener('mouseenter', show); b.addEventListener('focus', show); b.addEventListener('click', show);
  });
  new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { tish('about'); o.disconnect(); } }), { threshold: .35 }).observe($('#about'));
  new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) tish('contact'); }), { threshold: .35 }).observe($('#contact'));

  /* =========================================================
     TREASURE HUNT: six things washed up around the page.
     Each one holds a quote and grows Tish a leaf.
     ========================================================= */
  const T = S.treasures, byId = Object.fromEntries(T.map(t => [t.id, t]));
  const KEY = 'aatisha-v3-treasures';
  let found = new Set();
  try { found = new Set(JSON.parse(localStorage.getItem(KEY) || '[]').filter(id => byId[id])); } catch (e) { /* private mode */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify([...found])); } catch (e) { /* ignore */ } };
  const regular = T.filter(t => !t.final);
  const bottleBtn = $('.treasure[data-t="bottle"]');
  const art = (id, k = 4, sil = false) => window.Pixel ? window.Pixel.sprite(id, k, sil) : '';
  $('#shellsIcon').src = art('scallop', 2);
  $$('.treasure').forEach(b => { b.style.backgroundImage = `url(${art(b.dataset.t, 4)})`; if (found.has(b.dataset.t)) b.classList.add('found'); });
  $$('.frame .treasure, .contact .treasure').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); collect(b.dataset.t, b); }));
  const panel = $('#shellsPanel'), slots = $('#spSlots');
  function renderSlots() {
    slots.innerHTML = T.map(t => `<button type="button" class="${found.has(t.id) ? 'full' : ''}" data-id="${t.id}" aria-label="${found.has(t.id) ? 'Reread: ' + esc(t.name) : 'Not found yet'}"><img src="${art(t.id, 4, !found.has(t.id))}" alt=""></button>`).join('');
    $('#spCount').textContent = `${found.size} of ${T.length}`;
    $('#hintBtn').textContent = found.size === T.length ? 'All found ☀' : 'Tish, a hint?';
  }
  function updateCount(bump) {
    $('#shellsCount').textContent = found.size;
    if (bump) { const b = $('#shellsBtn'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
    const allRegular = regular.every(t => found.has(t.id));
    bottleBtn.classList.toggle('arrived', allRegular && !found.has('bottle'));
    const left = regular.length - regular.filter(t => found.has(t.id)).length;
    $('#bottleHint').textContent = found.has('bottle') ? 'You found every treasure. Thank you for exploring ☀'
      : allRegular ? 'A message in a bottle just washed ashore.' : `Find ${left} more treasure${left === 1 ? '' : 's'} and something will wash ashore.`;
    window.Tish && window.Tish.grow(found.size, { quiet: !bump });
    setMark({ fronds: found.size, crown: found.size === T.length });
    renderSlots();
  }
  const tm = $('#tmodal');
  let tmId = null, tmFocus = null;
  function collect(id, el) {
    const t = byId[id]; if (!t) return;
    const isNew = !found.has(id);
    if (isNew) { found.add(id); save(); el && el.classList.add('found'); }
    openQuote(t, isNew);
  }
  function openQuote(t, isNew) {
    tmId = t.id; tmFocus = document.activeElement;
    $('#tmArt').src = art(t.id, 8);
    $('#tmFound').textContent = t.final ? 'A message in a bottle' : `${isNew ? 'You found a' : 'Your'} ${t.name} · ${found.size} of ${T.length}`;
    $('#tmQuote').textContent = `“${t.quote}”`;
    $('#tmBy').innerHTML = `${esc(t.by)} <span>· ${esc(t.src)}</span>`;
    $('#tmWhy').textContent = t.why;
    $('#tmActs').innerHTML = t.final
      ? `<button class="pill pill-ink" type="button" data-mail>Copy my email</button><button class="pill pill-ghost" type="button" data-resume>See my résumé</button><button class="pill pill-ghost" type="button" data-close>Stay a while</button>`
      : `<button class="pill pill-ink" type="button" data-close>${isNew ? 'Keep it' : 'Back to the page'}</button>`;
    tm.dataset.new = isNew ? '1' : '';
    tm.hidden = false; lockScroll(true);
    setTimeout(() => $('#tmActs button').focus({ preventScroll: true }), 60);
  }
  function closeQuote() {
    if (tm.hidden) return;
    const img = $('#tmArt'), wasNew = tm.dataset.new === '1';
    if (wasNew && !reduce) {
      const r = img.getBoundingClientRect(), to = $('#shellsBtn').getBoundingClientRect(), fly = document.createElement('div');
      fly.className = 'fly-treasure'; fly.style.backgroundImage = `url(${art(tmId, 8)})`;
      Object.assign(fly.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
      document.body.appendChild(fly);
      const dx = to.left + 20 - (r.left + r.width / 2), dy = to.top + to.height / 2 - (r.top + r.height / 2);
      fly.animate([
        { transform: 'translate(0,0) scale(1)' },
        { transform: `translate(${dx * .5}px, ${dy * .5 - 90}px) scale(.55) rotate(-90deg)`, offset: .55 },
        { transform: `translate(${dx}px, ${dy}px) scale(.16) rotate(-200deg)` },
      ], { duration: 820, easing: 'cubic-bezier(.5,0,.3,1)' }).onfinish = () => { fly.remove(); updateCount(true); };
    } else updateCount(wasNew);
    tm.hidden = true; lockScroll(!story.hidden);
    if (wasNew) afterFind(tmId);
    tmFocus && tmFocus.focus && document.body.contains(tmFocus) && tmFocus.focus({ preventScroll: true });
  }
  tm.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) closeQuote();
    else if (e.target.closest('[data-mail]')) copyEmail();
    else if (e.target.closest('[data-resume]')) { closeQuote(); openRecruiter(); }
  });
  function afterFind(id) {
    const t = byId[id], n = regular.filter(x => found.has(x.id)).length;
    if (id === 'conch') { const note = $('#storySheet .st-shell p'); if (note) note.textContent = 'Conch collected. Hold it to your ear later.'; }
    const whenClear = fn => (story.hidden && tm.hidden) ? fn() : setTimeout(() => whenClear(fn), 400);
    setTimeout(() => whenClear(() => {
      if (!window.Tish) return;
      if (t.final) window.Tish.say('Six leaves! I’m a leafy sea dragon now. Thank you for exploring. Go say hi to Aatisha?', { hold: 7000, actions: [{ label: 'Copy her email', primary: true, run: () => { copyEmail(); window.Tish.hush(); } }] });
      else if (n === regular.length) window.Tish.say('Whoa… something just washed ashore at the very bottom.', { hold: 6000, actions: [{ label: 'Take me there', primary: true, run: () => { window.Tish.hush(); scrollToEl($('#contact')); } }] });
      else window.Tish.say(`A ${t.name}! Look, a new leaf. <span class="dim">${found.size}/${T.length}</span>`, { hold: 3400 });
    }), reduce ? 50 : 1000);
  }
  $('#shellsBtn').addEventListener('click', e => { e.stopPropagation(); panel.hidden = !panel.hidden; });
  panel.addEventListener('click', e => {
    e.stopPropagation();
    const b = e.target.closest('.sp-slots button.full'); if (b) { panel.hidden = true; openQuote(byId[b.dataset.id], false); }
  });
  document.addEventListener('click', e => { if (!panel.hidden && !panel.contains(e.target)) panel.hidden = true; });
  $('#resetBtn').addEventListener('click', () => {
    found.clear(); save(); $$('.treasure').forEach(b => b.classList.remove('found')); updateCount(false); panel.hidden = true;
    window.Tish && window.Tish.say('The tide put everything back. My leaves too.', { hold: 2600 });
  });
  function treasureHint() {
    panel.hidden = true;
    const next = T.find(t => !found.has(t.id) && (!t.final || regular.every(r => found.has(r.id))));
    if (!next) { window.Tish && window.Tish.say('You found everything! Nothing left but sunshine.', { hold: 3000 }); return; }
    window.Tish && window.Tish.say(next.hint, { hold: 5200 });
    const target = { conch: '#work', seaglass: '#process', bottle: '#contact' }[next.id];
    const el = target ? $(target) : $(`.treasure[data-t="${next.id}"]`);
    if (!el) return;
    if (target) scrollToEl(el);
    else if (lenis) lenis.scrollTo(el, { offset: -innerHeight / 2 + 40 }); else el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    if (!target) setTimeout(() => { el.classList.remove('hinted'); void el.offsetWidth; el.classList.add('hinted'); }, 900);
  }
  $('#hintBtn').addEventListener('click', e => { e.stopPropagation(); treasureHint(); });
  updateCount(false);
  setTimeout(() => {
    if (!window.Tish) return;
    if (found.size === T.length) window.Tish.say('Welcome back, treasure hunter. Still a leafy sea dragon, thanks to you.', { hold: 4200 });
    else if (found.size) window.Tish.say(`Welcome back! You’ve found ${found.size} of ${T.length} treasures.`, { hold: 5200, actions: [{ label: 'Next hint', primary: true, run: () => { window.Tish.hush(); treasureHint(); } }] });
    else window.Tish.say('Hi, I’m Tish! It’s always summer here. Six treasures are hidden on this page. Click me any time and I’ll take you places.', { hold: 6400, actions: [{ label: 'Show me around', primary: true, run: () => { window.Tish.hush(); scrollToEl($('#hero')); } }, { label: 'A hint', run: () => { window.Tish.hush(); treasureHint(); } }] });
  }, reduce ? 400 : 2200);

  /* =========================================================
     ⌘K COMMAND MENU
     ========================================================= */
  const cmdk = $('#cmdk'), input = $('#cmdkInput'), list = $('#cmdkList');
  const commands = [
    ...D.projects.map(p => ({ g: 'Projects', label: p.title, hint: p.kicker, icon: `<img src="${p.papers[2]}" alt="">`, run: () => { closeCmdk(); openStory(p.id); } })),
    ...D.more.map(m => ({ g: 'Projects', label: m.title, hint: m.kicker + ' ↗', icon: `<img src="${m.img}" alt="">`, run: () => window.open(m.href, '_blank', 'noopener') })),
    ...D.ask.map(([q, a]) => ({ g: 'Ask Aatisha', label: q, icon: '💬', answer: a })),
    { g: 'Actions', label: 'Copy email address', icon: '✉', hint: D.email, run: () => { copyEmail(); closeCmdk(); } },
    { g: 'Actions', label: 'Open recruiter mode', icon: '◧', hint: 'one-page résumé', run: () => { closeCmdk(); openRecruiter(); } },
    { g: 'Actions', label: 'Download résumé (PDF)', icon: '↓', run: () => window.open(D.resume, '_blank', 'noopener') },
    { g: 'Actions', label: 'Print a receipt', icon: '🧾', run: () => { closeCmdk(); scrollToEl($('#hero')); setTimeout(print, 700); } },
    { g: 'Treasure hunt', label: 'Give me a hint', icon: `<img src="${art('scallop', 2)}" alt="" style="image-rendering:pixelated">`, hint: 'Tish knows', run: () => { closeCmdk(); setTimeout(treasureHint, 250); } },
    { g: 'Treasure hunt', label: 'Show my treasures', icon: `<img src="${art('starfish', 2)}" alt="" style="image-rendering:pixelated">`, hint: () => `${found.size} of ${T.length}`, run: () => { closeCmdk(); setTimeout(() => { panel.hidden = false; }, 320); } },
    ...[['The sea (top)', 'intro'], ['Work', 'work'], ['Process', 'process'], ['Journey', 'journey'], ['Lab & notes', 'lab'], ['About', 'about'], ['Contact', 'contact']].map(([l, id]) => ({ g: 'Jump to', label: l, icon: '#', run: () => { closeCmdk(); setTimeout(() => scrollToEl($('#' + id)), 50); } })),
  ];
  let filtered = commands, active = 0, openAnswer = null;
  function renderCmdk() {
    const q = input.value.trim().toLowerCase();
    filtered = commands.filter(c => !q || (c.label + ' ' + (typeof c.hint === 'string' ? c.hint : '') + ' ' + c.g).toLowerCase().includes(q));
    active = clamp(active, 0, Math.max(0, filtered.length - 1));
    if (!filtered.length) { list.innerHTML = `<div class="cmdk-empty">Nothing yet. Try “AI”, “research” or “email”.</div>`; return; }
    let g = '', html = '';
    filtered.forEach((c, i) => {
      if (c.g !== g) { g = c.g; html += `<div class="cmdk-group">${g}</div>`; }
      const hn = typeof c.hint === 'function' ? c.hint() : c.hint;
      html += `<button class="cmdk-item ${i === active ? 'active' : ''}" data-i="${i}" role="option" aria-selected="${i === active}"><span class="ic">${c.icon}</span>${esc(c.label)}${hn ? `<em>${esc(hn)}</em>` : ''}</button>`;
      if (openAnswer === c) html += `<div class="cmdk-answer"><small>Aatisha</small>${esc(c.answer)}</div>`;
    });
    list.innerHTML = html;
    const a = $('.cmdk-item.active', list); a && a.scrollIntoView({ block: 'nearest' });
  }
  function runCmd(c) { if (c.answer) { openAnswer = openAnswer === c ? null : c; renderCmdk(); } else c.run(); }
  function openCmdk() {
    if (!cmdk.hidden) return;
    cmdk.hidden = false; input.value = ''; active = 0; openAnswer = null; renderCmdk(); lockScroll(true);
    requestAnimationFrame(() => cmdk.classList.add('open')); setTimeout(() => input.focus(), 30);
    tish('cmdk');
  }
  function closeCmdk() { cmdk.classList.remove('open'); lockScroll(false); setTimeout(() => cmdk.hidden = true, 300); }
  input.addEventListener('input', () => { active = 0; openAnswer = null; renderCmdk(); });
  list.addEventListener('mousemove', e => { const b = e.target.closest('.cmdk-item'); if (b && +b.dataset.i !== active) { active = +b.dataset.i; $$('.cmdk-item', list).forEach(x => x.classList.toggle('active', +x.dataset.i === active)); } });
  list.addEventListener('click', e => { const b = e.target.closest('.cmdk-item'); if (b) runCmd(filtered[+b.dataset.i]); });
  cmdk.addEventListener('click', e => { if (e.target.matches('[data-close]')) closeCmdk(); });
  $('#cmdkBtn').addEventListener('click', openCmdk);

  /* =========================================================
     RECRUITER MODE
     ========================================================= */
  const rec = $('#recruiter');
  $('#resume').innerHTML = `
    <button class="icon-btn rs-close" data-close aria-label="Close">✕</button>
    <div class="rs-top"><div><h2>Aatisha Cyrill</h2><p class="rs-role">Product Designer · UX Researcher · Front-end background</p></div>
      <div class="rs-contact"><a href="mailto:${D.email}">${D.email}</a><a href="${D.links.linkedin}" target="_blank" rel="noopener">linkedin.com/in/aatisha-cyrill</a><a href="${D.links.medium}" target="_blank" rel="noopener">medium.com/@cyrillaatisha</a></div></div>
    <p class="rs-sum">Product designer and UX researcher with a software engineering background. I design AI and research-heavy products, from discovery interviews and synthesis to prototypes and front-end code. Most recently I designed an AI sales teammate at MyWorker.AI.</p>
    <div class="rs-sec"><p class="label">Selected impact</p><div>
      ${D.projects.map(p => `<div class="rs-item"><b>${esc(p.title)}</b><span>${esc(p.meta.Timeline.split(' · ')[0])}</span><p>${esc(p.meta.Role)}. ${esc(p.line)} <strong>${esc(p.metric[0])} ${esc(p.metric[1])}.</strong></p></div>`).join('')}
    </div></div>
    <div class="rs-sec"><p class="label">Also</p><div>
      <div class="rs-item"><b>SSEC, UW–Madison</b><span>Aug – Sep 2024</span><p>UI/UX design intern. A unified platform for near real-time polar climate data.</p></div>
      <div class="rs-item"><b>Sustain Dane</b><span>Jan – May 2024</span><p>Mobile app design for sustainable behaviour change, from paper prototypes to a design system.</p></div>
      <div class="rs-item"><b>Engineering</b><span>2018 – 2019</span><p>Online assessment platform (Angular, Spring Boot), deal management (PHP, MySQL), plant health IoT (Arduino).</p></div>
    </div></div>
    <div class="rs-sec"><p class="label">Skills</p><div class="rs-tags">${['User research', 'Usability testing', 'Conversational & AI UX', 'Interaction design', 'Prototyping', 'Information architecture', 'Data visualisation', 'Accessibility', 'UX writing', 'HTML / CSS / JS', 'Angular'].map(s => `<span>${s}</span>`).join('')}</div></div>
    <div class="rs-sec"><p class="label">Tools</p><div class="rs-tags">${['Figma', 'FigJam', 'Figma Make', 'Miro', 'Qualtrics', 'Claude', 'ChatGPT', 'Google Veo', 'UX Pilot', 'Notion', 'AWS Personalize'].map(s => `<span>${s}</span>`).join('')}</div></div>
    <div class="rs-sec"><p class="label">Education</p><div><div class="rs-item"><b>University of Wisconsin–Madison</b><span>2023 – 2024</span><p>Graduate studies, Information School. <em style="color:var(--muted);font-size:13px">(TODO: confirm degree & dates)</em></p></div></div></div>
    <div class="rs-actions"><button class="pill" onclick="window.print()">Print / save as PDF</button><a class="pill pill-ink" href="${D.resume}" target="_blank" rel="noopener">Download résumé ↓</a></div>`;
  function openRecruiter() { rec.hidden = false; lockScroll(true); requestAnimationFrame(() => rec.classList.add('open')); tish('recruiter'); }
  function closeRecruiter() { rec.classList.remove('open'); lockScroll(false); setTimeout(() => rec.hidden = true, 400); }
  rec.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeRecruiter(); });
  $('#recruiterBtn').addEventListener('click', openRecruiter);

  /* ---------- keyboard ---------- */
  addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); cmdk.hidden ? openCmdk() : closeCmdk(); return; }
    if (!cmdk.hidden) {
      if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % filtered.length; renderCmdk(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + filtered.length) % filtered.length; renderCmdk(); }
      else if (e.key === 'Enter' && filtered[active]) { e.preventDefault(); runCmd(filtered[active]); }
      else if (e.key === 'Escape') closeCmdk();
      return;
    }
    if (e.key === 'Escape') { if (!tm.hidden) closeQuote(); else if (!panel.hidden) panel.hidden = true; else if (!story.hidden) closeStory(); else if (!rec.hidden) closeRecruiter(); }
    if (!story.hidden && tm.hidden && e.key === 'ArrowRight') { const i = D.projects.indexOf(current); openStory(D.projects[(i + 1) % D.projects.length].id); }
  });
})();

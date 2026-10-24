/* Aatisha Cyrill · v2 · It’s always summer here */
(() => {
  const D = window.DATA, S = D.summer, IMG = window.IMG;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const kai = (...a) => window.Kai && window.Kai.say(...a);
  const kaiReact = k => window.Kai && window.Kai.react(k);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new window.Lenis({ duration: 1.1, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
  }
  const scrollToEl = (el, offset = -90) => lenis ? lenis.scrollTo(el, { offset }) : scrollTo({ top: el.getBoundingClientRect().top + scrollY + offset, behavior: reduce ? 'auto' : 'smooth' });
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const el = $(id); if (!el) return; e.preventDefault(); scrollToEl(el, id === '#top' ? 0 : -90);
  }));
  const lockScroll = on => { document.documentElement.style.overflow = on ? 'hidden' : ''; if (lenis) on ? lenis.stop() : lenis.start(); };

  /* ---------- toast & email ---------- */
  let toastT;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2200); }
  async function copyEmail() {
    try { await navigator.clipboard.writeText(D.email); } catch (e) { /* clipboard can be blocked; the toast still confirms intent */ }
    toast('Email copied. Talk soon ☀');
    const m = $('#mailText'); if (m) { m.textContent = 'Copied!'; setTimeout(() => m.textContent = D.email, 1600); }
  }
  $('#mailBtn').addEventListener('click', e => { e.stopPropagation(); copyEmail(); });

  /* ---------- art: treasures, lace, sun ---------- */
  const O = '#5A2E14';
  const star = (cx, cy, R, r, n = 5) => { let d = ''; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r : R; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1); } return d + 'Z'; };
  const ART = {
    scallop: `<svg viewBox="0 0 64 64"><path d="M22 50h20l3 8H19z" fill="#F79B85" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M32 54C18 50 7 38 8 26c1-9 7-15 13-17 3 3 5 2 6-1 3 2 7 2 10 0 1 3 3 4 6 1 6 2 12 8 13 17 1 12-10 24-24 28z" fill="#FFB4A2" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M32 52 13 22M32 52 21 12M32 52 32 9M32 52 43 12M32 52 51 22" stroke="#E07A62" stroke-width="1.8" stroke-linecap="round"/><path d="M18 18c2-3 5-5 8-6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".7"/></svg>`,
    starfish: `<svg viewBox="0 0 64 64"><path d="${star(32, 34, 28, 12)}" fill="#FF8A5B" stroke="${O}" stroke-width="2.2" stroke-linejoin="round"/>
      ${[[32, 16], [32, 24], [48, 29], [42, 31], [16, 29], [22, 31], [42, 48], [38, 42], [22, 48], [26, 42], [32, 34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#FFD2B8"/>`).join('')}</svg>`,
    seaglass: `<svg viewBox="0 0 64 64"><path d="M18 22c6-10 22-12 30-4 8 8 6 24-4 32-10 7-26 4-31-6-4-8-1-16 5-22z" fill="#7FD8C9" fill-opacity=".92" stroke="#2E7F74" stroke-width="2" stroke-linejoin="round"/>
      <path d="M22 22c6-6 14-6 18-3" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/><path d="M40 44c3-2 5-5 6-8" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".5"/></svg>`,
    conch: `<svg viewBox="0 0 64 64"><path d="M13 44C9 30 21 11 38 9c12-1 18 8 14 16-4 10-14 18-22 26-4 4-13 3-17-7z" fill="#F8D8B8" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M30 51c6-6 14-12 18-20-4 10-8 18-14 25z" fill="#FF9EB5" stroke="${O}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M38 13c7 0 9 7 5 10-4 2-8-2-4-4M18 40c4-6 10-12 18-16M16 32c4-4 8-8 14-10" fill="none" stroke="#C98E5A" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    sanddollar: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="25" fill="#F4E4C1" stroke="${O}" stroke-width="2"/>
      ${[0, 72, 144, 216, 288].map(a => `<ellipse cx="32" cy="20" rx="3.6" ry="8.5" fill="none" stroke="#C9A66B" stroke-width="2" transform="rotate(${a} 32 32)"/>`).join('')}<circle cx="32" cy="32" r="2.6" fill="#C9A66B"/>
      <path d="M16 20c3-4 7-6 11-7" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/></svg>`,
    bottle: `<svg viewBox="0 0 64 64"><g transform="rotate(-28 32 32)"><rect x="25" y="4" width="14" height="9" rx="2.5" fill="#C98E5A" stroke="${O}" stroke-width="2"/>
      <path d="M27 13h10v7c7 3 10 8 10 15v18a6 6 0 0 1-6 6H23a6 6 0 0 1-6-6V35c0-7 3-12 10-15z" fill="#BFE8D9" fill-opacity=".9" stroke="#2E7F74" stroke-width="2" stroke-linejoin="round"/>
      <rect x="24" y="31" width="16" height="22" rx="3" fill="#FFF6E0" stroke="#D8BE8E" stroke-width="1.6"/><path d="M24 42h16" stroke="#FF7A59" stroke-width="2"/>
      <path d="M21 36c0-4 2-7 5-9" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/></g></svg>`,
  };
  const SUN = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="#FF7A59"/>${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<rect x="11" y="1" width="2" height="4.5" rx="1" fill="#FF7A59" transform="rotate(${a} 12 12)"/>`).join('')}</svg>`;

  // eyelet lace for the polaroids: scalloped edge + a row of holes, used as a border-image
  (function lace() {
    let c = '', h = '';
    for (let i = 0; i <= 6; i++) { const p = 5 + i * 10; if (p > 55) break; c += `<circle cx="${p}" cy="5" r="5"/><circle cx="${p}" cy="55" r="5"/><circle cx="5" cy="${p}" r="5"/><circle cx="55" cy="${p}" r="5"/>`; }
    for (let i = 0; i < 6; i++) { const p = 5 + i * 10; h += `<circle cx="${p}" cy="12.5" r="2"/><circle cx="${p}" cy="47.5" r="2"/><circle cx="12.5" cy="${p}" r="2"/><circle cx="47.5" cy="${p}" r="2"/>`; }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><defs><mask id="m"><rect width="60" height="60" fill="#fff"/><g fill="#000">${h}</g></mask></defs>
      <g mask="url(#m)" fill="#fff">${c}<rect x="5" y="5" width="50" height="50"/></g>
      <rect x="17.5" y="17.5" width="25" height="25" fill="none" stroke="#EADFCB" stroke-width="1" stroke-dasharray="2 2"/></svg>`;
    document.documentElement.style.setProperty('--lace', `url("data:image/svg+xml,${encodeURIComponent(svg)}")`);
  })();

  /* ---------- nav, clock, favicon, reveals ---------- */
  if (window.kaiMark) { $('#favicon').href = window.kaiMark(); }
  const clock = $('#clock');
  const tick = () => { clock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
  tick(); setInterval(tick, 15000);
  const sectionIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    $$('.nav-links a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['work', 'about', 'contact'].forEach(id => sectionIO.observe($('#' + id)));
  const revealIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal]').forEach((el, i) => { if (el.closest('.hero')) el.style.setProperty('--d', (.15 + i * .08) + 's'); revealIO.observe(el); });

  /* ---------- ribbon ---------- */
  const words = ['Always summer', 'MyWorker.AI', 'UW–Madison Libraries', 'Amazon × Shopbop', 'Trader Joe’s research', 'Rover', 'SSEC', 'Sustain Dane', 'SF Tech Week 2025'];
  const run = words.map(w => `<span>${esc(w)}${SUN}</span>`).join('');
  $('#ribbon').innerHTML = run + run;

  /* =========================================================
     WORK: one featured story, the rest waiting in the deck
     ========================================================= */
  const P = D.projects, feature = $('#feature'), deck = $('#deck');
  let cur = 0, busy = false, feat;
  function featBody(p, i) {
    return `<p class="feat-kicker">${esc(p.kicker)}</p>
      <h3 class="feat-title">${esc(p.title)}</h3>
      <p class="feat-line">${esc(p.line)}</p>
      <div class="feat-metric"><b>${esc(p.metric[0])}</b><span>${esc(p.metric[1])}</span></div>
      <dl class="feat-meta"><div><dt>Role</dt><dd>${esc(p.meta.Role)}</dd></div><div><dt>Timeline</dt><dd>${esc(p.meta.Timeline)}</dd></div></dl>
      <div class="feat-acts"><button class="btn sun" type="button" data-open>Open the story <span aria-hidden="true">→</span></button><a class="btn ghost" href="${p.caseStudy}" target="_blank" rel="noopener">Full case study ↗</a></div>
      <div class="feat-nav"><button class="round" type="button" data-step="-1" aria-label="Previous story">←</button><button class="round" type="button" data-step="1" aria-label="Next story">→</button>
        <span>${String(i + 1).padStart(2, '0')} / ${String(P.length).padStart(2, '0')}</span><span class="feat-dots">${P.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</span></div>`;
  }
  function paint(i) {
    const p = P[i];
    feat.style.setProperty('--tint', p.tint); feat.style.setProperty('--deep', p.tintDeep); feat.style.setProperty('--fink', p.ink);
    $('.feat-media', feat).innerHTML = `<img class="fm-main" src="${p.papers[2]}" alt="${esc(p.title)}: final design"><img class="fm-a" src="${p.papers[0]}" alt=""><img class="fm-b" src="${p.papers[1]}" alt="">`;
    $('.feat-body', feat).innerHTML = featBody(p, i);
  }
  function renderDeck(fromIdx) {
    const order = P.map((_, k) => (cur + 1 + k) % P.length).slice(0, P.length - 1);
    deck.innerHTML = order.map((k, n) => { const p = P[k]; return `<button class="dcard" type="button" data-k="${k}" style="--tint:${p.tint};--fink:${p.ink};--i:${n}" aria-label="Show ${esc(p.title)}">
      <img src="${p.papers[2]}" alt="" loading="lazy"><div><small>${esc(p.kicker)}</small><b>${esc(p.title)}</b><span>${esc(p.metric[0])} ${esc(p.metric[1])}</span></div></button>`; }).join('');
  }
  feature.innerHTML = `<article class="feat"><div class="feat-media"></div><div class="feat-body"></div></article>`;
  feat = $('.feat', feature);
  paint(0); renderDeck();

  function show(i, { from = null, dir = 1 } = {}) {
    i = (i + P.length) % P.length;
    if (busy || i === cur) return; busy = true;
    const done = () => { busy = false; };
    if (reduce) { cur = i; paint(i); renderDeck(); done(); return; }
    // the div stays the same: its tint morphs while the content swoops out and the new story swoops in
    let ghost = null;
    if (from) {
      const fi = $('img', from), fr = fi.getBoundingClientRect(), to = $('.fm-main', feat).getBoundingClientRect();
      ghost = document.createElement('img'); ghost.className = 'fly-img'; ghost.src = fi.src;
      Object.assign(ghost.style, { left: fr.left + 'px', top: fr.top + 'px', width: fr.width + 'px', height: fr.height + 'px' });
      document.body.appendChild(ghost);
      ghost.animate([
        { left: fr.left + 'px', top: fr.top + 'px', width: fr.width + 'px', height: fr.height + 'px', transform: 'rotate(0deg)' },
        { offset: .55, transform: 'rotate(-3deg)' },
        { left: to.left + 'px', top: to.top + 'px', width: to.width + 'px', height: to.height + 'px', transform: 'rotate(0deg)' },
      ], { duration: 720, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
      from.style.visibility = 'hidden';
    }
    feat.classList.remove('entering', 'to-left', 'to-right');
    feat.classList.add('leaving', dir < 0 ? 'to-right' : 'to-left');
    cur = i;
    feat.style.setProperty('--tint', P[i].tint); feat.style.setProperty('--fink', P[i].ink);
    setTimeout(() => {
      paint(i); feat.classList.remove('leaving', 'to-left', 'to-right'); void feat.offsetWidth; feat.classList.add('entering');
      renderDeck();
      const main = $('.fm-main', feat);
      if (ghost) { main.style.opacity = 0; setTimeout(() => { main.style.opacity = ''; ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' }).onfinish = () => ghost.remove(); }, 380); }
      setTimeout(done, 450);
    }, from ? 360 : 300);
  }
  feature.addEventListener('click', e => {
    const s = e.target.closest('[data-step]'); if (s) { show(cur + +s.dataset.step, { dir: +s.dataset.step }); return; }
    if (e.target.closest('[data-open]')) openStory(P[cur].id);
  });
  deck.addEventListener('click', e => { const c = e.target.closest('.dcard'); if (c) show(+c.dataset.k, { from: c }); });
  $('#work').addEventListener('keydown', e => {
    if (e.target.closest('input')) return;
    if (e.key === 'ArrowRight') show(cur + 1, { dir: 1 }); else if (e.key === 'ArrowLeft') show(cur - 1, { dir: -1 });
  });
  // swipe the big card on touch
  let sx = null;
  feature.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') sx = e.clientX; });
  feature.addEventListener('pointerup', e => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 60) show(cur + (dx < 0 ? 1 : -1), { dir: dx < 0 ? 1 : -1 }); });
  $('#also').innerHTML = `<span>Also:</span>` + D.more.map(m => `<a href="${m.href}" target="_blank" rel="noopener"><img src="${m.img}" alt="" loading="lazy">${esc(m.title)} ↗</a>`).join('');

  /* =========================================================
     STORY overlay (one step deeper). Shared with v1.
     ========================================================= */
  const story = $('#story'), sheet = $('#storySheet');
  let lastFocus = null, current = null;
  function storyHTML(p) {
    const i = P.indexOf(p), nx = P[(i + 1) % P.length];
    const conch = !found.has('conch') ? `<div class="st-shell"><button class="treasure" data-t="conch" type="button" aria-label="A conch shell, washed up at the end of the story">${ART.conch}</button><p>You read all the way to the end. That deserves a treasure.</p></div>` : '';
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
        <section class="st-section"><p class="label">What I’d do next</p><div><p class="st-next">${esc(p.next)}</p>${conch}</div></section>
        <div class="st-foot"><a class="pill pill-ghost" href="${p.caseStudy}" target="_blank" rel="noopener">Read the full case study ↗</a>
          <button class="st-nextcard" data-next><img src="${nx.papers[2]}" alt=""><div><small>Next story</small><b>${esc(nx.title)} →</b></div></button></div>
      </div>`;
  }
  function openStory(id) {
    const p = P.find(x => x.id === id); if (!p) return;
    current = p; lastFocus = lastFocus || document.activeElement;
    sheet.innerHTML = storyHTML(p); sheet.scrollTop = 0;
    const c = $('.treasure', sheet); if (c) c.addEventListener('click', ev => { ev.stopPropagation(); collect('conch', c); });
    if (story.hidden) { story.hidden = false; lockScroll(true); requestAnimationFrame(() => requestAnimationFrame(() => story.classList.add('open'))); }
    setTimeout(() => sheet.focus({ preventScroll: true }), 60);
  }
  function closeStory() {
    story.classList.remove('open'); lockScroll(false);
    setTimeout(() => { story.hidden = true; }, 650);
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true }); lastFocus = null;
  }
  story.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) closeStory();
    else if (e.target.closest('[data-next]')) { const i = P.indexOf(current); openStory(P[(i + 1) % P.length].id); }
  });

  /* =========================================================
     ABOUT: an envelope of summer prints
     ========================================================= */
  const room = $('#darkroom'), prints = $('#prints'), note = $('#printNote'), ctrl = $('#printCtrl'), count = $('#printCount');
  const PR = S.prints;
  prints.innerHTML = PR.map((p, i) => `<figure class="print" data-i="${i}"><img src="${p.src}" alt="${esc(p.cap)}" loading="lazy" draggable="false"><figcaption>${esc(p.cap)}</figcaption></figure>`).join('');
  const cards = $$('.print', prints);
  let order = PR.map((_, i) => i);   // order[0] is the print on top
  const POS = [[0, 0, -2], [14, 10, 4], [-12, 18, -6], [6, 26, 7], [-4, 30, -3], [0, 34, 2]];
  function layout() {
    order.forEach((idx, depth) => {
      const el = cards[idx], [x, y, r] = POS[Math.min(depth, POS.length - 1)];
      el.style.zIndex = PR.length - depth; el.style.setProperty('--x', x + 'px'); el.style.setProperty('--y', y + 'px'); el.style.setProperty('--r', r + 'deg');
      el.setAttribute('aria-hidden', depth ? 'true' : 'false');
    });
    const top = PR[order[0]];
    note.classList.add('swap');
    setTimeout(() => { note.textContent = top.note; note.classList.remove('swap'); }, 180);
    count.textContent = `${order[0] + 1} / ${PR.length}`;
  }
  let opened = false;
  function openEnvelope() {
    if (opened) return; opened = true;
    room.classList.add('open'); ctrl.hidden = false;
    cards.forEach((c, k) => { c.style.transitionDelay = (k * 60) + 'ms'; setTimeout(() => c.style.transitionDelay = '', 900); });
    layout();
    cards[order[0]].classList.add('developing');
    kaiReact('happy');
  }
  $('#envelope').addEventListener('click', openEnvelope);
  function toss(dir = 1) {
    if (!opened) return openEnvelope();
    const top = cards[order[0]];
    top.style.setProperty('--x', dir * 380 + 'px'); top.style.setProperty('--y', '-40px'); top.style.setProperty('--r', dir * 24 + 'deg');
    setTimeout(() => {
      order.push(order.shift()); layout();
      const nt = cards[order[0]]; if (!nt.dataset.dev) { nt.dataset.dev = 1; nt.classList.add('developing'); }
    }, 260);
  }
  function back() {
    if (!opened) return openEnvelope();
    order.unshift(order.pop()); layout();
  }
  ctrl.addEventListener('click', e => { const b = e.target.closest('[data-print]'); if (b) +b.dataset.print > 0 ? toss(1) : back(); });
  cards[0].dataset.dev = 1;
  // drag the top print and let go to toss it
  prints.addEventListener('pointerdown', e => {
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
  $('#reads').innerHTML = S.beachReads.map(([t, f], i) => `<span title="${esc(t)}"><img src="${IMG}about/${f}" alt="${esc(t)}" loading="lazy" style="--r:${[-4, 3, -2, 5, -3][i % 5]}deg"></span>`).join('');

  /* =========================================================
     CONTACT: postcard
     ========================================================= */
  const pc = $('#postcard');
  $('#stamp').innerHTML = $('#kai .kai-svg') ? $('#kai .kai-svg').outerHTML : '';
  const flip = () => pc.classList.toggle('flipped');
  pc.addEventListener('click', e => { if (!e.target.closest('a, button')) flip(); });
  $('#pcFlip').addEventListener('click', flip);
  new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { setTimeout(() => pc.classList.add('flipped'), reduce ? 0 : 900); o.disconnect(); } }), { threshold: .55 }).observe(pc);

  /* =========================================================
     TREASURE HUNT
     ========================================================= */
  const T = S.treasures, byId = Object.fromEntries(T.map(t => [t.id, t]));
  const KEY = 'aatisha-summer-treasures';
  let found = new Set();
  try { found = new Set(JSON.parse(localStorage.getItem(KEY) || '[]').filter(id => byId[id])); } catch (e) { /* private mode */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify([...found])); } catch (e) { /* ignore */ } };
  const regular = T.filter(t => !t.final);
  const bottleBtn = $('.treasure[data-t="bottle"]');
  $$('.treasure').forEach(b => { const id = b.dataset.t; if (!b.innerHTML.trim()) b.innerHTML = ART[id]; if (found.has(id)) b.classList.add('found'); });
  $$('.frame .treasure, .shore .treasure').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); collect(b.dataset.t, b); }));
  function updateCount(bump) {
    $('#bucketCount').textContent = found.size;
    if (bump) { const bk = $('#bucketBtn'); bk.classList.remove('bump'); void bk.offsetWidth; bk.classList.add('bump'); }
    const allRegular = regular.every(t => found.has(t.id));
    bottleBtn.classList.toggle('arrived', allRegular && !found.has('bottle'));
    $('#bottleHint').textContent = found.has('bottle') ? 'You found every treasure. Thank you for exploring ☀' : `Find the ${regular.length - regular.filter(t => found.has(t.id)).length} remaining treasures above and something will wash ashore.`;
    renderSlots();
  }
  const tm = $('#tmodal');
  let tmFrom = null, tmId = null;
  function collect(id, el) {
    const t = byId[id]; if (!t) return;
    const isNew = !found.has(id);
    tmFrom = el; tmId = id;
    if (isNew) { found.add(id); save(); el && el.classList.add('found'); }
    openQuote(t, isNew);
  }
  function openQuote(t, isNew) {
    const n = found.size;
    $('#tmArt').innerHTML = ART[t.id];
    $('#tmFound').textContent = t.final ? 'A message in a bottle' : `${isNew ? 'You found' : 'Your'} ${t.name} · ${n} of ${T.length}`;
    $('#tmQuote').textContent = `“${t.quote}”`;
    $('#tmBy').innerHTML = `${esc(t.by)} <span>· ${esc(t.src)}</span>`;
    $('#tmWhy').textContent = t.why;
    $('#tmActs').innerHTML = t.final
      ? `<button class="btn sun" type="button" data-mail>Copy my email</button><button class="btn ghost" type="button" data-resume>See my résumé</button><button class="btn ghost" type="button" data-close>Stay a while</button>`
      : `<button class="btn sun" type="button" data-close>${isNew ? 'Keep it in my bucket' : 'Back to the beach'}</button>`;
    tm.hidden = false; lockScroll(true);
    setTimeout(() => $('#tmActs button').focus({ preventScroll: true }), 50);
    tm.dataset.new = isNew ? 1 : '';
  }
  function closeQuote() {
    if (tm.hidden) return;
    const art = $('#tmArt svg'), wasNew = tm.dataset.new === '1';
    const bucket = $('#bucketBtn').getBoundingClientRect();
    if (art && wasNew && !reduce) {
      const r = art.getBoundingClientRect(), fly = document.createElement('div');
      fly.className = 'fly-treasure'; fly.innerHTML = ART[tmId];
      Object.assign(fly.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
      document.body.appendChild(fly);
      const dx = bucket.left + bucket.width / 2 - (r.left + r.width / 2), dy = bucket.top + bucket.height / 2 - (r.top + r.height / 2);
      fly.animate([
        { transform: 'translate(0,0) scale(1) rotate(0)' },
        { transform: `translate(${dx * .5}px, ${dy * .5 - 120}px) scale(.6) rotate(-120deg)`, offset: .5 },
        { transform: `translate(${dx}px, ${dy}px) scale(.18) rotate(-260deg)`, opacity: .9 },
      ], { duration: 820, easing: 'cubic-bezier(.5,0,.3,1)' }).onfinish = () => { fly.remove(); updateCount(true); };
    } else updateCount(wasNew);
    tm.hidden = true; lockScroll(!story.hidden);
    if (wasNew) afterFind(tmId);
    tmFrom = null;
  }
  tm.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) closeQuote();
    else if (e.target.closest('[data-mail]')) copyEmail();
    else if (e.target.closest('[data-resume]')) { closeQuote(); openRecruiter(); }
  });
  function afterFind(id) {
    const t = byId[id], n = regular.filter(x => found.has(x.id)).length;
    if (id === 'conch') { const note = $('#storySheet .st-shell p'); if (note) note.textContent = 'Conch collected. It’s in your bucket now ☀'; }
    // Kai lives in the nav, so hold the news until the story sheet is out of the way
    const whenClear = fn => (story.hidden && tm.hidden) ? fn() : setTimeout(() => whenClear(fn), 400);
    setTimeout(() => whenClear(() => {
      kaiReact(t.final ? 'wow' : 'happy');
      if (t.final) kai('You found every single treasure. Aatisha would love to hear from you!', { actions: [{ label: 'Copy her email', primary: true, run: copyEmail }] });
      else if (n === regular.length) kai('Whoa, something just washed ashore at the very bottom…', { actions: [{ label: 'Take me there', primary: true, run: () => { if (!story.hidden) closeStory(); setTimeout(() => scrollToEl($('#shore'), -200), 200); } }] });
      else kai(`Ooh, a ${t.name}! That’s ${n} of ${regular.length}. Keep looking…`, { hold: 3400 });
    }), reduce ? 50 : 900);
  }
  // bucket panel
  const panel = $('#bucketPanel');
  function renderSlots() {
    $('#slots').innerHTML = T.map(t => `<button class="slot ${found.has(t.id) ? 'full' : 'empty'}" type="button" data-id="${t.id}" aria-label="${found.has(t.id) ? 'Reread: ' + t.name : 'Not found yet'}" ${found.has(t.id) ? '' : 'tabindex="-1"'}>${ART[t.id]}</button>`).join('');
  }
  $('#bucketBtn').addEventListener('click', e => { e.stopPropagation(); panel.hidden = !panel.hidden; });
  panel.addEventListener('click', e => {
    e.stopPropagation();
    const s = e.target.closest('.slot.full'); if (s) { panel.hidden = true; tmId = s.dataset.id; openQuote(byId[s.dataset.id], false); }
  });
  document.addEventListener('click', e => { if (!panel.hidden && !panel.contains(e.target)) panel.hidden = true; });
  $('#resetBtn').addEventListener('click', () => { found.clear(); save(); $$('.treasure').forEach(b => b.classList.remove('found')); updateCount(false); panel.hidden = true; kai('Bucket emptied. The tide put everything back.', { hold: 2600 }); });
  const HINTS = { scallop: 'Check the sand right under the big hello.', starfish: 'Something’s stuck to the featured story card.', seaglass: 'Look near the envelope of prints.', conch: 'Open any story and read all the way to the end.', sanddollar: 'Peek under the corner of the postcard.', bottle: 'Scroll all the way down to the shore.' };
  function hint() {
    panel.hidden = true;
    const next = T.find(t => !found.has(t.id) && (!t.final || regular.every(r => found.has(r.id))));
    if (!next) { kai('You’ve found everything! Nothing left but sunshine.', { hold: 3000 }); return; }
    kai(HINTS[next.id], { hold: 4200 });
    const el = next.id === 'conch' ? $('#work') : $(`.treasure[data-t="${next.id}"]`);
    if (el) { scrollToEl(el, next.id === 'conch' ? -90 : -innerHeight / 2 + 40); if (next.id !== 'conch') setTimeout(() => { el.classList.remove('hinted'); void el.offsetWidth; el.classList.add('hinted'); }, 700); }
  }
  $('#hintBtn').addEventListener('click', hint);
  updateCount(false);

  /* =========================================================
     KAI: menu, greetings and the odd idle thought
     ========================================================= */
  if (window.Kai) {
    window.Kai.setMenu(() => [
      { label: 'Show me the work', primary: true, run: () => scrollToEl($('#work')) },
      { label: 'Who’s Aatisha?', run: () => { scrollToEl($('#about')); setTimeout(openEnvelope, 900); } },
      { label: 'A treasure hint', run: hint },
      { label: 'Say hello', run: () => scrollToEl($('#contact')) },
      { label: 'Résumé', run: () => openRecruiter() },
    ]);
    setTimeout(() => {
      if (found.size === T.length) kai('Welcome back, treasure hunter. Your bucket is still full of summer.', { actions: [{ label: 'Reread the quotes', primary: true, run: () => { setTimeout(() => { panel.hidden = false; }, 0); } }] });
      else if (found.size) kai(`Welcome back! You’ve found ${found.size} of ${T.length} treasures so far.`, { actions: [{ label: 'Next hint', primary: true, run: hint }] });
      else kai(S.kai.hello, { actions: [{ label: 'Show me around', primary: true, run: () => scrollToEl($('#work')) }, { label: 'Give me a hint', run: hint }] });
    }, reduce ? 300 : innerWidth < 720 ? 3200 : 1800);
    let idleN = 0, lastAct = performance.now();
    ['pointerdown', 'keydown', 'wheel'].forEach(t => addEventListener(t, () => lastAct = performance.now(), { passive: true }));
    setInterval(() => {
      if (idleN >= 2 || performance.now() - lastAct < 40000 || !tm.hidden || !story.hidden) return;
      kai(S.kai.idle[idleN++ % S.kai.idle.length], { hold: 3600 });
    }, 10000);
  }

  /* =========================================================
     ⌘K COMMAND MENU
     ========================================================= */
  const cmdk = $('#cmdk'), input = $('#cmdkInput'), list = $('#cmdkList');
  const commands = [
    ...P.map(p => ({ g: 'Stories', label: p.title, hint: p.kicker, icon: `<img src="${p.papers[2]}" alt="">`, run: () => { closeCmdk(); openStory(p.id); } })),
    ...D.more.map(m => ({ g: 'Stories', label: m.title, hint: m.kicker + ' ↗', icon: `<img src="${m.img}" alt="">`, run: () => window.open(m.href, '_blank', 'noopener') })),
    ...D.ask.map(([q, a]) => ({ g: 'Ask Aatisha', label: q, icon: '💬', answer: a })),
    { g: 'Treasure hunt', label: 'Give me a hint', icon: '🐚', hint: 'Kai knows', run: () => { closeCmdk(); setTimeout(hint, 200); } },
    { g: 'Treasure hunt', label: 'Open my beach bucket', icon: '🪣', run: () => { closeCmdk(); setTimeout(() => panel.hidden = false, 200); } },
    { g: 'Actions', label: 'Copy email address', icon: '✉', hint: D.email, run: () => { copyEmail(); closeCmdk(); } },
    { g: 'Actions', label: 'Open recruiter mode', icon: '◧', hint: 'one-page résumé', run: () => { closeCmdk(); openRecruiter(); } },
    { g: 'Actions', label: 'Download résumé (PDF)', icon: '↓', run: () => window.open(D.resume, '_blank', 'noopener') },
    { g: 'Actions', label: 'Open the summer prints', icon: '📷', run: () => { closeCmdk(); scrollToEl($('#about')); setTimeout(openEnvelope, 900); } },
    ...[['Work', 'work'], ['About', 'about'], ['Say hello', 'contact']].map(([l, id]) => ({ g: 'Jump to', label: l, icon: '#', run: () => { closeCmdk(); setTimeout(() => scrollToEl($('#' + id)), 50); } })),
  ];
  let filtered = commands, active = 0, openAnswer = null;
  function renderCmdk() {
    const q = input.value.trim().toLowerCase();
    filtered = commands.filter(c => !q || (c.label + ' ' + (c.hint || '') + ' ' + c.g).toLowerCase().includes(q));
    active = clamp(active, 0, Math.max(0, filtered.length - 1));
    if (!filtered.length) { list.innerHTML = `<div class="cmdk-empty">Nothing yet. Try “AI”, “shell” or “email”.</div>`; return; }
    let g = '', html = '';
    filtered.forEach((c, i) => {
      if (c.g !== g) { g = c.g; html += `<div class="cmdk-group">${g}</div>`; }
      html += `<button class="cmdk-item ${i === active ? 'active' : ''}" data-i="${i}" role="option" aria-selected="${i === active}"><span class="ic">${c.icon}</span>${esc(c.label)}${c.hint ? `<em>${esc(c.hint)}</em>` : ''}</button>`;
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
  }
  function closeCmdk() { cmdk.classList.remove('open'); lockScroll(false); setTimeout(() => cmdk.hidden = true, 300); }
  input.addEventListener('input', () => { active = 0; openAnswer = null; renderCmdk(); });
  list.addEventListener('mousemove', e => { const b = e.target.closest('.cmdk-item'); if (b && +b.dataset.i !== active) { active = +b.dataset.i; $$('.cmdk-item', list).forEach(x => x.classList.toggle('active', +x.dataset.i === active)); } });
  list.addEventListener('click', e => { const b = e.target.closest('.cmdk-item'); if (b) runCmd(filtered[+b.dataset.i]); });
  cmdk.addEventListener('click', e => { if (e.target.matches('[data-close]')) closeCmdk(); });
  $('#cmdkBtn').addEventListener('click', openCmdk);

  /* =========================================================
     RECRUITER MODE (shared with v1)
     ========================================================= */
  const rec = $('#recruiter');
  $('#resume').innerHTML = `
    <button class="icon-btn rs-close" data-close aria-label="Close">✕</button>
    <div class="rs-top"><div><h2>Aatisha Cyrill</h2><p class="rs-role">Product Designer · UX Researcher · Front-end background</p></div>
      <div class="rs-contact"><a href="mailto:${D.email}">${D.email}</a><a href="${D.links.linkedin}" target="_blank" rel="noopener">linkedin.com/in/aatisha-cyrill</a><a href="${D.links.medium}" target="_blank" rel="noopener">medium.com/@cyrillaatisha</a></div></div>
    <p class="rs-sum">Product designer and UX researcher with a software engineering background. I design AI and research-heavy products, from discovery interviews and synthesis to prototypes and front-end code. Most recently I designed an AI sales teammate at MyWorker.AI.</p>
    <div class="rs-sec"><p class="label">Selected impact</p><div>
      ${P.map(p => `<div class="rs-item"><b>${esc(p.title)}</b><span>${esc(p.meta.Timeline.split(' · ')[0])}</span><p>${esc(p.meta.Role)}. ${esc(p.line)} <strong>${esc(p.metric[0])} ${esc(p.metric[1])}.</strong></p></div>`).join('')}
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
  function openRecruiter() { rec.hidden = false; lockScroll(true); requestAnimationFrame(() => rec.classList.add('open')); }
  function closeRecruiter() { rec.classList.remove('open'); lockScroll(false); setTimeout(() => rec.hidden = true, 400); }
  rec.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeRecruiter(); });
  $('#recruiterBtn').addEventListener('click', openRecruiter);
  $$('[data-resume]').forEach(b => b.addEventListener('click', openRecruiter));

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
    if (e.key === 'Escape') {
      if (!tm.hidden) closeQuote(); else if (!panel.hidden) panel.hidden = true;
      else if (!story.hidden) closeStory(); else if (!rec.hidden) closeRecruiter();
      window.Kai && window.Kai.hush();
    }
    if (!story.hidden && tm.hidden && e.key === 'ArrowRight') { const i = P.indexOf(current); openStory(P[(i + 1) % P.length].id); }
  });
})();

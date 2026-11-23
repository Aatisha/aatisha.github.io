// The brand mark, top left on every page: AC, with a rainbow on its side for the C ("Soft ends").
// The first page of a visit plays the intro: the A rises and the rainbow draws in band by band. Then the
// mark opens out to "Aatisha Cyrill", holds and folds back. On the home page it opens as "Product
// Designer" rises, so the two read as one title card: name, then role. After that, hovering or focusing
// it spells the name and leaving folds it back. The intro runs on a timeline; hover runs on springs, so
// it can reverse mid-move without a jump. The link keeps "Aatisha Cyrill" as hidden text for screen readers.
//
// Type is matched to the page: Geist Medium, the weight of "Hi, I'm Aatisha." in the hero, at about 22px,
// sitting on the nav's baseline. The A's strokes are drawn at Geist Medium's stem and bar thickness.
(() => {
  const links = [...document.querySelectorAll('a.brand')];
  if (!links.length) return;

  const NS = 'http://www.w3.org/2000/svg';
  const BANDS = ['#e5484d', '#f76b15', '#ffc53d', '#46a758', '#0090ff', '#3e63dd', '#8e4ec6'];
  const SPAN = 172, GAP = 0.5;         // Soft ends: each band rounded off, a hairline of paper between
                                       // (thinner than the full-size mark's 0.9, so the colours stay saturated when small)
  const BAND = 4;                      // band width, in 1/84ths of the cap height
  const CAP = 16;                      // cap height in px: Geist at about 22.5px, a touch above the hero's 20px intro line
  const C_SCALE = 1.08;                // the rainbow C, a touch bigger than the cap height, around its centre
  const WEIGHT = 500;
  const TRACK = -0.01;                 // em, as the old wordmark
  const SEEN = 'ac-mark-intro';        // sessionStorage: the intro plays once per visit
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Intro timing, on a 90 BPM grid (one beat = 0.667s), the same as the film. Everything after the
  // expand is counted from it, because on the home page the expand waits for the headline.
  const BEAT = 60 / 90;
  const DRAW = { bands: BEAT / 2, step: BEAT / 8, dur: 0.6 };
  const DRAWN = DRAW.bands + 6 * DRAW.step + DRAW.dur;           // the last band is in
  const EXPAND = BEAT * 3;                                       // when nothing else is on stage
  const after = (e) => ({
    expand: e, yOut: e + BEAT * 0.4,
    contract: e + BEAT * 5, lean: e + BEAT * 5.1, sweep: e + BEAT * 5.3, end: e + BEAT * 7 + 0.8,
  });
  const WAITING = { expand: Infinity, yOut: Infinity, contract: Infinity, lean: Infinity, sweep: Infinity, end: Infinity };

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const easeOutCubic = (x) => 1 - (1 - x) ** 3;
  const easeOutQuint = (x) => 1 - (1 - x) ** 5;
  const easeInCubic = (x) => x * x * x;
  const spring = (t, w, z) => {
    if (!(t > 0)) return 0;
    const wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t));
  };
  // How open the mark is during the intro: 0 = AC, 1 = Aatisha Cyrill. Opening is a soft spring with
  // only a breath of overshoot, like the page's own text, which drifts in on a long ease-out.
  const introOpen = (t, T) => {
    if (!(t >= T.expand)) return 0;
    const out = spring(t - T.expand, 6, 0.82);
    if (t < T.lean) return out;
    if (t < T.sweep) return out + 0.03 * Math.sin(Math.PI * (t - T.lean) / (T.sweep - T.lean));
    return out * (1 - spring(t - T.sweep, 3.67, 0.8));
  };
  // How far "yrill" has come out of the C's open side during the intro.
  const introMouth = (t, T) => (!(t >= T.contract)
    ? spring(t - T.yOut, 8, 0.85)
    : 1 - easeInCubic(clamp((t - T.contract) / 0.3)));

  const el = (name, attrs, parent) => {
    const node = document.createElementNS(NS, name);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  };

  let uid = 0;
  // Draws the mark into the link and returns render(state).
  function build(link) {
    const id = `brand-mark-${uid++}`;
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = `${WEIGHT} 1000px Geist`;
    const cap = ctx.measureText('H').actualBoundingBoxAscent / 1000;
    const perEm = (s) => ctx.measureText(s).width / 1000 + TRACK * s.length;
    const atisha = 'atisha', yrill = 'yrill';

    // Sizes in cap heights, then px. One unit of the monogram grid is 1/84 of the cap height.
    const u = 1 / 84, em = 1 / cap;
    const kern = 0.035, space = perEm(' ') * em * 1.05, gapCy = 0.05;
    const Aw = 64 * u, Cw = 42 * u;
    const total = Aw + kern + perEm(atisha) * em + space + Cw + gapCy + perEm(yrill) * em;
    const px = (v) => v * CAP;
    const capTop = 2, base = capTop + CAP;
    // The SVG ends on the baseline, so the link's baseline is the letters' baseline and lines up with
    // the nav's; the descender of the y hangs below it.
    const W = Math.ceil(px(total) + 3), Ht = base;
    const ax = 1;                                              // the A stays put; the C travels
    const cx0 = ax + px(62 * u), cx1 = ax + px(Aw + kern + perEm(atisha) * em + space);
    const closedW = Math.ceil(ax + px(104 * u) + 1);

    const svg = el('svg', { viewBox: `0 0 ${W} ${Ht}`, width: W, height: Ht, 'aria-hidden': 'true', focusable: 'false' });
    const defs = el('defs', {}, svg);
    el('rect', { x: -4, y: -4, width: W + 8, height: base + 4.25 }, el('clipPath', { id: `${id}-a` }, defs));
    const clipL = el('path', { 'clip-rule': 'evenodd' }, el('clipPath', { id: `${id}-l` }, defs));
    const clipR = el('rect', { y: -4, height: Ht + CAP, width: W + 8 }, el('clipPath', { id: `${id}-r` }, defs));

    // The A, at Geist Medium's weight: 13-unit legs (a 12.5-unit stroke across the slant), an 11.7-unit bar.
    const aG = el('g', { fill: 'currentColor' }, el('g', { 'clip-path': `url(#${id}-a)` }, svg));
    el('polygon', { points: '0,92 25,8 38,8 13,92' }, aG);
    el('polygon', { points: '51,92 26,8 39,8 64,92' }, aG);
    el('rect', { x: 14.5, y: 57, width: 35, height: 11.7 }, aG);

    const text = (s, parent) => [...s].map((ch) => {
      const t = el('text', { 'font-family': 'Geist', 'font-weight': WEIGHT, 'font-size': px(em), fill: 'currentColor' }, parent);
      t.textContent = ch;
      return t;
    });
    const left = text(atisha, el('g', { 'clip-path': `url(#${id}-l)` }, svg));
    const yG = el('g', { 'clip-path': `url(#${id}-r)` }, svg);
    const right = text(yrill, yG);
    const offset = (s) => [...s].map((_, i) => px(perEm(s.slice(0, i)) * em));
    const offL = offset(atisha), offR = offset(yrill);
    const wL = [...atisha].map((c) => px(perEm(c) * em));
    const wYrill = px(perEm(yrill) * em), pxSpace = px(space);

    const h = (SPAN / 2) * Math.PI / 180;
    const bands = BANDS.map((color, i) => {
      const r = 42 - BAND / 2 - i * BAND;
      const g = el('g', {}, svg);
      const d = `M${104 + r * Math.cos(Math.PI + h)} ${50 + r * Math.sin(Math.PI + h)}A${r} ${r} 0 0 0 ${104 + r * Math.cos(Math.PI - h)} ${50 + r * Math.sin(Math.PI - h)}`;
      const len = r * SPAN * Math.PI / 180;
      const p = el('path', { d, fill: 'none', stroke: color, 'stroke-width': BAND - GAP * BAND / 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${len} ${len}` }, g);
      return { g, p, len };
    });
    link.prepend(svg);

    const place = (k) => {
      const push = Math.min(k, 0) * (cx1 - cx0) * 0.6;       // past 0, the C nudges the A along with it
      return { a: ax + push, c: lerp(cx0, cx1, Math.max(k, 0)) + push };
    };
    const s = CAP / 84;

    // state: open(lag) = openness `lag` seconds ago; k = how far "yrill" is out; drawn(i) = band i drawn
    // in, 0–1; rise = how far the A is still below its baseline, in cap heights.
    return function render({ open, k, drawn, rise }) {
      const now = open(0);
      const { a, c } = place(now);
      aG.setAttribute('transform', `translate(${a} ${capTop + rise * CAP}) scale(${s}) translate(0 -8)`);

      bands.forEach(({ g, p, len }, i) => {
        const cx = place(open(i * 0.0025)).c;                    // each band trails the one outside it, a hair
        g.setAttribute('transform', `translate(${cx} ${capTop}) scale(${s}) translate(42 42) scale(${C_SCALE}) translate(-104 -50)`);
        const dr = drawn(i);
        p.setAttribute('stroke-dashoffset', len * (1 - dr));
        p.setAttribute('visibility', dr > 0 ? 'visible' : 'hidden');
      });

      // "atisha" hides behind the C (left of its centre line, minus its disc) and below the baseline.
      // Each letter rises and comes up from transparent as the C uncovers it, the way the hero's lines
      // drift and fade in, so nothing pops.
      const x0 = a + px(Aw) * 0.5, mid = c + px(42 * u), R = px(43 * C_SCALE * u), yMid = capTop + CAP / 2;
      clipL.setAttribute('d', mid <= x0 ? 'M0 0Z'
        : `M${x0} -4H${mid}V${base + 0.25}H${x0}Z M${mid} ${yMid - R}A${R} ${R} 0 0 0 ${mid} ${yMid + R}Z`);
      left.forEach((node, i) => {
        const x = a + px(Aw + kern) + offL[i];
        const shown = easeOutCubic(clamp((c - x - wL[i] * 0.5) / (wL[i] * 0.5 + pxSpace * 0.8)));
        node.setAttribute('x', x);
        node.setAttribute('y', base + (1 - shown) * 1.05 * CAP);
        node.setAttribute('opacity', clamp(shown * 1.6).toFixed(3));
      });

      // "yrill" slides out of the C's open side as one word, fading up as it comes.
      clipR.setAttribute('x', mid);
      yG.setAttribute('opacity', clamp(k * 1.8).toFixed(3));
      right.forEach((node, j) => {
        const spread = 0.9 + 0.1 * clamp(k, 0, 1.1);
        node.setAttribute('x', mid + px(gapCy) + offR[j] * spread - (1 - k) * (wYrill + px(gapCy) + px(6 * u)));
        node.setAttribute('y', base);
      });

      link.style.width = `${Math.round(lerp(closedW, W, clamp(now)))}px`;
    };
  }

  // On the home page's first visit the headline rises in once the polaroids have swept past. Calls
  // cb(true) as it starts to show, or cb(false) straight away if this page has no such entrance.
  function whenHeadlineShows(cb) {
    const win = document.querySelector('.hero__window.is-waiting');
    const title = win && win.querySelector('.hero__title');
    if (!title) { cb(false); return; }
    let done = false;
    const shown = () => title.classList.contains('is-shown') || win.classList.contains('is-revealed');
    const fire = () => { if (!done) { done = true; mo.disconnect(); cb(true); } };
    const mo = new MutationObserver(() => { if (shown()) fire(); });
    mo.observe(title, { attributes: true, attributeFilter: ['class'] });
    mo.observe(win, { attributes: true, attributeFilter: ['class'] });
    if (shown()) fire();
    setTimeout(fire, 9000);                                     // never wait forever
  }

  // Drives one mark: the intro on a timeline, then springs that follow hover and focus.
  function animate(link, render, playIntro) {
    const ON = { p: [6.2, 0.8], k: [8.5, 0.85] };               // opening: a breath of overshoot
    const OFF = { p: [5.5, 0.85], k: [16, 1] };                 // folding: "yrill" ducks in fast
    let introAt = null, T = WAITING, live = !playIntro;
    let p = 0, pv = 0, k = 0, kv = 0, wantOpen = false, changedAt = 0, lean = false, last = 0, raf = 0;
    const history = [];                                          // recent openness, for the band lag

    const introTime = (t) => (introAt === null ? -1 : t - introAt);
    const stepSpring = (x, v, target, [w, z], dt) => {
      const a = w * w * (target - x) - 2 * z * w * v;
      v += a * dt;
      return [x + v * dt, v];
    };
    const sampleOpen = (t, lag) => {
      const at = t - lag;
      for (let i = history.length - 1; i >= 0; i--) if (history[i][0] <= at) return history[i][1];
      return history.length ? history[0][1] : p;
    };

    function frame(ms) {
      const t = ms / 1000, dt = Math.min(1 / 30, last ? t - last : 1 / 60);
      last = t;
      const ti = introTime(t);
      let open, settled;
      if (!live && ti < T.end) {
        p = introOpen(ti, T); k = introMouth(ti, T);
        open = (lag) => introOpen(ti - lag, T);
        settled = T === WAITING && ti > DRAWN;                   // drawn, waiting for its cue: rest
      } else {
        if (!live) { live = true; p = 0; pv = 0; k = 0; kv = 0; }
        const since = t - changedAt;
        const pTarget = wantOpen ? 1 : (lean && since < 0.12 ? 1.03 : 0);   // a small lean before folding
        const kTarget = wantOpen && (since > 0.13 || k > 0.05) ? 1 : 0;      // "yrill" follows the C out
        for (let i = 0; i < 4; i++) {
          [p, pv] = stepSpring(p, pv, pTarget, wantOpen ? ON.p : OFF.p, dt / 4);
          [k, kv] = stepSpring(k, kv, kTarget, wantOpen ? ON.k : OFF.k, dt / 4);
        }
        history.push([t, p]);
        while (history.length > 2 && history[0][0] < t - 0.1) history.shift();
        open = (lag) => (lag ? sampleOpen(t, lag) : p);
        settled = Math.abs(p - pTarget) < 5e-4 && Math.abs(pv) < 1e-3 && Math.abs(k - kTarget) < 5e-4
          && Math.abs(kv) < 1e-3 && (pTarget === 0 || pTarget === 1) && (introAt === null || ti > DRAWN);
      }
      render({
        open, k,
        drawn: (i) => (introAt === null ? (playIntro ? 0 : 1) : easeOutCubic(clamp((ti - DRAW.bands - i * DRAW.step) / DRAW.dur))),
        rise: introAt === null ? (playIntro ? 1.08 : 0) : (1 - easeOutQuint(clamp(ti / 0.6))) * 1.08,
      });
      raf = settled ? 0 : requestAnimationFrame(frame);
    }
    const wake = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };

    const set = (open) => {
      if (open === wantOpen && live) return;
      const t = performance.now() / 1000, ti = introTime(t);
      if (!live) {
        // Take over from the intro mid-flight, keeping its position and speed.
        live = true;
        p = introOpen(ti, T); pv = (p - introOpen(ti - 1 / 120, T)) * 120;
        k = introMouth(ti, T); kv = (k - introMouth(ti - 1 / 120, T)) * 120;
      }
      lean = !open && p > 0.85;
      wantOpen = open; changedAt = t;
      wake();
    };
    link.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') set(true); });
    link.addEventListener('pointerleave', () => set(false));
    link.addEventListener('focus', () => { if (link.matches(':focus-visible')) set(true); });
    link.addEventListener('blur', () => set(false));

    render({ open: () => 0, k: 0, drawn: () => (playIntro ? 0 : 1), rise: playIntro ? 1.08 : 0 });
    if (!playIntro) return;
    const start = () => {
      introAt = performance.now() / 1000 + 0.35;
      wake();
      // Open with the headline if one is on its way in, else on the beat after the rainbow is drawn.
      whenHeadlineShows((cued) => {
        const ti = introTime(performance.now() / 1000);
        T = after(cued ? Math.max(ti + 0.15, DRAWN + 0.2) : EXPAND);
        wake();
      });
    };
    if (document.visibilityState === 'visible') start();
    else document.addEventListener('visibilitychange', start, { once: true });
  }

  // Reduced motion: no intro and no movement; hover or focus simply shows the full name.
  function still(link, render) {
    const show = (open) => render({ open: () => (open ? 1 : 0), k: open ? 1 : 0, drawn: () => 1, rise: 0 });
    link.addEventListener('pointerenter', () => show(true));
    link.addEventListener('pointerleave', () => show(false));
    link.addEventListener('focus', () => show(true));
    link.addEventListener('blur', () => show(false));
    show(false);
  }

  // Swap the visible text for the mark right away (keeping it for screen readers), then draw once
  // Geist has loaded, since the letters are measured from it.
  links.forEach((link) => {
    const label = document.createElement('span');
    label.className = 'visually-hidden';
    label.textContent = link.textContent.trim();
    link.textContent = '';
    link.append(label);
    link.classList.add('brand--mark');
  });

  let playIntro = false;
  if (!reduceMotion) {
    try { playIntro = !sessionStorage.getItem(SEEN); sessionStorage.setItem(SEEN, '1'); } catch { playIntro = false; }
  }

  document.fonts.load(`${WEIGHT} ${CAP * 2}px Geist`).catch(() => {}).then(() => {
    links.forEach((link, i) => {
      const render = build(link);
      if (reduceMotion) still(link, render);
      else animate(link, render, playIntro && i === 0);
    });
  });
})();

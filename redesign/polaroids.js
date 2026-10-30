// Polaroid intro. Plays once, slowly, before the text appears:
//   1. A ring of polaroids (each photo plus a decorative twin) is there from the first frame, lying
//      flat like a carousel band seen edge-on, and starts turning gently.
//   2. The ring tips up to face the viewer, still turning.
//   3. The ring speeds up and releases the twins (which sit together on one half of it) one by one
//      as each reaches a point on its lower right; each carries straight on up and out of the window
//      at the ring's speed. Then the photos glide out of the ring into small overlapping clusters
//      under the text, and the title and intro rise in.
//   4. Everything rests. The photos can then be peeled off and dragged around; a click shakes one,
//      and a shell falls out of it onto the shore along the bottom of the window.
// With reduced motion the photos start in their clusters and the text is shown straight away.
(() => {
  const strip = document.querySelector('.stickers');
  const win = strip && strip.closest('.hero__window');
  if (!win) return;

  const copy = win.querySelector('.hero__copy');
  const intro = win.querySelector('.hero__intro');
  // The text lines, in reading order; each rises in on its own once its space is clear.
  const lines = [win.querySelector('.hero__title'), ...intro.children];
  const narrow = window.matchMedia('(max-width: 760px)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // The ring wants more cards than there are photos, so each photo gets a decorative twin.
  const originals = [...strip.querySelectorAll('.sticker')];
  originals.forEach((el) => {
    const twin = el.cloneNode(true);
    twin.classList.add('sticker--twin');
    twin.setAttribute('aria-hidden', 'true');
    twin.tabIndex = -1;
    strip.append(twin);
  });
  const all = [...strip.querySelectorAll('.sticker')];
  const N = all.length;
  const n = originals.length;

  strip.classList.add('stickers--motion');

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const lerp = (a, b, p) => a + (b - a) * p;
  const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);

  // ---------- Geometry (window px) ----------
  let W = 0;
  let H = 0;
  let cardW = 0;
  let cardH = 0;
  let textW = 0;
  let textBottom = 0;
  let lineBoxes = []; // each text line's box in window px: { l, r, t, b }

  const measure = () => {
    W = strip.clientWidth;
    H = strip.clientHeight;
    cardW = originals[0].offsetWidth;
    cardH = originals[0].offsetHeight;
    textW = intro.offsetWidth;
    textBottom = copy.offsetTop - strip.offsetTop + copy.offsetHeight;
    const s = strip.getBoundingClientRect();
    // Measure the text itself rather than its (full-width) block.
    const range = document.createRange();
    lineBoxes = lines.map((el) => {
      range.selectNodeContents(el);
      const r = range.getBoundingClientRect();
      return { l: r.left - s.left, r: r.right - s.left, t: r.top - s.top, b: r.bottom - s.top };
    });
  };

  const draw = (el, st) => {
    el.style.transform = `translate3d(${st.x - cardW / 2}px, ${st.y - cardH / 2}px, ${st.z || 0}px) rotateY(${st.ry || 0}deg) rotateZ(${st.rz}deg) scale(${st.s})`;
    el.style.opacity = st.o.toFixed(3);
    el.style.setProperty('--z', String(st.layer || 1));
  };

  // ---------- Resting layout ----------
  // Small overlapping clusters under the text, in the order the photos appear in the HTML.
  // x: share of the window width from its centre; y: card heights below the text; z: stacking.
  const CLUSTERS = [
    { x: 0.2, y: 0.95, r: 1.5, z: 1 },    // sunset chaser
    { x: 0.023, y: 0.88, r: -1, z: 1 },   // paddle season
    { x: -0.167, y: 0.92, r: 2, z: 1 },   // cliffside views
    { x: -0.26, y: 1.04, r: -2, z: 2 },   // lone sail
    { x: -0.2, y: 1.17, r: 1, z: 3 },     // lakeside gold
    { x: 0.205, y: -0.15, r: 2, z: 1 },   // palm tree therapy, beside the text
    { x: 0.166, y: 1.19, r: -1.5, z: 3 }, // palm springs
    { x: 0.258, y: 1.08, r: 2, z: 2 },    // salt water
  ];
  const PHONE_COLUMNS = [-0.36, -0.12, 0.12, 0.36];

  const offsets = originals.map(() => ({ x: 0, y: 0 })); // where the visitor has dragged each photo
  let raised = 10;

  const restAt = (i) => {
    let x;
    let y;
    let s;
    let rz;
    let z;
    if (narrow.matches) {
      s = clamp((W * 0.21) / cardW, 0.45, 0.8);
      x = W / 2 + PHONE_COLUMNS[i % 4] * W;
      y = textBottom + cardH * s * (0.75 + Math.floor(i / 4) * 1.08);
      rz = i % 2 ? 3 : -3;
      z = 1;
    } else {
      const c = CLUSTERS[i];
      s = clamp((W * 0.0787) / cardW, 0.6, 1.05);
      x = c.x * W;
      // A card that sits beside the text keeps clear of it.
      if (c.y < 0.5) x = Math.sign(x) * Math.max(Math.abs(x), textW / 2 + 20 + (cardW * s) / 2);
      x += W / 2;
      y = textBottom + c.y * cardH * s;
      rz = c.r;
      z = c.z;
    }
    return { x: x + offsets[i].x, y: y + offsets[i].y, z: 0, ry: 0, rz, s, o: 1, layer: offsets[i].layer || z };
  };

  // ---------- Opening motion ----------
  // Timeline in seconds. Long, overlapping, eased phases keep it calm rather than snappy.
  const TILT_START = 1.2;       // the ring tips up to face the viewer
  const TILT_END = 3.6;
  const SPIN_SPEED = 0.3;       // radians per second while the ring tips up
  const EXIT_SPEED = 1.4;       // the ring speeds up to this as it releases the twins
  const SPEEDUP_START = 3.2;
  const SPEEDUP_TIME = 1.2;
  const GATE = Math.PI / 5;     // ring angle (lower right) where twins let go, heading up-right below the nav
  const EXIT_START = 4.2;       // the leading twin reaches the gate
  const EXIT_ACCEL = 600;       // px/s² a released twin gathers on its way out
  const SETTLE_TIME = 1.8;
  const SETTLE_STAGGER = 0.08;

  const smooth = (p) => {
    const u = clamp(p, 0, 1);
    return u * u * (3 - 2 * u);
  };

  // Ring speed eases in from rest, then eases up again for the release.
  const speedAt = (time) =>
    SPIN_SPEED * smooth(time) + (EXIT_SPEED - SPIN_SPEED) * smooth((time - SPEEDUP_START) / SPEEDUP_TIME);

  // Spin angle is the integral of the speed; tabulated once so it can also be inverted.
  const STEP = 1 / 240;
  const spinTable = [0];
  for (let i = 1; i <= 240 * 20; i += 1) spinTable[i] = spinTable[i - 1] + speedAt((i - 0.5) * STEP) * STEP;

  const spinAngle = (time) => {
    const f = clamp(time / STEP, 0, spinTable.length - 1);
    const i = Math.floor(f);
    return lerp(spinTable[i], spinTable[Math.min(i + 1, spinTable.length - 1)], f - i);
  };

  const timeAtSpin = (angle) => {
    let lo = 0;
    let hi = spinTable.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (spinTable[mid] < angle) lo = mid; else hi = mid;
    }
    return hi * STEP;
  };

  // Cards sit evenly round the ring: photos on one half, their twins on the other. The ring's
  // phase is set so the leading twin is just short of the gate when the release begins.
  const baseAngle = (k) => ((k - (N - 1) / 2) / N) * Math.PI * 2;
  const PHASE = GATE - 0.12 - baseAngle(N - 1) - spinAngle(EXIT_START);
  const thetaAt = (k, time) => baseAngle(k) + PHASE + spinAngle(time);

  // When each twin reaches the gate and lets go. Twins pass it in ring order, one after another.
  const releaseAt = all.map((_, k) => {
    if (k < n) return Infinity;
    const need = GATE - thetaAt(k, EXIT_START);
    return timeAtSpin(spinAngle(EXIT_START) + (((need % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)));
  });
  const LAST_RELEASE = Math.max(...releaseAt.slice(n));

  // The photos head for their clusters as the last twin lets go; the text follows once they've landed.
  const SETTLE = LAST_RELEASE - 0.5;
  const END = Math.max(SETTLE + SETTLE_TIME + SETTLE_STAGGER * n, LAST_RELEASE + 1.6) + 0.1;

  // Photos settle left to right.
  const settleOrder = [];
  CLUSTERS.map((c, i) => ({ i, x: c.x })).sort((a, b) => a.x - b.x).forEach((c, k) => { settleOrder[c.i] = k; });

  const ringRadius = () => (narrow.matches ? Math.min(W * 0.36, H * 0.25) : Math.min(H * 0.33, W * 0.3));
  const ringCentreY = () => H * 0.53;
  const ringScale = () => clamp((((Math.PI * 2 * ringRadius()) / N) * 0.62) / cardW, 0.3, 0.75);

  // Card k on the ring, in window px plus depth (z, toward the viewer) and its own turn.
  // The ring starts lying flat (a carousel band seen edge-on, cards facing outward) and tips up about
  // the horizontal axis as tilt goes 0..1, while each card turns from facing outward to facing front.
  const ringState = (k, time) => {
    const R = ringRadius();
    const tilt = ease(clamp((time - TILT_START) / (TILT_END - TILT_START), 0, 1));
    const theta = thetaAt(k, time);
    const depth = R * Math.cos(theta); // relative to the ring's centre
    const phi = (tilt * Math.PI) / 2;
    return {
      x: W / 2 + R * Math.sin(theta),
      y: ringCentreY() + depth * Math.sin(phi),
      z: depth * Math.cos(phi) - R * (1 - tilt),
      ry: (theta * 180) / Math.PI * (1 - tilt),
      rz: tilt * Math.sin(2 * theta) * 12,
      s: ringScale(),
    };
  };

  // A released twin: leaves the gate along the ring's direction of travel at the ring's speed,
  // then keeps accelerating out of the window, turning a little as it goes.
  const releasedState = (k, time) => {
    const R = ringRadius();
    const since = time - releaseAt[k];
    const travel = R * speedAt(releaseAt[k]) * since + 0.5 * EXIT_ACCEL * since * since;
    return {
      x: W / 2 + R * Math.sin(GATE) + Math.cos(GATE) * travel,
      y: ringCentreY() + R * Math.cos(GATE) - Math.sin(GATE) * travel,
      z: 0,
      ry: 0,
      rz: Math.sin(2 * GATE) * 12 + since * 35,
      s: ringScale(),
    };
  };

  // ---------- Frame loop ----------
  let mode = reduceMotion.matches ? 'rest' : 'intro';
  let t = 0;
  let revealed = false;
  let frame = 0;
  let last = 0;

  const reveal = () => {
    if (revealed) return;
    revealed = true;
    win.classList.remove('is-waiting');
    win.classList.add('is-revealed');
  };

  const renderRest = () => {
    originals.forEach((el, i) => draw(el, restAt(i)));
    all.slice(n).forEach((el) => { el.style.visibility = 'hidden'; });
  };

  // Where card k is at a given moment of the intro.
  const stateAt = (k, time) => {
    let st;
    if (k < n) {
      // Photos glide out of the ring to their spot in the clusters.
      st = ringState(k, time);
      const p = ease(clamp((time - SETTLE - settleOrder[k] * SETTLE_STAGGER) / SETTLE_TIME, 0, 1));
      const rest = restAt(k);
      st.x = lerp(st.x, rest.x, p);
      st.y = lerp(st.y, rest.y, p);
      st.z = lerp(st.z, 0, p);
      st.ry = lerp(st.ry, 0, p);
      st.rz = lerp(st.rz, rest.rz, p);
      st.s = lerp(st.s, rest.s, p);
      st.layer = p > 0.5 ? rest.layer : Math.round(500 + st.z);
    } else if (time < releaseAt[k]) {
      st = ringState(k, time);
      st.layer = Math.round(500 + st.z);
    } else {
      st = releasedState(k, time);
      st.layer = 700;
    }
    st.o = 1;
    return st;
  };

  const renderIntro = () => {
    all.forEach((el, k) => draw(el, stateAt(k, t)));
  };

  // ---------- Progressive text ----------
  // A text line may rise in once no card touches its box from now until the end of the intro, so a
  // line never appears only to have a card pass over it. Lines still arrive in reading order.
  const LINE_MARGIN = 10;
  const LOOK_STEP = 0.1;
  const LINE_GAP = 0.35; // at least this long between one line and the next, so lines cascade
  let shownLines = 0;
  let lastLineAt = -Infinity;

  const touches = (box, st) => {
    const hw = (cardW * st.s) / 2 + LINE_MARGIN;
    const hh = (cardH * st.s) / 2 + LINE_MARGIN;
    return st.x + hw > box.l && st.x - hw < box.r && st.y + hh > box.t && st.y - hh < box.b;
  };

  const clearFromNow = (box) => {
    for (let time = t; time <= END; time += LOOK_STEP) {
      for (let k = 0; k < N; k += 1) {
        if (touches(box, stateAt(k, time))) return false;
      }
    }
    return true;
  };

  const showNextLine = () => {
    if (shownLines >= lines.length || t - lastLineAt < LINE_GAP) return;
    if (!clearFromNow(lineBoxes[shownLines])) return;
    lines[shownLines].classList.add('is-shown');
    shownLines += 1;
    lastLineAt = t;
    if (shownLines === lines.length) reveal();
  };

  const tick = (now) => {
    t += Math.min((now - last) / 1000, 0.05);
    last = now;
    showNextLine();
    if (t >= END) {
      reveal();
      mode = 'rest';
      renderRest();
      frame = 0;
      return;
    }
    renderIntro();
    frame = requestAnimationFrame(tick);
  };

  const run = () => {
    if (frame || mode !== 'intro' || document.hidden) return;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  };

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else run();
  });

  measure();
  new ResizeObserver(() => {
    measure();
    if (mode === 'rest') renderRest();
  }).observe(win);

  if (mode === 'rest') {
    renderRest();
  } else {
    win.classList.add('is-waiting');
    renderIntro();
    run();
    // Never leave the text or photos hidden, even if the intro can't play (e.g. a background tab):
    // if it hasn't got going after a few seconds, show the resting layout instead; and whatever
    // happens, show the text shortly after the intro should have finished.
    setTimeout(() => {
      if (mode === 'intro' && t < 0.5) {
        mode = 'rest';
        cancelAnimationFrame(frame);
        frame = 0;
        renderRest();
        reveal();
      }
    }, 3000);
    setTimeout(reveal, (END + 2) * 1000);
  }

  // ---------- Peel and drag (once at rest) ----------
  const DRAG_START = 4;
  const EDGE = 8;

  const play = (el, className) => {
    el.classList.remove(className);
    void el.offsetWidth; // restart the animation if it's already running
    el.classList.add(className);
    el.addEventListener('animationend', () => el.classList.remove(className), { once: true });
  };

  // Moves photo i by (dx, dy) from where it was, keeping it inside the window.
  const moveBy = (i, from, dx, dy) => {
    const base = restAt(i);
    const half = { w: (cardW * base.s) / 2, h: (cardH * base.s) / 2 };
    const restX = base.x - offsets[i].x;
    const restY = base.y - offsets[i].y;
    offsets[i].x = clamp(restX + from.x + dx, half.w + EDGE, W - half.w - EDGE) - restX;
    offsets[i].y = clamp(restY + from.y + dy, half.h + EDGE, H - half.h - EDGE) - restY;
    draw(originals[i], restAt(i));
  };

  const raise = (i) => {
    raised += 1;
    offsets[i].layer = raised;
  };

  // ---------- Shells ----------
  // Every shake of a photo drops a shell out of it. The shell tumbles down and comes to rest along
  // the bottom of the window, piling up with the others, like shells collected on the shore.
  // Each shell is drawn in a 48-unit box, styled on real shore finds: banded and rayed scallops,
  // pearly turban and nautilus shells, starfish, conchs, sand dollars and the odd pearl oyster.
  // `looks` are the colourings each one comes in (the `shiny` ones are mother-of-pearl, with a soft
  // rainbow film). `rest` is how it lies once landed (angles in
  // deg, or null for round ones, which roll and lie any way up), `foot` how far its lowest point then
  // sits below its centre, and `r` the radius it takes up when it bumps into other shells, in box units.
  const f = (v) => v.toFixed(1);
  const pt = (p) => `${f(p[0])} ${f(p[1])}`;
  const polar = (cx, cy, r, a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  const stops = (list) => list.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('');
  const NACRE = [[0, '#ffd3e6', 0.5], [0.28, '#d5e6ff', 0.42], [0.5, '#d4fbef', 0.32], [0.74, '#fff0c4', 0.42], [1, '#efcfff', 0.5]];
  let shellId = 0;

  // Mother-of-pearl: a soft rainbow film over the shell. `shape(fill)` draws the shell's outline
  // with the given fill.
  const pearly = (u, shape) => `<defs>
      <linearGradient id="${u}n" x1="0" y1="0" x2="1" y2="1">${stops(NACRE)}</linearGradient>
    </defs>${shape(`url(#${u}n)`)}`;

  const SHELLS = {
    // Scallop: a fan of rounded ribs out to a crimped rim, two ears at the hinge, colour in rays
    // along the ribs and bands across them.
    scallop: {
      looks: {
        sunset: { body: [[0, '#f5c6a1'], [0.3, '#fff3e8'], [1, '#ffffff']], ray: [[0, '#f08a4b', 0], [0.3, '#f07d3c', 0.35], [0.55, '#ec6a28', 0.9], [0.8, '#f39257', 0.55], [1, '#f6b48a', 0.1]], line: '#c25f33' },
        lemon: { body: [[0, '#f8e2a6'], [0.4, '#fffaf0'], [1, '#ffffff']], ray: [[0, '#f2b632', 0.2], [0.3, '#f4bf3b', 0.8], [0.6, '#f6cf63', 0.4], [0.85, '#f8dc8a', 0.08], [1, '#fff', 0]], line: '#c4983c' },
        toffee: { body: [[0, '#f7c65c'], [0.18, '#f2ae48'], [0.3, '#fff1da'], [0.4, '#c56b35'], [0.5, '#f1c18b'], [0.6, '#fff4e4'], [0.7, '#b65e2d'], [0.8, '#efb478'], [0.9, '#fff1de'], [1, '#a65226']], ray: [[0, '#fff', 0], [0.5, '#fff', 0.18], [1, '#fff', 0.3]], line: '#8a4522' },
        rose: { body: [[0, '#f0bccb'], [0.45, '#fbecf1'], [1, '#ffffff']], ray: [[0, '#c2577f', 0.25], [0.35, '#c75e88', 0.85], [0.7, '#d67c9e', 0.6], [1, '#e7a5bc', 0.35]], line: '#9b4064' },
        orchid: { body: [[0, '#7b3d9c'], [0.35, '#b25cb7'], [0.7, '#ea8bc3'], [1, '#fbc7de']], ray: [[0, '#fff', 0], [0.5, '#ffd9ee', 0.3], [1, '#fff', 0.5]], line: '#6a2d82', shiny: true },
        seaglass: { body: [[0, '#38b0b6'], [0.3, '#8edbd7'], [0.65, '#e8f7f6'], [1, '#ffffff']], ray: [[0, '#fff', 0], [0.6, '#ffd6ea', 0.25], [1, '#cde6ff', 0.4]], line: '#2a8c93', shiny: true },
        pearl: { body: [[0, '#eee4de'], [0.5, '#fbf8f5'], [1, '#ffffff']], ray: [[0, '#fff', 0], [1, '#efe6ff', 0.3]], line: '#b0a199', shiny: true },
      },
      rest: [0],
      foot: 20,
      r: 19,
      draw: (u, look) => {
        // Ribs run from the hinge out to a rounded, crimped rim (a circle sitting above the hinge).
        const hx = 24, hy = 44, ox = 24, oy = 23, R = 19, ribs = 15, span = 2.25;
        const at = (k) => -span + (2 * span * k) / ribs;
        const rim = (a, r = R) => polar(ox, oy, r, a);
        const along = (a, t, r = R) => { const [x, y] = rim(a, r); return [hx + (x - hx) * t, hy + (y - hy) * t]; };
        let edge = `M${hx} ${hy} L${pt(rim(at(0)))}`;
        let rays = '';
        let grooves = '';
        let lights = '';
        for (let k = 0; k < ribs; k += 1) {
          const a = at(k), b = at(k + 1), mid = (a + b) / 2;
          const bulge = ` Q${pt(rim(mid, R + 3))} ${pt(rim(b))}`;
          edge += bulge;
          if (k % 2 === 0) rays += `M${hx} ${hy} L${pt(rim(a))}${bulge} Z`;
          if (k > 0) grooves += `M${pt(along(a, 0.14))} L${pt(rim(a, R - 0.3))}`;
          lights += `M${pt(along(mid - 0.05, 0.3))} L${pt(along(mid - 0.05, 0.94))}`;
        }
        edge += ' Z';
        const shape = (fill) => `<path d="${edge}" fill="${fill}"/>`;
        return `<defs>
            <radialGradient id="${u}b" gradientUnits="userSpaceOnUse" cx="${hx}" cy="${hy}" r="42">${stops(look.body)}</radialGradient>
            <radialGradient id="${u}r" gradientUnits="userSpaceOnUse" cx="${hx}" cy="${hy}" r="42">${stops(look.ray)}</radialGradient>
            <linearGradient id="${u}s" x1="0" y1="0" x2="1" y2="1">${stops([[0, look.line, 0], [0.5, look.line, 0], [1, look.line, 0.22]])}</linearGradient>
          </defs>
          <path d="M${hx} ${hy} L${hx - 10.5} ${hy - 0.4} L${hx - 9.5} ${hy - 7} L${hx - 3} ${hy - 8.5} Z M${hx} ${hy} L${hx + 10.5} ${hy - 0.4} L${hx + 9.5} ${hy - 7} L${hx + 3} ${hy - 8.5} Z"
            fill="url(#${u}b)" stroke="${look.line}" stroke-opacity=".45" stroke-width=".7" stroke-linejoin="round"/>
          ${shape(`url(#${u}b)`)}
          <path d="${rays}" fill="url(#${u}r)"/>
          <path d="${grooves}" stroke="${look.line}" stroke-opacity=".5" stroke-width=".75" stroke-linecap="round"/>
          <path d="${lights}" stroke="#fff" stroke-opacity=".22" stroke-width=".9" stroke-linecap="round"/>
          ${look.shiny ? pearly(u, shape) : ''}
          <path d="${edge}" fill="url(#${u}s)" stroke="${look.line}" stroke-opacity=".5" stroke-width=".75" stroke-linejoin="round"/>`;
      },
    },

    // Turban / moon snail, seen from above: one fat, glossy whorl spiralling in to the apex.
    moon: {
      looks: {
        pearl: { l: '#ffffff', m: '#e4daee', d: '#8f83a8', shiny: true },
        opal: { l: '#ffffff', m: '#d4ecef', d: '#6f9aa3', shiny: true },
        sand: { l: '#faf2e6', m: '#e8d2b1', d: '#a9845a' },
        lilac: { l: '#f6f1fb', m: '#d2c3ea', d: '#8a76b1' },
      },
      rest: null,
      foot: 17,
      r: 17.5,
      draw: (u, look) => {
        const cx = 25, cy = 25;
        let suture = '';
        let band = '';
        for (let t = 0; t <= 15.5; t += 0.25) {
          const r = 16.5 * Math.exp(-0.2 * t);
          suture += `${t ? 'L' : 'M'}${f(cx + r * Math.cos(t + 2.4))} ${f(cy + r * Math.sin(t + 2.4) * 0.96)}`;
          const rb = r * 0.8;
          if (t > 1.2) band += `${t > 1.3 ? 'L' : 'M'}${f(cx + rb * Math.cos(t + 2.75))} ${f(cy + rb * Math.sin(t + 2.75) * 0.96)}`;
        }
        const shape = (fill) => `<ellipse cx="${cx - 0.5}" cy="${cy}" rx="18" ry="17.2" fill="${fill}"/>`;
        return `<defs>
            <radialGradient id="${u}b" cx=".36" cy=".32" r=".75">
              ${stops([[0, look.l], [0.75, look.m], [1, look.d]])}
            </radialGradient>
          </defs>
          ${shape(`url(#${u}b)`)}
          <path d="${band}" fill="none" stroke="${look.d}" stroke-opacity=".2" stroke-width="2.8" stroke-linecap="round"/>
          <path d="${suture}" fill="none" stroke="${look.d}" stroke-opacity=".7" stroke-width="1" stroke-linecap="round"/>
          ${look.shiny ? pearly(u, shape) : ''}
          <circle cx="${cx}" cy="${cy}" r="2.4" fill="${look.d}"/>
          <ellipse cx="${cx - 0.5}" cy="${cy}" rx="18" ry="17.2" fill="none" stroke="${look.d}" stroke-opacity=".45" stroke-width=".8"/>`;
      },
    },

    // Nautilus: a smooth logarithmic spiral (each turn three times wider than the last), fine growth
    // lines sweeping out from the centre, and the dark mouth of the shell at the end.
    nautilus: {
      looks: {
        pearl: { l: '#fffaf6', m: '#eadfe5', d: '#8c7d92', shiny: true },
        lagoon: { l: '#d3f6ef', m: '#4bb8ac', d: '#1b6a68', shiny: true },
      },
      rest: [0],
      foot: 20,
      r: 19.5,
      draw: (u, look) => {
        const k = Math.log(3) / (2 * Math.PI);
        const turn = (3 * Math.PI) / 4; // the mouth faces down and to the left
        const r = (t) => Math.exp(k * (t - 2 * Math.PI)); // 1 at the mouth
        const raw = (t, rr) => [rr * Math.cos(t + turn), rr * Math.sin(t + turn)];
        // Scale the spiral to fill the box.
        const ring = [];
        for (let t = 0; t <= 2 * Math.PI; t += 0.05) ring.push(raw(t, r(t)));
        const xs = ring.map((p) => p[0]);
        const ys = ring.map((p) => p[1]);
        const s = 42 / Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
        const cx = 24 - (s * (Math.max(...xs) + Math.min(...xs))) / 2;
        const cy = 24 - (s * (Math.max(...ys) + Math.min(...ys))) / 2;
        const at = (t, rr = r(t)) => { const [x, y] = raw(t, rr); return [cx + s * x, cy + s * y]; };
        let edge = `M${pt(at(0))}`;
        for (let t = 0.1; t <= 2 * Math.PI + 0.001; t += 0.1) edge += ` L${pt(at(t))}`;
        edge += ` Q${pt(at(-0.3, (1 + r(0)) * 0.56))} ${pt(at(0))} Z`;
        let lines = '';
        for (let t = 0.5; t < 2 * Math.PI - 0.2; t += 0.32) {
          const out = at(t);
          const mid = at(t - 0.32, r(t) * 0.55);
          lines += `M${pt(at(t - 0.5, 2.6 / s))} Q${pt(mid)} ${pt(out)}`;
        }
        let eye = '';
        for (let t = 0; t <= 9; t += 0.25) eye += `${t ? 'L' : 'M'}${pt(at(t, (3.6 / s) * Math.exp(-0.28 * t)))}`;
        const mouth = at(0, (1 + r(0)) / 2);
        const shape = (fill) => `<path d="${edge}" fill="${fill}"/>`;
        return `<defs>
            <radialGradient id="${u}b" gradientUnits="userSpaceOnUse" cx="${f(cx + 4)}" cy="${f(cy - 6)}" r="30">
              ${stops([[0, look.l], [0.75, look.m], [1, look.d]])}
            </radialGradient>
            <radialGradient id="${u}m" gradientUnits="userSpaceOnUse" cx="${f(mouth[0])}" cy="${f(mouth[1])}" r="13">
              ${stops([[0, look.d, 0.75], [0.6, look.d, 0.25], [1, look.d, 0]])}
            </radialGradient>
            <clipPath id="${u}c"><path d="${edge}"/></clipPath>
          </defs>
          ${shape(`url(#${u}b)`)}
          <g clip-path="url(#${u}c)">
            <path d="${lines}" fill="none" stroke="${look.d}" stroke-opacity=".16" stroke-width=".7"/>
            <circle cx="${f(mouth[0])}" cy="${f(mouth[1])}" r="13" fill="url(#${u}m)"/>
          </g>
          ${look.shiny ? pearly(u, shape) : ''}
          <path d="${eye}" fill="none" stroke="${look.d}" stroke-opacity=".7" stroke-width=".9" stroke-linecap="round"/>
          <circle cx="${f(cx)}" cy="${f(cy)}" r="1.1" fill="${look.d}"/>
          <path d="${edge}" fill="none" stroke="${look.d}" stroke-opacity=".45" stroke-width=".75" stroke-linejoin="round"/>`;
      },
    },

    // Starfish: five plump arms, a row of knobbly bumps down each and a dusting of tiny spots, in
    // soft, sun-faded colours.
    starfish: {
      looks: {
        peach: { l: '#f8dcc6', m: '#ecbb9b', d: '#bf8d6d', bump: '#fcefe4' },
        blush: { l: '#f5d3cf', m: '#e3aba5', d: '#b07c78', bump: '#fbebe8' },
        sand: { l: '#f3e6cf', m: '#e0caa5', d: '#ab9070', bump: '#fbf4e6' },
        seafoam: { l: '#d8ece5', m: '#a9d0c3', d: '#729f93', bump: '#eef8f4' },
      },
      rest: [0, 72, 144, 216, 288], // stands on two arms, whichever way it lands
      foot: 18,
      r: 17.5,
      draw: (u, look) => {
        const cx = 24, cy = 25, tip = 21, valley = 8.4;
        const arm = (k) => (k * 2 * Math.PI) / 5;
        let edge = `M${pt(polar(cx, cy, valley, arm(0) - Math.PI / 5))}`;
        let bumps = '';
        let spots = '';
        for (let k = 0; k < 5; k += 1) {
          const a = arm(k);
          edge += ` Q${pt(polar(cx, cy, 13, a - 0.24))} ${pt(polar(cx, cy, tip, a - 0.07))}`
            + ` A1.5 1.5 0 0 1 ${pt(polar(cx, cy, tip, a + 0.07))}`
            + ` Q${pt(polar(cx, cy, 13, a + 0.24))} ${pt(polar(cx, cy, valley, a + Math.PI / 5))}`;
          [[4.5, 1.7], [8, 1.5], [11.4, 1.3], [14.6, 1.05], [17.4, 0.8]].forEach(([d, s]) => {
            const [x, y] = polar(cx, cy, d, a);
            bumps += `<circle cx="${f(x)}" cy="${f(y)}" r="${s}"/>`;
            [-1, 1].forEach((side) => {
              const [sx, sy] = polar(cx, cy, d + 0.9, a + side * (2.6 / (d + 3)));
              spots += `<circle cx="${f(sx)}" cy="${f(sy)}" r="${f(s * 0.42)}"/>`;
            });
          });
        }
        return `<defs>
            <radialGradient id="${u}b" gradientUnits="userSpaceOnUse" cx="${cx - 2}" cy="${cy - 3}" r="23">
              ${stops([[0, look.l], [0.45, look.m], [1, look.d]])}
            </radialGradient>
          </defs>
          <path d="${edge} Z" fill="url(#${u}b)" stroke="${look.d}" stroke-opacity=".55" stroke-width=".8" stroke-linejoin="round"/>
          <g fill="${look.d}" opacity=".25" transform="translate(.35 .45)">${bumps}</g>
          <g fill="${look.bump}">${bumps}</g>
          <g fill="${look.bump}" opacity=".75">${spots}</g>
          <circle cx="${cx}" cy="${cy}" r="1.6" fill="${look.bump}"/>`;
      },
    },

    // Conch: a knobbed spire and shoulder, a wide flared lip and that warm, glowing opening.
    conch: {
      looks: {
        queen: { l: '#fde4e3', m: '#f3a9b2', d: '#c46c7c', lip: ['#fff4ea', '#ffc79c', '#ff9b5e', '#f0784b'] },
        classic: { l: '#fbf1e4', m: '#ead2b2', d: '#a9835a', lip: ['#fff3ee', '#f9c3b8', '#ee8f88', '#e2766f'] },
        murex: { l: '#f2e3f7', m: '#c99bd8', d: '#7a4b95', lip: ['#fff0f6', '#f7c2dc', '#e88dbb', '#c96aa0'] },
      },
      rest: [0],
      foot: 21,
      r: 19.5,
      draw: (u, look) => `<defs>
            <linearGradient id="${u}b" x1="0" y1="0" x2="1" y2="1">${stops([[0, look.l], [0.55, look.m], [1, look.d]])}</linearGradient>
            <radialGradient id="${u}p" cx=".55" cy=".45" r=".7">${stops([[0, look.lip[2]], [0.35, look.lip[1]], [0.75, look.lip[0]], [1, look.lip[3]]])}</radialGradient>
          </defs>
          <path d="M19.5 2.5 L 21.4 6.6 L 23.4 4.2 L 25.2 9 L 28.2 6 L 30.2 11.6 L 33.6 9.6 L 34 13.2 C 40 14.5, 45 19, 44.5 25 C 44 31, 38.5 35, 33 37 C 30.5 39.5, 28.8 42.5, 27.6 46 C 23.5 42.5, 18.5 38, 15 33 C 11 27.5, 10.5 20.5, 12.5 15.5 C 14.2 10.5, 16.8 6.5, 19.5 2.5 Z"
            fill="url(#${u}b)" stroke="${look.d}" stroke-opacity=".5" stroke-width=".8" stroke-linejoin="round"/>
          <path d="M16.8 6.8 Q 19.2 7.4 21.4 6.6 M14.2 11.6 Q 19 12.8 25.2 9 M12.8 16.4 Q 20 18.4 30.2 11.6 M12 22 Q 17 23.5 24.5 21 M13 28 Q 18 29.5 24.8 28"
            fill="none" stroke="${look.d}" stroke-opacity=".35" stroke-width=".8" stroke-linecap="round"/>
          <path d="M27 14 C 34 14.5, 40.5 18.5, 40.5 24.5 C 40 30, 34 33.5, 30 36 C 28 38, 27.6 41, 27.4 43.5 C 25.2 38.5, 24 31, 24.6 23 C 25 19, 25.8 16, 27 14 Z" fill="url(#${u}p)"/>`,
    },

    // Sand dollar: a sun-bleached disc with its five-petal flower of pores and five little slots.
    sandDollar: {
      looks: {
        bleached: { l: '#fbf7ef', m: '#ebe0cc', d: '#bca988' },
        sand: { l: '#faf2e6', m: '#e8d2b1', d: '#b08a5e' },
      },
      rest: null,
      foot: 18,
      r: 18,
      draw: (u, look) => {
        let petals = '';
        let slots = '';
        for (let k = 0; k < 5; k += 1) {
          const a = (k * 2 * Math.PI) / 5;
          const p = (r, side) => pt(polar(24, 24, r, a + side));
          petals += `M${p(2.6, 0)} Q${p(7.8, 0.42)} ${p(12.2, 0)} Q${p(7.8, -0.42)} ${p(2.6, 0)}`;
          const s = a + Math.PI / 5;
          const [sx, sy] = polar(24, 24, 13.2, s);
          slots += `<ellipse cx="${f(sx)}" cy="${f(sy)}" rx=".9" ry="2.6" transform="rotate(${f((s * 180) / Math.PI)} ${f(sx)} ${f(sy)})" fill="${look.d}" opacity=".3"/>`;
        }
        return `<defs>
            <radialGradient id="${u}b" cx=".4" cy=".36" r=".72">${stops([[0, look.l], [1, look.m]])}</radialGradient>
          </defs>
          <circle cx="24" cy="24" r="18" fill="url(#${u}b)" stroke="${look.d}" stroke-opacity=".45" stroke-width=".8"/>
          <path d="${petals}" fill="${look.m}" fill-opacity=".45" stroke="${look.d}" stroke-opacity=".6" stroke-width="1.15" stroke-dasharray=".01 1.55" stroke-linecap="round"/>
          ${slots}
          <circle cx="24" cy="24" r="1.1" fill="${look.d}" opacity=".5"/>`;
      },
    },

    // Pearl oyster, open: the lid stands up behind showing its pink mother-of-pearl inside, the
    // ruffled bowl sits in front, and three pearls rest where they meet.
    oyster: {
      looks: {
        blush: { l: '#fff3f5', m: '#f4bfcb', d: '#c27689', shiny: true },
        lavender: { l: '#f8f3ff', m: '#d8c3ef', d: '#876cae', shiny: true },
      },
      rest: [0],
      foot: 19,
      r: 19,
      draw: (u, look) => {
        // Half an ellipse with a ruffled edge: the upper half (from) π..2π, or the lower half 0..π.
        const ruffle = (cx, cy, rx, ry, from, depth, waves) => {
          let d = '';
          for (let k = 0; k <= 48; k += 1) {
            const t = from + (k / 48) * Math.PI;
            const w = 1 + depth * Math.sin(waves * t);
            d += `${k ? 'L' : 'M'}${f(cx + rx * w * Math.cos(t))} ${f(cy + ry * w * Math.sin(t))}`;
          }
          return d;
        };
        const lid = `${ruffle(24, 29, 19, 23, Math.PI, 0.045, 14)} Z`;
        const lidInside = `${ruffle(24, 29, 15.5, 19, Math.PI, 0.03, 12)} Z`;
        const bowl = `${ruffle(24, 29, 21, 13.5, 0, 0.05, 14)} Q24 25 ${f(24 - 21 * 1.0)} 29 Z`;
        let ribs = '';
        for (let k = 1; k < 9; k += 1) {
          const a = (k / 9 - 0.5) * 2.6;
          ribs += `M24 29 L${f(24 + 14.5 * Math.sin(a))} ${f(29 - 18 * Math.cos(a))}`;
        }
        const pearl = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${u}q)"/>`;
        const shape = (fill) => `<path d="${lidInside}" fill="${fill}"/>`;
        return `<defs>
            <linearGradient id="${u}o" x1="0" y1="0" x2="0" y2="1">${stops([[0, look.m], [1, look.d]])}</linearGradient>
            <radialGradient id="${u}i" gradientUnits="userSpaceOnUse" cx="24" cy="29" r="20">${stops([[0, look.m], [0.5, look.l], [1, '#fff']])}</radialGradient>
            <radialGradient id="${u}q" cx=".35" cy=".3" r=".75">${stops([[0, '#fbf6f0'], [0.6, '#f3eadf'], [1, '#cdbfb6']])}</radialGradient>
          </defs>
          <path d="${lid}" fill="url(#${u}o)" stroke="${look.d}" stroke-opacity=".5" stroke-width=".8" stroke-linejoin="round"/>
          ${shape(`url(#${u}i)`)}
          ${pearly(u, shape)}
          <path d="${ribs}" stroke="${look.d}" stroke-opacity=".14" stroke-width=".8"/>
          <path d="${bowl}" fill="url(#${u}o)" stroke="${look.d}" stroke-opacity=".5" stroke-width=".8" stroke-linejoin="round"/>
          ${pearl(18.6, 27.4, 4)}${pearl(27.6, 27.8, 3.5)}${pearl(23.4, 24.6, 3)}`;
      },
    },
  };
  // How often each turns up: scallops most of all, and a pearl oyster is the lucky find.
  const SHELL_ODDS = { scallop: 5, moon: 2, nautilus: 2, starfish: 2, conch: 2, sandDollar: 1, oyster: 0.6 };
  const pickShell = () => {
    const kinds = Object.keys(SHELL_ODDS);
    let roll = Math.random() * kinds.reduce((sum, k) => sum + SHELL_ODDS[k], 0);
    return kinds.find((k) => (roll -= SHELL_ODDS[k]) < 0) || kinds[0];
  };
  const pickOne = (list) => list[Math.floor(Math.random() * list.length)];
  const SHELL_SIZE = 44;
  const TO_PX = SHELL_SIZE / 48;
  const SHORE_GAP = 6;      // px above the footer where the shore is
  const GRAVITY = 1800;     // px/s²
  const MAX_SHELLS = 40;
  const SHELL_STEP = 1 / 240; // physics runs in small fixed steps so stacks stay stable
  const SAND_GRIP = 0.5;    // sliding friction on the sand: flat shells stop quickly
  const ROLL_DRAG = 0.06;   // round shells roll on much further
  const SHELL_GRIP = 0.06;  // shell on shell is slippery, so they slide off each other
  const TIP = 0.75;         // how hard a shell perched on others tips off them (fraction of gravity)
  const TIP_SPEED = 110;    // px/s: the bumpy ride over other shells never gets faster than this
  const SHORE_INSET = 28;   // px kept clear at each end so shells stay off the window's round corners
  const BOUNCE = 0.3;       // fraction of speed kept in a hard landing
  const SLEEP_TIME = 0.4;   // s a shell must lie still before it stops being simulated

  const foot = win.querySelector('.hero__foot');
  const shells = [];
  let shellFrame = 0;
  let shellLast = 0;

  const shoreY = () => foot.offsetTop - strip.offsetTop - SHORE_GAP;

  // Each shell is a solid disc of radius `r`. They fall, bounce, slide or roll on the sand and knock
  // into each other; one that lands on another slips off its curve unless it is cradled between two,
  // so they spread out along the shore in a low drift instead of stacking up. A shell lying still
  // goes to sleep (it stops moving and is solid for the others) until something hits it.
  const mass = (sh) => (sh.asleep ? 0 : 1 / (sh.r * sh.r)); // inverse mass: bigger shells shove harder

  const wake = (sh) => {
    if (!sh.asleep) return;
    sh.asleep = false;
    sh.still = 0;
    // Whatever was resting on it has lost its footing too.
    shells.forEach((o) => {
      if (o.asleep && Math.hypot(o.x - sh.x, o.y - sh.y) < o.r + sh.r + 3) wake(o);
    });
  };

  // The nearest way up it can lie, plus its own small tilt.
  const restAngle = (sh) => {
    const near = sh.kind.rest.map((a) => a + 360 * Math.round((sh.rot - a) / 360));
    return near.reduce((p, q) => (Math.abs(q - sh.rot) < Math.abs(p - sh.rot) ? q : p)) + sh.tilt;
  };

  const collide = (a, b) => {
    if (a.asleep && b.asleep) return;
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 0.01;
    const overlap = a.r + b.r - d;
    if (overlap <= 0) return;
    dx /= d;
    dy /= d; // normal, from a to b
    // Hit hard enough, a sleeping shell is knocked loose.
    const closing = (b.vx - a.vx) * dx + (b.vy - a.vy) * dy;
    if (closing < -40) { wake(a); wake(b); }
    const ma = mass(a);
    const mb = mass(b);
    if (!ma && !mb) return;
    // Push them apart...
    const push = (overlap * 0.8) / (ma + mb);
    a.x -= dx * push * ma; a.y -= dy * push * ma;
    b.x += dx * push * mb; b.y += dy * push * mb;
    // ...note which one is now resting on the other...
    if (dy > 0.3) { a.held = true; a.lean -= dx; a.below = Math.min(a.below, b.layer); }
    if (dy < -0.3) { b.held = true; b.lean += dx; b.below = Math.min(b.below, a.layer); }
    // ...and trade momentum: a soft clack, plus a little friction along the contact.
    if (closing >= 0) return;
    const j = (-(1 + (closing < -150 ? 0.2 : 0)) * closing) / (ma + mb);
    a.vx -= j * ma * dx; a.vy -= j * ma * dy;
    b.vx += j * mb * dx; b.vy += j * mb * dy;
    const tx = -dy;
    const ty = dx;
    const slide = (b.vx - a.vx) * tx + (b.vy - a.vy) * ty;
    const jt = clamp(-slide / (ma + mb), -SHELL_GRIP * j, SHELL_GRIP * j);
    a.vx -= jt * ma * tx; a.vy -= jt * ma * ty;
    b.vx += jt * mb * tx; b.vy += jt * mb * ty;
  };

  const settleStep = (h) => {
    const shore = shoreY();
    const awake = shells.filter((sh) => !sh.asleep);
    awake.forEach((sh) => {
      sh.vy += GRAVITY * h;
      sh.x += sh.vx * h;
      sh.y += sh.vy * h;
      sh.rot += sh.vr * h;
      sh.grounded = false;
      sh.held = false;
      sh.lean = 0;
      sh.below = Infinity;
    });

    // Contacts, solved a few times over so piles settle without jitter.
    for (let pass = 0; pass < 4; pass += 1) {
      awake.forEach((sh) => {
        const floor = shore - sh.foot;
        if (sh.y >= floor) {
          sh.y = floor;
          sh.grounded = true;
          if (sh.vy > 0) {
            // A hard landing bounces (and knocks the shell into a spin); a soft one stays down.
            if (sh.vy > 200) {
              sh.vy *= -BOUNCE;
              if (sh.kind.rest) sh.vr += sh.vx * 1.5 + (Math.random() - 0.5) * 120;
            } else sh.vy = 0;
          }
        }
        const edge = sh.r + SHORE_INSET;
        if (sh.x < edge || sh.x > W - edge) {
          sh.x = clamp(sh.x, edge, W - edge);
          sh.vx *= -0.3;
          sh.slip = sh.x < W / 2 ? 1 : -1; // tipping into the end of the shore: go the other way
        }
      });
      for (let p = 0; p < shells.length; p += 1) {
        for (let q = p + 1; q < shells.length; q += 1) collide(shells[p], shells[q]);
      }
    }

    awake.forEach((sh) => {
      if (sh.asleep) return;
      const touching = sh.grounded || sh.held;
      // Which layer it lies in: 1 on the sand, 2 nestled between shells on the sand, and so on.
      sh.layer = sh.grounded ? 1 : sh.held ? sh.below + 1 : Infinity;
      // Shells aren't discs: one perched higher than that is never truly balanced. It tips off
      // towards the open side (or the way it was heading) and keeps that way, tumbling down the
      // pile, until it settles into a gap a layer lower or reaches the sand.
      if (sh.layer > 2) {
        if (!sh.tipping) sh.slip = Math.sign(sh.lean) || Math.sign(sh.vx) || sh.slip;
        sh.tipping = true;
        if (sh.vx * sh.slip < TIP_SPEED) sh.vx += sh.slip * TIP * GRAVITY * h;
      } else sh.tipping = false;
      if (!sh.kind.rest) {
        // Round shells roll: drag is low and the spin follows the ground speed.
        if (sh.grounded) sh.vx -= Math.sign(sh.vx) * Math.min(Math.abs(sh.vx), ROLL_DRAG * GRAVITY * h);
        if (touching) sh.vr = (sh.vx / sh.r) * (180 / Math.PI);
      } else {
        // Flat shells slide to a stop on the sand and rock over onto their resting side.
        if (sh.grounded) sh.vx -= Math.sign(sh.vx) * Math.min(Math.abs(sh.vx), SAND_GRIP * GRAVITY * h);
        if (touching) sh.vr += ((restAngle(sh) - sh.rot) * 160 - sh.vr * 14) * h;
      }
      // Lying still for a moment: put it to sleep.
      const still = touching && Math.abs(sh.vx) < 8 && Math.abs(sh.vy) < 8 && Math.abs(sh.vr) < 10;
      sh.still = still ? sh.still + h : 0;
      if (sh.still > SLEEP_TIME) {
        sh.asleep = true;
        sh.vx = 0; sh.vy = 0; sh.vr = 0;
      }
    });
  };

  const placeShell = (sh) => {
    sh.el.style.transform = `translate3d(${sh.x - SHELL_SIZE / 2}px, ${sh.y - SHELL_SIZE / 2}px, 0) rotate(${sh.rot}deg)`;
  };

  const stepShells = (now) => {
    const dt = Math.min((now - shellLast) / 1000, 0.05);
    shellLast = now;
    const steps = Math.ceil(dt / SHELL_STEP);
    for (let k = 0; k < steps; k += 1) settleStep(dt / steps);
    const shore = shoreY();
    let moving = false;
    shells.forEach((sh) => {
      // Once it has dropped clear of the photo's edge (or nears the shore, for photos that sit
      // low), it comes in front of the photos so it lands in view.
      if (!sh.front && sh.vy > 0 && sh.y > Math.min(sh.clearY, shore - sh.foot - SHELL_SIZE)) {
        sh.front = true;
        sh.el.classList.add('is-front');
      }
      if (!sh.asleep) moving = true;
      placeShell(sh);
    });
    shellFrame = moving ? requestAnimationFrame(stepShells) : 0;
  };

  const startShells = () => {
    if (shellFrame) return;
    shellLast = performance.now();
    shellFrame = requestAnimationFrame(stepShells);
  };

  // The shore moves with the window: let the shells settle onto it again.
  new ResizeObserver(() => {
    if (!shells.length) return;
    shells.forEach(wake);
    startShells();
  }).observe(win);

  const dropShell = (i) => {
    const card = restAt(i);
    const el = document.createElement('span');
    el.className = 'shell';
    el.setAttribute('aria-hidden', 'true');
    const kind = SHELLS[pickShell()];
    const look = kind.looks[pickOne(Object.keys(kind.looks))];
    shellId += 1;
    el.innerHTML = `<svg viewBox="0 0 48 48">${kind.draw(`shell${shellId}-`, look)}</svg>`;
    strip.append(el);

    // It slips out from behind the bottom of the photo with a little toss.
    const sh = {
      el,
      kind,
      foot: kind.foot * TO_PX,
      r: kind.r * TO_PX,
      tilt: (Math.random() - 0.5) * 24,
      slip: Math.random() < 0.5 ? -1 : 1,
      tipping: false,
      layer: Infinity,
      lean: 0,
      x: card.x + (Math.random() - 0.5) * cardW * card.s * 0.5,
      y: card.y + (cardH * card.s) / 2 - SHELL_SIZE,
      vx: (Math.random() - 0.5) * 140,
      vy: -260 - Math.random() * 120,
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 540,
      clearY: card.y + (cardH * card.s) / 2,
      front: false,
      asleep: false,
      still: 0,
    };
    shells.push(sh);

    // Keep the shore from overflowing: the oldest shell washes away, and anything lying on it
    // settles into the gap.
    if (shells.length > MAX_SHELLS) {
      const old = shells.shift();
      shells.forEach((o) => {
        if (Math.hypot(o.x - old.x, o.y - old.y) < o.r + old.r + 3) wake(o);
      });
      old.el.classList.add('is-leaving');
      old.el.addEventListener('transitionend', () => old.el.remove(), { once: true });
    }

    if (reduceMotion.matches) {
      // No fall to watch: work out where it ends up and put it straight there.
      for (let k = 0; k < 2400 && shells.some((o) => !o.asleep); k += 1) settleStep(SHELL_STEP);
      sh.front = true;
      el.classList.add('is-front');
      shells.forEach(placeShell);
      return;
    }
    placeShell(sh);
    startShells();
  };

  // Shake a photo: it wiggles and a shell falls out.
  const shake = (el, i) => {
    play(el, 'is-wiggling');
    dropShell(i);
  };

  originals.forEach((el, i) => {
    let press = null;

    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || mode !== 'rest') return;
      el.setPointerCapture(e.pointerId);
      press = { x: e.clientX, y: e.clientY, from: { x: offsets[i].x, y: offsets[i].y }, active: false };
      raise(i);
      draw(el, restAt(i));
      el.classList.add('is-peeled');
    });

    el.addEventListener('pointermove', (e) => {
      if (!press) return;
      const dx = e.clientX - press.x;
      const dy = e.clientY - press.y;
      if (!press.active) {
        if (Math.hypot(dx, dy) < DRAG_START) return;
        press.active = true;
        el.classList.add('is-dragging');
      }
      moveBy(i, press.from, dx, dy);
    });

    const release = () => {
      if (!press) return;
      el.classList.remove('is-peeled', 'is-dragging');
      if (press.active) play(el, 'is-sticking'); else shake(el, i);
      press = null;
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);

    // Keyboard: Enter/Space shakes the photo (a click with no pointer); arrow keys move it.
    el.addEventListener('click', (e) => {
      if (e.detail === 0 && mode === 'rest') shake(el, i);
    });
    el.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 48 : 12;
      const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      const move = moves[e.key];
      if (!move || mode !== 'rest') return;
      e.preventDefault();
      raise(i);
      moveBy(i, { x: offsets[i].x, y: offsets[i].y }, move[0], move[1]);
    });
  });
})();

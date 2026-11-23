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

  // The ring wants more cards than there are photos, so each photo gets a decorative twin: the same
  // card carrying a photo of its own (the twins only fly through, so these never come to rest).
  const TWIN_PHOTOS = [
    { src: 'assets/photos/twin-1.jpg', pos: '22% 62%', caption: 'low tide wander' },
    { src: 'assets/photos/twin-2.jpg', pos: '38% center', caption: 'pelican flyby' },
    { src: 'assets/photos/twin-3.jpg', pos: 'center 64%', caption: 'turquoise & pines' },
    { src: 'assets/photos/twin-4.jpg', pos: 'center 82%', caption: 'blue for miles' },
    { src: 'assets/photos/polaroid-1.jpg', pos: 'center 62%', caption: 'sunset chaser' },
    { src: 'assets/photos/twin-6.jpg', pos: 'center 70%', caption: 'ibis strut' },
    { src: 'assets/photos/twin-7.jpg', pos: 'center 64%', caption: 'sunny side up' },
    { src: 'assets/photos/palm-springs.jpg', pos: 'right center', caption: 'palm springs' },
  ];
  const originals = [...strip.querySelectorAll('.sticker')];
  originals.forEach((el, i) => {
    const twin = el.cloneNode(true);
    twin.classList.add('sticker--twin');
    twin.setAttribute('aria-hidden', 'true');
    twin.tabIndex = -1;
    const photo = TWIN_PHOTOS[i];
    if (photo) {
      const img = twin.querySelector('img');
      img.src = photo.src;
      img.style.objectPosition = photo.pos;
      twin.querySelector('.polaroid span').textContent = photo.caption;
    }
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
    { x: 0.2, y: 1.3, r: 1.5, z: 1 },     // feet up, sea view
    { x: 0.023, y: 1.23, r: -1, z: 1 },   // paddle season
    { x: -0.167, y: 1.27, r: 2, z: 1 },   // cliffside views
    { x: -0.26, y: 1.39, r: -2, z: 2 },   // lone sail
    { x: -0.2, y: 1.52, r: 1, z: 3 },     // lakeside gold
    { x: 0.205, y: -0.15, r: 2, z: 1 },   // palm tree therapy, beside the text
    { x: 0.166, y: 1.54, r: -1.5, z: 3 }, // sailing in pairs
    { x: 0.258, y: 1.43, r: 2, z: 2 },    // salt water
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
  // The intro plays once, on the first visit in a tab: coming back here from another page (or
  // reloading) puts the photos straight into their clusters. Storage can be unavailable (private
  // windows, blocked site data), in which case the intro just plays.
  const SEEN = 'polaroid-intro-seen';
  let seen = false;
  try { seen = sessionStorage.getItem(SEEN) === '1'; } catch { /* no storage: play it */ }
  let mode = reduceMotion.matches || seen ? 'rest' : 'intro';
  if (mode === 'intro') {
    try { sessionStorage.setItem(SEEN, '1'); } catch { /* fine */ }
  }
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
  // the bottom of the window, piling up with the others, like shells collected on the shore. The
  // drawings live in shells.js, shared with the beach in the footer.
  const { SHELLS, pickShell } = window.seaShells;
  const f = (v) => v.toFixed(1);
  let shellId = 0;
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

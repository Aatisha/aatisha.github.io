// The about page's 1970s carousel slide projector.
//   Start: the room dims, the power light comes on, the lamp warms up with a flicker, the tray
//   clunks round one slot and the first slide comes into focus on the screen.
//   Back / forward: the shutter closes, the tray turns, the next slide drops in and the light returns.
//   Stop: the lamp goes out and the room lights come back up.
// The beam is drawn from wherever the lens is to wherever the slide lands on the screen, and the
// lens is aimed at the screen, so it all holds together at any size. With reduced motion there is
// no flicker, focus pull or turning tray: things simply fade.
(() => {
  const stage = document.querySelector('.projector-stage');
  if (!stage) return;

  const projector = stage.querySelector('.projector');
  const art = projector.querySelector('.projector__art');
  const tray = art.querySelector('.projector__tray');
  const lens = art.querySelector('.projector__lens');
  const power = projector.querySelector('[data-key="power"]');
  const readout = art.querySelector('.projector__readout');
  const beam = stage.querySelector('.projector-stage__beam');
  const cone = beam.querySelector('.projector-stage__cone');
  const clip = beam.querySelector('.projector-stage__clip');
  const motes = beam.querySelector('.projector-stage__motes');
  const gradient = beam.querySelector('#pj-beam');
  const picture = stage.querySelector('.screen__picture');
  const slide = picture.querySelector('.screen__slide');
  const img = slide.querySelector('img');
  const caption = stage.querySelector('.screen__caption');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const SVG = 'http://www.w3.org/2000/svg';

  const slides = [...stage.querySelectorAll('.projector__slides li')].map((li) => ({
    src: li.dataset.src,
    alt: li.textContent.trim(),
    label: li.dataset.label,
    tint: li.dataset.tint || 'amber',
    tall: li.dataset.shape === 'tall',
  }));

  const wait = (ms) => new Promise((done) => setTimeout(done, reduceMotion.matches ? Math.min(ms, 60) : ms));

  // ---------- The tray ----------
  // A ring of slots seen from the front and a little above: a ribbed side wall below a lighter top
  // with a divider between each slot and a dark hub in the middle. `turn` is how far round it has gone.
  const TRAY = { cx: 130, top: 26, base: 45, rx: 88, ry: 8, slots: 48 };
  const GATE = Math.PI * 0.7; // where the slide drops into the projector: the front left
  const at = (angle, r, y) => [TRAY.cx + r * TRAY.rx * Math.cos(angle), y + r * TRAY.ry * Math.sin(angle)];
  const f = (v) => v.toFixed(1);
  let turn = 0;

  const el = (name, attrs) => {
    const node = document.createElementNS(SVG, name);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    return node;
  };

  let wall = '';
  for (let a = 0; a <= Math.PI + 0.001; a += Math.PI / 40) wall += `${a ? 'L' : 'M'}${at(a, 1, TRAY.top).map(f).join(' ')}`;
  for (let a = Math.PI; a >= -0.001; a -= Math.PI / 40) wall += `L${at(a, 1, TRAY.base).map(f).join(' ')}`;
  const half = Math.PI / TRAY.slots;
  const gate = [GATE - half, GATE + half];
  tray.append(
    el('path', { d: `${wall}Z`, fill: 'url(#pj-band)' }),
    el('path', { class: 'projector__gate', d: `M${at(gate[0], 1, TRAY.top).map(f)} L${at(gate[1], 1, TRAY.top).map(f)} L${at(gate[1], 1, TRAY.base).map(f)} L${at(gate[0], 1, TRAY.base).map(f)}Z` }),
  );
  const ribs = el('path', { stroke: '#7a705d', 'stroke-width': '0.6', fill: 'none' });
  tray.append(ribs, el('ellipse', { cx: TRAY.cx, cy: TRAY.top, rx: TRAY.rx, ry: TRAY.ry, fill: 'url(#pj-tray)', stroke: '#8b8174', 'stroke-opacity': '0.5', 'stroke-width': '0.6' }));
  const dividers = el('path', { stroke: '#857a69', 'stroke-opacity': '0.45', 'stroke-width': '0.55', fill: 'none' });
  tray.append(
    dividers,
    el('ellipse', { cx: TRAY.cx, cy: TRAY.top, rx: TRAY.rx * 0.5, ry: TRAY.ry * 0.5, fill: 'none', stroke: '#857a69', 'stroke-opacity': '0.5', 'stroke-width': '0.6' }),
    el('ellipse', { cx: TRAY.cx, cy: TRAY.top, rx: 31, ry: TRAY.ry * 0.38, fill: '#3a3732' }),
    el('ellipse', { cx: TRAY.cx, cy: TRAY.top + 0.4, rx: 24, ry: TRAY.ry * 0.26, fill: '#141311' }),
    el('path', { d: `M${TRAY.cx - 29} ${TRAY.top - 0.4} Q${TRAY.cx} ${TRAY.top - TRAY.ry * 0.8} ${TRAY.cx + 29} ${TRAY.top - 0.4}`, fill: 'none', stroke: '#fff', 'stroke-opacity': '0.25', 'stroke-width': '0.6' }),
  );

  const drawTray = () => {
    let r = '';
    let d = '';
    for (let k = 0; k < TRAY.slots * 2; k += 1) {
      const a = turn + (k * Math.PI) / TRAY.slots;
      const s = Math.sin(a);
      if (s > 0.04) r += `M${at(a, 1, TRAY.top).map(f).join(' ')}L${at(a, 1, TRAY.base).map(f).join(' ')}`;
      if (k % 2 === 0) d += `M${at(a, 0.53, TRAY.top).map(f).join(' ')}L${at(a, 0.96, TRAY.top).map(f).join(' ')}`;
    }
    ribs.setAttribute('d', r);
    dividers.setAttribute('d', d);
  };
  drawTray();

  // Turn the tray one slot (dir 1 forward, -1 back), with a little overshoot as it clunks home.
  const clunk = (dir) => new Promise((done) => {
    const from = turn;
    const to = turn + dir * (2 * Math.PI) / TRAY.slots;
    if (reduceMotion.matches) { turn = to; drawTray(); done(); return; }
    const start = performance.now();
    const DURATION = 460;
    const back = (p) => 1 + 2.2 * (p - 1) ** 3 + 1.2 * (p - 1) ** 2; // ease out with a small overshoot
    const step = (now) => {
      const p = Math.min((now - start) / DURATION, 1);
      turn = from + (to - from) * back(p);
      drawTray();
      if (p < 1) requestAnimationFrame(step); else done();
    };
    requestAnimationFrame(step);
  });

  // ---------- The beam ----------
  const LENS = { x: 247, y: 116, length: 40.6, aperture: 10 }; // in the projector drawing's units

  // Convex hull of the lens mouth and the four corners of the lit picture.
  const hull = (points) => {
    const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower = [];
    const upper = [];
    p.forEach((q) => {
      while (lower.length > 1 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
      lower.push(q);
    });
    [...p].reverse().forEach((q) => {
      while (upper.length > 1 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
      upper.push(q);
    });
    return [...lower.slice(0, -1), ...upper.slice(0, -1)];
  };

  const layout = () => {
    const box = stage.getBoundingClientRect();
    const drawing = art.getBoundingClientRect();
    const pic = picture.getBoundingClientRect();
    if (!box.width || !pic.width) return;
    const scale = drawing.width / art.viewBox.baseVal.width;
    const ox = drawing.left - box.left + LENS.x * scale;
    const oy = drawing.top - box.top + LENS.y * scale;
    const px = pic.left - box.left;
    const py = pic.top - box.top;
    const cx = px + pic.width / 2;
    const cy = py + pic.height / 2;

    // Aim the lens at the middle of the picture (the projector's front feet tilt it up).
    const aim = Math.min(Math.max(Math.atan2(cy - oy, cx - ox), -0.72), -0.08);
    lens.setAttribute('transform', `translate(${LENS.x} ${LENS.y}) rotate(${f((aim * 180) / Math.PI)})`);
    const lx = ox + LENS.length * scale * Math.cos(aim);
    const ly = oy + LENS.length * scale * Math.sin(aim);
    const nx = -Math.sin(aim) * LENS.aperture * scale;
    const ny = Math.cos(aim) * LENS.aperture * scale;

    const points = hull([[lx + nx, ly + ny], [lx - nx, ly - ny], [px, py], [px + pic.width, py], [px + pic.width, py + pic.height], [px, py + pic.height]])
      .map((q) => q.map(f).join(',')).join(' ');
    beam.setAttribute('viewBox', `0 0 ${f(box.width)} ${f(box.height)}`);
    cone.setAttribute('points', points);
    clip.setAttribute('points', points);
    Object.entries({ x1: lx, y1: ly, x2: cx, y2: cy }).forEach(([k, v]) => gradient.setAttribute(k, f(v)));

    // Dust drifting in the light.
    motes.replaceChildren();
    for (let k = 0; k < 18; k += 1) {
      const t = 0.12 + Math.random() * 0.8;
      const side = Math.random() - 0.5;
      const x = lx + (cx - lx) * t + side * pic.width * t * 0.9;
      const y = ly + (cy - ly) * t + side * pic.height * t * 0.5;
      const mote = el('circle', { cx: f(x), cy: f(y), r: f(0.5 + Math.random() * 0.9) });
      mote.style.setProperty('--t', `${f(6 + Math.random() * 6)}s`);
      mote.style.setProperty('--d', `${f(-Math.random() * 10)}s`);
      mote.style.setProperty('--dx', `${f((Math.random() - 0.3) * 24)}px`);
      mote.style.setProperty('--dy', `${f(-6 - Math.random() * 18)}px`);
      motes.append(mote);
    }
  };

  // ---------- The show ----------
  let on = false;
  let busy = false;
  let index = -1; // the slide in the gate (-1: none yet)

  const pad = (n) => String(n).padStart(2, '0');

  // ---------- The display ----------
  // Fourteen-segment letters, as on old hi-fi and office kit: every segment is faintly there,
  // and the ones that make up each letter light up.
  const CELL = { w: 6, h: 10, pitch: 8.6, cx: 136, cy: 120, slant: 0 };
  const SEGMENTS = {
    a: [[0, 0], [1, 0]], b: [[1, 0], [1, 0.5]], c: [[1, 0.5], [1, 1]], d: [[0, 1], [1, 1]],
    e: [[0, 0.5], [0, 1]], f: [[0, 0], [0, 0.5]], g: [[0, 0.5], [0.5, 0.5]], G: [[0.5, 0.5], [1, 0.5]],
    h: [[0, 0], [0.5, 0.5]], i: [[0.5, 0], [0.5, 0.5]], j: [[1, 0], [0.5, 0.5]],
    k: [[0.5, 0.5], [0, 1]], l: [[0.5, 0.5], [0.5, 1]], m: [[0.5, 0.5], [1, 1]],
  };
  const GLYPHS = {
    A: 'abcefgG', C: 'adef', D: 'abcdil', E: 'adefg', I: 'adil', L: 'def', M: 'bcefhj', N: 'bcefhm',
    O: 'abcdef', P: 'abefgG', R: 'abefgGm', S: 'acdfgG', V: 'efkj', Y: 'hjl',
    0: 'abcdefjk', 1: 'bc', 2: 'abdegG', 3: 'abcdG', 4: 'bcfgG', 5: 'acdfgG', 6: 'acdefgG', 7: 'abc', 8: 'abcdefgG', 9: 'abcdfgG',
  };
  const segment = (x0, [[u0, v0], [u1, v1]]) => {
    // Shrink each stroke a little at both ends so neighbouring segments don't touch.
    const pull = 0.14;
    const p = [[u0 + (u1 - u0) * pull, v0 + (v1 - v0) * pull], [u1 - (u1 - u0) * pull, v1 - (v1 - v0) * pull]];
    return p.map(([u, v], n) => {
      const y = CELL.cy - CELL.h / 2 + v * CELL.h;
      const x = x0 + u * CELL.w + (CELL.cy + CELL.h / 2 - y) * CELL.slant;
      return `${n ? 'L' : 'M'}${f(x)} ${f(y)}`;
    }).join('');
  };
  const say = (text) => {
    const width = text.length * CELL.pitch - (CELL.pitch - CELL.w);
    let ghost = '';
    let lit = '';
    [...text].forEach((ch, n) => {
      if (ch === ' ') return;
      const x0 = CELL.cx - width / 2 + n * CELL.pitch;
      Object.entries(SEGMENTS).forEach(([name, line]) => {
        const d = segment(x0, line);
        if ((GLYPHS[ch] || '').includes(name)) lit += d; else ghost += d;
      });
    });
    readout.innerHTML = `<path class="projector__seg-ghost" d="${ghost}"/><path class="projector__seg" d="${lit}"/>`;
  };
  say('READY');

  const load = (i) => {
    const s = slides[i];
    img.src = s.src;
    img.alt = s.alt;
    slide.dataset.tint = s.tint;
    picture.classList.toggle('is-tall', s.tall);
    caption.innerHTML = `<span aria-hidden="true">${pad(i + 1)} — ${s.label}</span>`
      + `<span class="visually-hidden">Slide ${i + 1} of ${slides.length}: ${s.alt}</span>`;
    layout();
    return img.decode().catch(() => {});
  };

  // The slide in the gate comes into focus on the screen.
  const focus = () => {
    slide.classList.remove('is-focusing');
    void slide.offsetWidth; // restart the animation
    slide.classList.add('is-shown', 'is-focusing');
  };

  // Close the shutter, turn the tray to slide i, drop it in and open up again.
  const change = async (i, dir) => {
    busy = true;
    say('ADVANCE');
    stage.classList.add('is-shut');
    await wait(150);
    slide.classList.remove('is-shown', 'is-focusing');
    await Promise.all([clunk(dir), load(i)]);
    index = i;
    if (on) await wait(90);
    stage.classList.remove('is-shut');
    if (on) focus();
    say(on ? `SLIDE ${pad(i + 1)}` : 'READY');
    busy = false;
  };

  const start = async () => {
    busy = true;
    on = true;
    projector.classList.add('has-started');
    power.setAttribute('aria-pressed', 'true');
    power.setAttribute('aria-label', 'Stop the slide show');
    layout();
    stage.classList.add('is-dim');
    say('LAMP ON');
    await wait(450);
    stage.classList.add('is-on', 'is-warming');
    await wait(1000);
    stage.classList.remove('is-warming');
    if (index < 0) {
      await change(0, 1);
    } else {
      await load(index);
      focus();
      say(`SLIDE ${pad(index + 1)}`);
      busy = false;
    }
  };

  const stop = () => {
    on = false;
    power.setAttribute('aria-pressed', 'false');
    power.setAttribute('aria-label', 'Start the slide show');
    stage.classList.remove('is-on', 'is-warming', 'is-shut', 'is-dim');
    say('READY');
  };

  projector.querySelector('.projector__keys').addEventListener('click', (e) => {
    const key = e.target.closest('[data-key]');
    if (!key || busy) return;
    if (key.dataset.key === 'power') {
      if (on) stop(); else start();
      return;
    }
    const dir = key.dataset.key === 'next' ? 1 : -1;
    const i = ((index < 0 ? 0 : index + dir) + slides.length) % slides.length;
    if (on) change(i, dir);
    else { index = i; change(i, dir); } // with the lamp off the tray still turns, in the dark
  });

  new ResizeObserver(layout).observe(stage);

  // Fetch the slides once the page has settled, so they drop in without a wait.
  window.addEventListener('load', () => {
    setTimeout(() => slides.forEach((s) => { new Image().src = s.src; }), 600);
  });
})();

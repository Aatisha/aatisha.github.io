// The about page's slide projector, running the show in the world built by projector-model.js.
// The projector stands on the page itself: the canvas runs edge to edge behind the intro and is
// painted the page's own colour, and the projector is framed into the intro's right-hand column.
//   The silver knob (or the round key) turns the lamp on: it warms up with a flicker, the lights
//   go out across the whole page, and the tray drops the first photo into the gate. From then on
//   the show moves on by itself every few seconds until the lamp goes off (or Escape). ◀ ▶ step
//   through (the keys, the projector's own buttons, the remote, or the arrow keys while the keys
//   have focus); the tray can be dragged round, and the lens's ribbed ring pulls focus. Each part
//   names itself under the pointer, and the view sways a little as the pointer moves.
//   With reduced motion there's no flicker, focus pull, drifting dust, sway or autoplay, and every
//   move is near instant.
// projector.js loads this, and shows a still photo instead if it can't run.
import * as THREE from 'three';
import * as Sound from './projector-sound.js';
import { photoSlide } from './projector-textures.js';
import { buildWorld, SLOTS, ALPHA, DECK_TOP, TRAY_CX, trayAngle } from './projector-model.js';

const { clamp, lerp, damp } = THREE.MathUtils;
const Y = new THREE.Vector3(0, 1, 0);
const mod = (a, n) => ((a % n) + n) % n;
const pad = (n) => String(n).padStart(2, '0');
const AUTOPLAY_S = 6;
const ROOM_LIGHT = new THREE.Color('#ffffff'); // the page's own white
const ROOM_DARK = new THREE.Color('#15130f'); // lights out
const LAMP_WHITE = new THREE.Color(1, 0.93, 0.82);

// Where the camera looks from, by the shape of the column the projector is fitted into: from behind
// the projector's shoulder, so the screen faces the visitor. Further round behind it in a narrow
// column, so the screen rises above the projector; more from the side in a wide one.
const VIEWS = [
  { aspect: 0.72, dir: new THREE.Vector3(-0.88, 0.55, 0.62).normalize() },
  { aspect: 0.95, dir: new THREE.Vector3(-0.62, 0.5, 0.95).normalize() },
  { aspect: 1.5, dir: new THREE.Vector3(-0.42, 0.5, 1.04).normalize() },
];
function viewFor(aspect) {
  if (aspect <= VIEWS[0].aspect) return VIEWS[0].dir.clone();
  for (let i = 1; i < VIEWS.length; i += 1) {
    const a = VIEWS[i - 1];
    const b = VIEWS[i];
    if (aspect <= b.aspect) return a.dir.clone().lerp(b.dir, (aspect - a.aspect) / (b.aspect - a.aspect)).normalize();
  }
  return VIEWS[VIEWS.length - 1].dir.clone();
}

/* ---------- Tweens, stepped by the render loop ---------- */
const ease = {
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  out: (t) => 1 - (1 - t) ** 3,
  in: (t) => t * t * t,
  lin: (t) => t,
};
const tweens = new Set();
const tween = (d, fn, e = ease.inOut) => new Promise((done) => {
  if (d <= 0) {
    fn(1, 1);
    done();
    return;
  }
  tweens.add({ t: 0, d, fn, e, done });
});
const wait = (d) => tween(d, () => {});
function stepTweens(dt) {
  [...tweens].forEach((tw) => {
    tw.t += dt;
    const p = Math.min(1, tw.t / tw.d);
    tw.fn(tw.e(p), p);
    if (p >= 1) {
      tweens.delete(tw);
      tw.done();
    }
  });
}

export function mount(stage) {
  const room = stage.closest('.about-intro') || stage.parentElement;
  const holder = room.querySelector('.about-intro__scene');
  const beacon = room.querySelector('.projector-beacon');
  const tip = room.querySelector('.projector-tip');
  const caption = stage.querySelector('[data-projector-caption]');
  const status = stage.querySelector('[data-projector-status]');
  const foot = stage.querySelector('.projector-stage__foot');
  const keys = stage.querySelector('.projector-stage__keys');
  const html = document.documentElement;
  const powerKey = keys.querySelector('[data-key="power"]');
  const soundKey = keys.querySelector('[data-key="sound"]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => reduceMotion.matches;
  const T = (d) => (still() ? Math.min(d, 0.08) : d);

  // The photos, in tray order. Each becomes a slide the first time it's needed.
  const slides = [...stage.querySelectorAll('.projector__slides li')].map((li, i) => ({
    src: li.dataset.src,
    alt: li.textContent.trim(),
    label: li.dataset.label || '',
    tint: li.dataset.tint || 'amber',
    tall: li.dataset.shape === 'tall',
    seed: 401 + i * 37,
    made: null,
  }));
  if (!slides.length) throw new Error('The projector has no slides.');
  const prepare = (s) => {
    if (!s.made) {
      s.made = new Promise((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.src = s.src;
        img.decode().then(() => resolve(photoSlide(img, s)), () => resolve(null));
      });
    }
    return s.made;
  };
  // The tray is full: slot k holds photo (k - 1) mod N. Slot 0 is the tray's solid one.
  const photoAt = (k) => (k === 0 ? null : slides[(k - 1) % slides.length]);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // An opaque clear in the page's colour: the beam's light needs something to add onto, and the
  // canvas then has no visible edge.
  renderer.setClearColor(ROOM_LIGHT, 1);
  const world = buildWorld(renderer, { finish: stage.dataset.finish });
  const { scene, lights, uniforms: P } = world;
  const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 120);
  const canvas = renderer.domElement;
  holder.append(canvas);
  for (let k = 0; k < SLOTS; k += 1) world.setSlot(k, k !== 0);

  /* ---------- The show ---------- */
  const S = { k: 0, dropped: false, busy: false, dragging: false, lamp: false, lampLevel: 0, dim: 0, visible: false, idle: 0 };
  const bounceColor = LAMP_WHITE.clone();

  const updateText = () => {
    const s = photoAt(S.k);
    const n = s ? slides.indexOf(s) + 1 : 0;
    caption.textContent = S.lamp && s ? `${pad(n)} / ${pad(slides.length)}${S.dropped ? ` — ${s.label}` : ''}` : '';
  };
  // Only things the visitor did are announced; the autoplay stays quiet.
  const announce = () => {
    const s = photoAt(S.k);
    status.textContent = s ? `Slide ${slides.indexOf(s) + 1} of ${slides.length}: ${s.alt}` : 'Empty slot';
  };
  const project = (made) => {
    if (made) {
      P.uSlide.value = made.tex;
      P.uEmpty.value = 0;
      bounceColor.copy(made.avg);
    } else {
      P.uEmpty.value = 1;
      bounceColor.copy(LAMP_WHITE);
    }
    updateText();
  };
  const setDrop = (k, v) => world.setSlot(k, k !== 0, v);

  const press = (kind) => {
    (world.pressables[kind] || []).forEach(({ obj, axis, depth, rest }) => {
      tween(T(0.16), (p) => { obj.position.copy(rest).addScaledVector(axis, Math.sin(p * Math.PI) * depth); }, ease.lin);
    });
    if (kind !== 'select') Sound.play('press');
  };

  async function lift() {
    if (!S.dropped) return;
    const { k } = S;
    S.dropped = false;
    project(null);
    Sound.play('lift');
    await tween(T(0.2), (p) => setDrop(k, 1 - p), ease.out);
  }

  async function drop() {
    const { k } = S;
    const s = photoAt(k);
    if (!s) {
      S.dropped = false;
      project(null);
      return;
    }
    const making = prepare(s);
    await tween(T(0.18), (p) => setDrop(k, p), ease.in);
    const made = await making;
    S.dropped = true;
    project(made);
    Sound.play('drop');
    // A fresh slide pops in the lamp's heat: it lands a little soft and settles into focus.
    if (!still()) {
      P.uBlur.value = 3.5;
      tween(0.7, (p) => { P.uBlur.value = 3.5 * (1 - p); }, ease.out);
    }
    prepare(photoAt(mod(k + 1, SLOTS)) || slides[0]);
  }

  // Close the shutter, lift the slide, turn the tray to the next loaded slot and drop that one in.
  async function advance(dir, { auto = false } = {}) {
    if (S.busy || S.dragging) return;
    S.busy = true;
    S.idle = 0;
    if (!auto) press(dir > 0 ? 'next' : 'prev');
    let steps = 1;
    while (!photoAt(mod(S.k + dir * steps, SLOTS)) && steps < SLOTS) steps += 1;
    await Promise.all([tween(T(0.09), (p) => { P.uShutter.value = 1 - p; }), lift()]);
    Sound.play('advance');
    const from = world.tray.rotation.y;
    const to = from + dir * steps * ALPHA;
    await tween(T(0.26 + 0.05 * (steps - 1)), (p) => { world.tray.rotation.y = lerp(from, to, p); });
    S.k = mod(S.k + dir * steps, SLOTS);
    updateText();
    await drop();
    await tween(T(0.12), (p) => { P.uShutter.value = p; }, ease.out);
    S.busy = false;
    if (!auto) announce();
  }

  // The select bar lifts the slide out of the gate, or drops it back in.
  async function reseat() {
    if (S.busy || S.dragging) return;
    S.busy = true;
    press('select');
    if (S.dropped) await lift(); else await drop();
    S.busy = false;
  }

  const syncFan = () => Sound.setFan(S.lamp && S.visible && !document.hidden);

  let dimming = 0;
  function setLamp(on) {
    S.lamp = on;
    S.idle = 0;
    Sound.play('click');
    if (on) Sound.play('lampOn');
    syncFan();
    const from = world.knob.rotation.y;
    const to = on ? -Math.PI / 2 : 0;
    tween(T(0.22), (p) => { world.knob.rotation.y = lerp(from, to, p); }, ease.out);
    // The whole page follows the room into the dark (styles.css, "Lights out").
    if (!still()) {
      html.classList.add('is-dimming');
      clearTimeout(dimming);
      dimming = setTimeout(() => html.classList.remove('is-dimming'), 1600);
    }
    html.classList.toggle('lights-out', on);
    stage.classList.add('has-started');
    beacon.classList.remove('is-on');
    powerKey.setAttribute('aria-pressed', String(on));
    powerKey.setAttribute('aria-label', on ? 'Stop the slide show' : 'Start the slide show');
    updateText();
    // With the lamp warm, the first photo drops in if the gate's still empty.
    if (on) {
      prepare(slides[0]);
      wait(T(0.9)).then(() => {
        if (S.lamp && !S.busy && !S.dragging && !photoAt(S.k)) advance(1, { auto: true });
      });
    }
  }

  function focusPulse() {
    if (!still()) tween(0.9, (p) => { P.uBlur.value = Math.sin(p * Math.PI) * 4; }, ease.lin);
    Sound.play('tick', 0.6);
  }

  /* ---------- Pointer, keys and keyboard ---------- */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const trayPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(DECK_TOP + 0.7));
  const hit = new THREE.Vector3();
  const sway = { x: 0, y: 0, tx: 0, ty: 0 };
  let drag = null;
  let lastTick = 0;

  const aim = (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
  };
  const pick = (e) => {
    aim(e);
    const h = raycaster.intersectObjects(world.pickables, false)[0];
    return h ? h.object.userData.kind : null;
  };
  // The pointer's angle round the tray's spindle.
  const trayAngleAt = () => {
    if (!raycaster.ray.intersectPlane(trayPlane, hit)) return null;
    world.projector.worldToLocal(hit);
    return Math.atan2(-hit.z, hit.x - TRAY_CX);
  };

  // The tray only starts turning once the pointer has clearly moved sideways, so a vertical swipe
  // that starts on it still scrolls the page.
  let pending = null;
  const startDrag = (e) => {
    const a = trayAngleAt();
    if (a === null) return;
    S.dragging = true;
    S.idle = 0;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* pointer already gone */ }
    canvas.style.cursor = 'grabbing';
    drag = { prev: a, turned: 0, from: world.tray.rotation.y, slot: S.k };
    lift();
  };

  // What each part does, shown beside the pointer.
  const label = (kind) => ({
    lamp: S.lamp ? 'Lamp off' : 'Lamp on',
    next: 'Next slide',
    prev: 'Previous slide',
    select: S.dropped ? 'Lift the slide' : 'Drop the slide in',
    focus: 'Focus',
    tray: 'Drag to turn the tray',
  }[kind] || '');
  let tipKind = null;
  const showTip = (kind, e) => {
    if (!kind || drag) {
      tip.classList.remove('is-on');
      tipKind = null;
      return;
    }
    if (kind !== tipKind || kind === 'lamp' || kind === 'select') tip.textContent = label(kind);
    tipKind = kind;
    const r = room.getBoundingClientRect();
    tip.style.transform = `translate(${Math.round(e.clientX - r.left + 14)}px, ${Math.round(e.clientY - r.top + 20)}px)`;
    tip.classList.add('is-on');
  };

  canvas.addEventListener('pointerdown', (e) => {
    const kind = pick(e);
    showTip(null);
    if (!kind) return;
    Sound.unlock();
    if (kind === 'lamp') setLamp(!S.lamp);
    else if (kind === 'next' || kind === 'prev') advance(kind === 'next' ? 1 : -1);
    else if (kind === 'select') reseat();
    else if (kind === 'focus') focusPulse();
    else if (kind === 'tray' && !S.busy) pending = { id: e.pointerId, x: e.clientX, y: e.clientY };
  });

  canvas.addEventListener('pointermove', (e) => {
    if (pending && e.pointerId === pending.id) {
      const dx = e.clientX - pending.x;
      const dy = e.clientY - pending.y;
      if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
        pending = null;
        aim(e);
        if (!S.busy) startDrag(e);
      } else if (Math.abs(dy) > 10) {
        pending = null;
      }
    }
    if (!drag) {
      if (e.pointerType === 'mouse' && !e.buttons) {
        const kind = pick(e);
        canvas.style.cursor = kind === 'tray' ? 'grab' : kind ? 'pointer' : '';
        showTip(kind, e);
      }
      return;
    }
    aim(e);
    const a = trayAngleAt();
    if (a === null) return;
    let d = a - drag.prev;
    d -= Math.PI * 2 * Math.round(d / (Math.PI * 2));
    drag.prev = a;
    drag.turned += d;
    world.tray.rotation.y = drag.from + drag.turned;
    const slot = Math.round((world.tray.rotation.y + Math.PI / 2) / ALPHA);
    if (slot !== drag.slot) {
      drag.slot = slot;
      S.k = mod(slot, SLOTS);
      updateText();
      const now = performance.now();
      if (now - lastTick > 28) {
        Sound.play('tick');
        lastTick = now;
      }
    }
  });

  // Let go: the tray clicks home on the nearest slot and drops that slide in.
  async function endDrag(e) {
    pending = null;
    if (!drag) return;
    try { canvas.releasePointerCapture(e.pointerId); } catch (err) { /* already released */ }
    canvas.style.cursor = '';
    const from = world.tray.rotation.y;
    const to = trayAngle(drag.slot);
    drag = null;
    S.busy = true;
    S.dragging = false;
    await tween(T(0.18), (p) => { world.tray.rotation.y = lerp(from, to, p); }, ease.out);
    await wait(T(0.08));
    await drop();
    S.busy = false;
    S.idle = 0;
    announce();
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', () => showTip(null));

  // The view leans a little toward the pointer anywhere over the intro, copy included.
  room.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || drag) return;
    const r = holder.getBoundingClientRect();
    sway.tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
    sway.ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
  });
  room.addEventListener('pointerleave', () => {
    sway.tx = 0;
    sway.ty = 0;
  });

  keys.addEventListener('click', (e) => {
    const key = e.target.closest('[data-key]');
    if (!key) return;
    Sound.unlock();
    const what = key.dataset.key;
    if (what === 'power') setLamp(!S.lamp);
    else if (what === 'next' || what === 'prev') advance(what === 'next' ? 1 : -1);
    else if (what === 'sound') {
      Sound.setMuted(!Sound.isMuted());
      soundKey.setAttribute('aria-pressed', String(!Sound.isMuted()));
    }
  });
  stage.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    Sound.unlock();
    advance(e.key === 'ArrowRight' ? 1 : -1);
  });
  // Escape brings the lights back up, wherever focus is.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && S.lamp) setLamp(false);
  });

  /* ---------- Framing ---------- */
  // Fit the projector and screen into the stage column (clear of the keys along its bottom),
  // wherever that column sits on the wider canvas, then let the pointer sway the view around that.
  const view = { target: new THREE.Vector3(), dir: new THREE.Vector3(), dist: 20 };
  const swayDir = new THREE.Vector3();
  const swayAxis = new THREE.Vector3();
  const placeCamera = () => {
    swayDir.copy(view.dir).applyAxisAngle(Y, -sway.x * 0.07);
    swayAxis.crossVectors(Y, swayDir).normalize();
    swayDir.applyAxisAngle(swayAxis, -sway.y * 0.035);
    camera.position.copy(view.target).addScaledVector(swayDir, view.dist);
    camera.lookAt(view.target);
  };

  function fit() {
    const w = holder.clientWidth;
    const h = holder.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    P.uPR.value = renderer.getPixelRatio();
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    // The column, in the canvas's own -1…1 coordinates.
    const c = holder.getBoundingClientRect();
    const b0 = stage.getBoundingClientRect();
    const footTop = foot.getBoundingClientRect().top - 10;
    const rect = {
      x0: ((b0.left - c.left) / w) * 2 - 1,
      x1: ((b0.right - c.left) / w) * 2 - 1,
      y0: 1 - ((Math.min(b0.bottom, footTop) - c.top) / h) * 2,
      y1: 1 - ((b0.top - c.top) / h) * 2,
    };
    const availW = rect.x1 - rect.x0;
    const availH = rect.y1 - rect.y0;
    const midX = (rect.x0 + rect.x1) / 2;
    const midY = (rect.y0 + rect.y1) / 2;

    const pts = world.framePoints;
    const dir = viewFor((availW * w) / (availH * h));
    const target = new THREE.Box3().setFromPoints(pts).getCenter(new THREE.Vector3());
    const right = new THREE.Vector3();
    const up = new THREE.Vector3();
    const back = new THREE.Vector3();
    const v = new THREE.Vector3();
    const measure = (dist) => {
      camera.position.copy(target).addScaledVector(dir, dist);
      camera.lookAt(target);
      camera.updateMatrixWorld(true);
      const b = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
      pts.forEach((p) => {
        v.copy(p).project(camera);
        b.x0 = Math.min(b.x0, v.x);
        b.x1 = Math.max(b.x1, v.x);
        b.y0 = Math.min(b.y0, v.y);
        b.y1 = Math.max(b.y1, v.y);
      });
      return b;
    };
    let dist = 20;
    for (let pass = 0; pass < 3; pass += 1) {
      let lo = 2;
      let hi = 80;
      for (let i = 0; i < 30; i += 1) {
        const mid = (lo + hi) / 2;
        const b = measure(mid);
        if (b.x1 - b.x0 < availW && b.y1 - b.y0 < availH) hi = mid; else lo = mid;
      }
      dist = hi;
      const b = measure(dist);
      camera.matrixWorld.extractBasis(right, up, back);
      const hh = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * dist;
      target.addScaledVector(right, ((b.x0 + b.x1) / 2 - midX) * hh * camera.aspect).addScaledVector(up, ((b.y0 + b.y1) / 2 - midY) * hh);
    }
    view.target.copy(target);
    view.dir.copy(dir);
    view.dist = dist;
    placeCamera();
    dirty = true;
  }

  /* ---------- The loop: runs only while the stage is on screen ---------- */
  const clock = new THREE.Clock();
  const roomColor = new THREE.Color();
  let roomHex = '';
  const lensPos = new THREE.Vector3();
  const knobPos = new THREE.Vector3();
  const knobEdge = new THREE.Vector3();
  const toEye = new THREE.Vector3();
  let ready = false;
  let dirty = true; // a redraw is owed (resized)

  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05);
    stepTweens(dt);
    if (!still()) P.uTime.value += dt;
    if (!still() && !drag) {
      sway.x = damp(sway.x, sway.tx, 2.5, dt);
      sway.y = damp(sway.y, sway.ty, 2.5, dt);
    }
    placeCamera();

    // The filament warms up with a little flicker; the room dims more slowly.
    const lampOn = S.lamp ? 1 : 0;
    S.lampLevel = damp(S.lampLevel, lampOn, S.lamp ? 4.5 : 9, dt);
    const flicker = S.lamp && S.lampLevel < 0.97 && !still() ? 0.9 + 0.1 * Math.sin(clock.elapsedTime * 90) : 1;
    const L = S.lampLevel * flicker;
    S.dim = damp(S.dim, lampOn, 1.6, dt);
    const d = S.dim;
    P.uLamp.value = L;
    P.uBeam.value = lerp(0.1, 1, d);
    lights.amb.intensity = lerp(0.72, 0.05, d);
    lights.key.intensity = lerp(1.55, 0.1, d);
    lights.rectLight.intensity = lerp(1.6, 0.06, d);
    scene.environmentIntensity = lerp(1, 0.28, d);
    world.floor.material.opacity = lerp(0.16, 0.12, d);
    world.screenMat.emissiveIntensity = lerp(0.55, 0, d);
    // The canvas and the page are always the same shade, so the canvas never shows an edge.
    roomColor.copy(ROOM_LIGHT).lerp(ROOM_DARK, d);
    renderer.setClearColor(roomColor, 1);
    const hex = `#${roomColor.getHexString()}`;
    if (hex !== roomHex) {
      roomHex = hex;
      html.style.setProperty('--room', hex);
    }

    const open = L * P.uShutter.value;
    lights.gateLight.intensity = L * 2.4;
    world.ventMat.emissiveIntensity = L * 1.4;
    world.glassMat.emissiveIntensity = open * 1.6;
    world.lens.getWorldPosition(lensPos);
    const facing = clamp(toEye.copy(camera.position).sub(lensPos).normalize().dot(world.dirFlat) * 0.8 + 0.35, 0.12, 1);
    world.lensGlow.material.color.setRGB(1, 0.78, 0.5).multiplyScalar(open * facing * lerp(0.35, 1, d));
    lights.bounce.color.copy(bounceColor);
    lights.bounce.intensity = open * d * 3.2;

    if (S.lamp && !S.busy && !S.dragging && !still()) {
      S.idle += dt;
      if (S.idle > AUTOPLAY_S) advance(1, { auto: true });
    }

    // With the lights up and nothing moving, the last frame still stands: skip the redraw.
    const settled = !S.lamp && S.lampLevel < 1e-3 && d < 1e-3 && !tweens.size && !drag
      && (still() || (Math.abs(sway.x - sway.tx) < 1e-3 && Math.abs(sway.y - sway.ty) < 1e-3));
    if (settled && ready && !dirty) return;
    dirty = false;
    renderer.render(scene, camera);
    if (beacon.classList.contains('is-on')) placeBeacon();
    if (!ready) {
      ready = true;
      room.classList.add('is-ready');
      beacon.classList.add('is-on');
      placeBeacon();
    }
  }

  // Keep the breathing ring over the silver knob, sized to it, until the show is first started.
  function placeBeacon() {
    world.knob.getWorldPosition(knobPos);
    knobPos.y += 0.1;
    knobEdge.copy(knobPos).add(toEye.set(0.24, 0, 0).applyQuaternion(camera.quaternion));
    const c = holder.getBoundingClientRect();
    const r = room.getBoundingClientRect();
    const a = knobPos.project(camera);
    const e = knobEdge.project(camera);
    const x = ((a.x + 1) / 2) * c.width + c.left - r.left;
    const y = ((1 - a.y) / 2) * c.height + c.top - r.top;
    const radius = Math.hypot((e.x - a.x) * c.width, (e.y - a.y) * c.height) / 2;
    beacon.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    beacon.style.setProperty('--w', `${(radius * 2).toFixed(1)}px`);
    beacon.style.setProperty('--h', `${(radius * 1.15).toFixed(1)}px`);
  }

  const run = () => {
    const on = S.visible && !document.hidden;
    renderer.setAnimationLoop(on ? tick : null);
    syncFan();
  };
  new IntersectionObserver(([entry]) => {
    S.visible = entry.isIntersecting;
    run();
  }).observe(holder);
  document.addEventListener('visibilitychange', run);
  const resize = new ResizeObserver(fit);
  resize.observe(holder);
  resize.observe(stage);
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    renderer.setAnimationLoop(null);
    S.visible = false;
    S.lamp = false;
    syncFan();
    html.classList.remove('lights-out');
    html.style.removeProperty('--room');
    stage.classList.add('is-fallback');
    room.classList.add('is-fallback');
  });

  fit();
  updateText();
  // Get the first photo ready while the visitor reads.
  setTimeout(() => prepare(slides[0]), 1200);
}

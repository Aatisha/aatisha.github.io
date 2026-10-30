// The slide projector's world, modelled in code with Three.js: a 1970s carousel slide projector
// with its 140-slot tray, a remote on a cord, and a tripod screen leaning square to the beam.
// The picture is projected onto the screen's cloth, and the beam between them is ray-marched
// through dusty air so it carries the slide's colours. projector-scene.js runs the show.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {
  TAU, rand, plasticAlbedo, surfaceMap, numberBandTex, mountTex, brushedDiscTex, brushedLinearTex,
  knurlTex, glowTex, lensEmissiveTex, labelTex, nameplateTex, screenFabricTex, weaveTex, toTex,
} from './projector-textures.js';

export const SLOTS = 140;
export const ALPHA = TAU / SLOTS;
const Y = new THREE.Vector3(0, 1, 0);

// Projector body and tray (projector-local units; the body is 3.7 wide).
const BODY_W = 3.7;
const BODY_D = 3.6;
const FRONT_X = BODY_W / 2;
const SIDE_Z = BODY_D / 2;
export const DECK_TOP = 1.24;
export const TRAY_CX = -0.05;
const R_IN = 0.72;
const R_OUT = 1.46;
const BASE_H = 0.06;
const FIN_H = 0.66;
const GAP = 0.024;
const SLIDE = 0.6;
const SLIDE_T = 0.016;
const SLIDE_RC = 1.08;
const SLIDE_Y = BASE_H + SLIDE / 2 + 0.004;
const DROP_DEPTH = 0.74;
const LENS_Y = 0.76;
const LENS_Z = SLIDE_RC; // the gate sits under the tray's front edge, and the lens lines up with it

// The screen. The cloth is the picture plus a printed black border; its carry case sits on a tripod.
const THROW = 5.8; // lens to screen
const IMG_W = 4.0;
const IMG_H = IMG_W / 1.5;
const B_SIDE = 0.17;
const B_TOP = 0.17;
const B_BOT = 0.14;
const SLOT_H = 0.8;
const FAB_W = IMG_W + 2 * B_SIDE;
const FAB_H = IMG_H + B_TOP + B_BOT;
const CASE_W = FAB_W + 0.32;
const CASE_H = 0.22;
const CASE_D = 0.26;
const POLE_Z = -(CASE_D / 2 + 0.05);

export const trayAngle = (k) => -Math.PI / 2 + k * ALPHA;

const rbox = (w, h, d, r, seg = 4) => new RoundedBoxGeometry(w, h, d, seg, r);
function mesh(geo, mat, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}
// Additive light (glows, beam, dust) that adds to colour without touching alpha.
const additive = (extra = {}) => ({
  transparent: true,
  depthWrite: false,
  toneMapped: false,
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneFactor,
  blendSrcAlpha: THREE.ZeroFactor,
  blendDstAlpha: THREE.OneFactor,
  ...extra,
});

export function buildWorld(renderer, { finish = 'black' } = {}) {
  RectAreaLightUniformsLib.init();
  const scene = new THREE.Scene();

  /* ---------- Studio light ---------- */
  // Soft reflections from a few light panels baked into an environment map.
  {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = new THREE.Scene();
    env.background = new THREE.Color(0x0d0c0b);
    const grp = new THREE.Group();
    grp.rotation.set(-Math.PI / 3, 0, 1);
    [[8, 3, [0, 3, 6], 1.4], [6, 3, [-6, 0, 4], 1], [6, 3, [6, 2, 4], 1], [10, 2, [0, 6, -4], 0.5]].forEach(([w, h, p, i]) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(i * 1.6), side: THREE.DoubleSide }),
      );
      m.position.set(...p);
      m.lookAt(0, 0, 0);
      grp.add(m);
    });
    env.add(grp);
    scene.environment = pmrem.fromScene(env, 0.03).texture;
    pmrem.dispose();
  }

  const amb = new THREE.AmbientLight(0xffffff, 0.72);
  const key = new THREE.DirectionalLight(0xfffaf0, 1.55);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -1e-4;
  key.shadow.normalBias = 0.04;
  Object.assign(key.shadow.camera, { near: 0.5, far: 40, left: -10, right: 10, top: 10, bottom: -10 });
  const rectLight = new THREE.RectAreaLight(0xfffdf7, 1.6, 7, 4);
  const bounce = new THREE.RectAreaLight(0xffffff, 0, IMG_W + 0.3, IMG_H + 0.2); // light thrown back off the screen
  scene.add(amb, key, key.target, rectLight, bounce);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.ShadowMaterial({ color: 0x2a2018, opacity: 0.16 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  /* ---------- Materials ---------- */
  const surfBody = surfaceMap({ stipple: 2600, repeat: [3, 3] });
  const surfTray = surfaceMap({ scratches: 260, repeat: [2, 2] });
  const dark = { blotch: '95,90,82', speckRGB: '125,120,112', repeat: [3, 3] };
  const FINISHES = {
    black: {
      body: () => plasticAlbedo('#262523', { ...dark, speck: 1400, blotchAmt: 0.04, speckA: [0.04, 0.12] }),
      lower: () => plasticAlbedo('#1c1b1a', { ...dark, speck: 1200, blotchAmt: 0.03, speckA: [0.03, 0.1] }),
      deck: () => plasticAlbedo('#222120', { ...dark, speck: 1200, blotchAmt: 0.03, speckA: [0.03, 0.1] }),
      roughness: 0.74,
      bump: 0.35,
      env: 0.6,
    },
    beige: {
      body: () => plasticAlbedo('#e8ddc6', { speck: 900, repeat: [3, 3] }),
      lower: () => plasticAlbedo('#d7cbaf', { speck: 700, repeat: [3, 3] }),
      deck: () => plasticAlbedo('#dfd3ba', { speck: 800, repeat: [3, 3] }),
      roughness: 1,
      bump: 0.5,
      env: 0.45,
    },
  };
  const f = FINISHES[finish] || FINISHES.black;
  const plastic = (map) => new THREE.MeshStandardMaterial({
    map, bumpMap: surfBody, bumpScale: f.bump, roughnessMap: surfBody, roughness: f.roughness, metalness: 0.02, envMapIntensity: f.env,
  });
  const bodyMat = plastic(f.body());
  const lowerMat = plastic(f.lower());
  const deckMat = plastic(f.deck());

  const trayMat = new THREE.MeshStandardMaterial({
    map: plasticAlbedo('#bdb4a4', { speck: 600, blotch: '150,120,70', blotchAmt: 0.04 }),
    bumpMap: surfTray, bumpScale: 0.2, roughnessMap: surfTray, roughness: 0.62, envMapIntensity: 0.5,
  });
  const trayWallMat = trayMat.clone();
  trayWallMat.side = THREE.DoubleSide;
  const zeroMat = new THREE.MeshStandardMaterial({ color: '#d8d0c1', roughness: 0.55, bumpMap: surfTray, bumpScale: 0.2 });
  const wellMat = new THREE.MeshStandardMaterial({ color: '#5e5850', roughness: 0.7 });
  const bandMat = new THREE.MeshStandardMaterial({ map: numberBandTex(SLOTS), roughness: 0.6, side: THREE.DoubleSide });
  const trimMat = new THREE.MeshStandardMaterial({ color: '#141312', roughness: 0.38, metalness: 0.1, envMapIntensity: 0.8, side: THREE.DoubleSide });
  const rubberMat = new THREE.MeshStandardMaterial({ color: '#0f0f0e', roughness: 0.92 });
  const barrelMat = new THREE.MeshStandardMaterial({ color: '#151413', roughness: 0.55, metalness: 0.05, envMapIntensity: 0.7 });
  const knurlMat = new THREE.MeshStandardMaterial({ color: '#1a1918', roughness: 0.6, bumpMap: knurlTex(90), bumpScale: 2.5 });
  const metalTop = new THREE.MeshStandardMaterial({ color: '#e2e2de', map: brushedDiscTex(), metalness: 1, roughness: 0.28, envMapIntensity: 1.3 });
  const metalSide = new THREE.MeshStandardMaterial({ color: '#cfcfcb', metalness: 1, roughness: 0.32, bumpMap: knurlTex(60), bumpScale: 1.5, envMapIntensity: 1.2 });
  const metalBar = new THREE.MeshStandardMaterial({ color: '#d6d6d2', map: toTex(brushedLinearTex()[0]), metalness: 1, roughness: 0.3, envMapIntensity: 1.2 });
  const buttonMat = new THREE.MeshStandardMaterial({ color: '#cfcac1', roughness: 0.5, envMapIntensity: 0.6 });
  const slideMat = new THREE.MeshStandardMaterial({ map: mountTex(), roughness: 0.85 });
  const cordMat = new THREE.MeshStandardMaterial({ color: '#161514', roughness: 0.5, envMapIntensity: 0.6 });
  const ventMat = new THREE.MeshStandardMaterial({ color: '#0b0a09', roughness: 0.9, emissive: new THREE.Color('#ff8a3c'), emissiveIntensity: 0 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#0c0d14', roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02,
    iridescence: 0.9, iridescenceIOR: 1.6, iridescenceThicknessRange: [180, 420], envMapIntensity: 2.2,
    emissive: new THREE.Color('#ffb36b'), emissiveMap: lensEmissiveTex(), emissiveIntensity: 0,
  });
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const plateMat = (text, w) => new THREE.MeshStandardMaterial({ map: nameplateTex(text, w), metalness: 0.9, roughness: 0.32, envMapIntensity: 1.1 });

  // Clickable parts, and the parts that move when pressed.
  const pickables = [];
  const pressables = {};
  const pickable = (obj, kind) => {
    obj.userData.kind = kind;
    pickables.push(obj);
    return obj;
  };
  const pressable = (kind, obj, axis, depth = 0.025) => {
    (pressables[kind] ||= []).push({ obj, axis: axis.clone().normalize(), depth, rest: obj.position.clone() });
  };

  /* ---------- The projector ---------- */
  const projector = new THREE.Group();
  projector.position.set(-1.7, 0, 1.5);
  projector.rotation.y = 0.66;
  scene.add(projector);

  // Housing: a two-part shell with a shadow line between, a recessed deck and rubber feet.
  {
    const lower = mesh(rbox(BODY_W - 0.08, 0.42, BODY_D - 0.08, 0.08), lowerMat);
    lower.position.y = 0.31;
    const upper = mesh(rbox(BODY_W, 0.72, BODY_D, 0.12, 5), bodyMat);
    upper.position.y = 0.86;
    const deck = mesh(rbox(BODY_W - 0.26, 0.04, BODY_D - 0.26, 0.02, 2), deckMat);
    deck.position.y = 1.22;
    projector.add(lower, upper, deck);
    [[1.5, 1.42], [1.5, -1.42], [-1.5, 1.42], [-1.5, -1.42]].forEach(([x, z]) => {
      const foot = mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.12, 24), rubberMat);
      foot.position.set(x, 0.06, z);
      projector.add(foot);
    });
    const lip = mesh(new THREE.LatheGeometry([
      new THREE.Vector2(1.49, 0), new THREE.Vector2(1.49, 0.045), new THREE.Vector2(1.515, 0.062),
      new THREE.Vector2(1.585, 0.062), new THREE.Vector2(1.61, 0.045), new THREE.Vector2(1.61, 0),
    ], 128), trimMat);
    lip.position.set(TRAY_CX, DECK_TOP, 0);
    projector.add(lip);
    // The pointer that reads the slot number off the tray.
    const ptr = mesh(new THREE.ConeGeometry(0.04, 0.09, 3), new THREE.MeshStandardMaterial({ color: '#f3ead8', roughness: 0.5 }));
    ptr.rotation.x = -Math.PI / 2;
    ptr.position.set(TRAY_CX, DECK_TOP + 0.1, R_OUT + 0.09);
    projector.add(ptr);
  }

  // Side panel, facing the room: select bar, back/forward buttons, badge and vents.
  {
    const z = SIDE_Z;
    const bar = mesh(rbox(0.38, 0.11, 0.08, 0.03, 3), metalBar);
    bar.position.set(0.62, 1.04, z + 0.01);
    projector.add(bar);
    pickable(bar, 'select');
    pressable('select', bar, new THREE.Vector3(0, 0, -1), 0.03);
    [['prev', 1.12], ['next', 1.42]].forEach(([kind, x]) => {
      const ring = mesh(new THREE.CylinderGeometry(0.088, 0.088, 0.02, 32), trimMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, 0.72, z + 0.005);
      const btn = mesh(new THREE.CylinderGeometry(0.064, 0.066, 0.07, 32), buttonMat);
      btn.rotation.x = Math.PI / 2;
      btn.position.set(x, 0.72, z + 0.03);
      const hit = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), hitMat);
      hit.position.copy(btn.position);
      projector.add(ring, btn, hit);
      pickable(hit, kind);
      pressable(kind, btn, new THREE.Vector3(0, 0, -1), 0.025);
    });
    const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.1), new THREE.MeshStandardMaterial({
      transparent: true,
      roughness: 0.6,
      map: labelTex((g, w, h) => {
        g.clearRect(0, 0, w, h);
        g.fillStyle = 'rgba(205,200,190,0.9)';
        g.font = '600 46px "Helvetica Neue", Arial, sans-serif';
        g.textBaseline = 'middle';
        g.textAlign = 'center';
        g.fillText('◀ REV', w * 0.26, h / 2);
        g.fillText('FWD ▶', w * 0.74, h / 2);
      }),
    }));
    lbl.position.set(1.27, 0.57, z + 0.002);
    projector.add(lbl);
    const badge = mesh(new THREE.BoxGeometry(1.1, 0.14, 0.012), [metalBar, metalBar, metalBar, metalBar, plateMat('SLIDE PROJECTOR', 1024), metalBar]);
    badge.position.set(-0.32, 0.96, z + 0.006);
    projector.add(badge);
    for (let i = 0; i < 8; i += 1) {
      const v = mesh(rbox(0.04, 0.34, 0.03, 0.012, 2), ventMat, { cast: false });
      v.position.set(-1.62 + i * 0.085, 0.8, z + 0.002);
      projector.add(v);
    }
    for (let i = 0; i < 13; i += 1) {
      const v = mesh(rbox(0.03, 0.36, 0.04, 0.012, 2), ventMat, { cast: false });
      v.position.set(-FRONT_X - 0.002, 0.82, -1.0 + i * 0.12);
      projector.add(v);
    }
  }

  // Lamp knob: black skirt, brushed silver cap and an indicator line.
  const knob = new THREE.Group();
  {
    knob.position.set(1.5, DECK_TOP, 1.42);
    const skirt = mesh(new THREE.CylinderGeometry(0.2, 0.21, 0.1, 48), trimMat);
    skirt.position.y = 0.05;
    const cap = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.06, 64), [metalSide, metalTop, metalTop]);
    cap.position.y = 0.13;
    const tick = mesh(new THREE.BoxGeometry(0.11, 0.006, 0.018), rubberMat, { cast: false });
    tick.position.set(0.05, 0.162, 0);
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.3, 16), hitMat);
    hit.position.y = 0.12;
    knob.add(skirt, cap, tick, hit);
    projector.add(knob);
    pickable(hit, 'lamp');
  }

  // Lens: mount, barrel, knurled focus ring and a coated front element.
  const lens = new THREE.Group();
  let lensGlow;
  {
    lens.position.set(FRONT_X, LENS_Y, LENS_Z);
    projector.add(lens);
    const boss = mesh(rbox(0.16, 0.84, 0.84, 0.07, 3), bodyMat);
    boss.position.x = 0.04;
    lens.add(boss);
    const cyl = (r1, r2, len, mat, x, seg = 56) => {
      const m = mesh(new THREE.CylinderGeometry(r2, r1, len, seg, 1, false), mat);
      m.rotation.z = -Math.PI / 2;
      m.position.x = x + len / 2;
      lens.add(m);
      return m;
    };
    cyl(0.36, 0.36, 0.14, trimMat, 0.1);
    cyl(0.3, 0.3, 0.5, barrelMat, 0.24);
    const ring = cyl(0.336, 0.336, 0.27, knurlMat, 0.4, 96);
    cyl(0.31, 0.325, 0.24, barrelMat, 0.74);
    const bezel = mesh(new THREE.TorusGeometry(0.288, 0.036, 16, 64), trimMat);
    bezel.rotation.y = Math.PI / 2;
    bezel.position.x = 0.98;
    const glass = mesh(new THREE.CircleGeometry(0.262, 64), glassMat, { cast: false });
    glass.rotation.y = Math.PI / 2;
    glass.position.x = 0.965;
    lens.add(bezel, glass);
    pickable(ring, 'focus');
    lensGlow = new THREE.Sprite(new THREE.SpriteMaterial(additive({ map: glowTex(), color: new THREE.Color(0, 0, 0) })));
    lensGlow.scale.setScalar(1.5);
    lensGlow.position.x = 1.02;
    lens.add(lensGlow);
  }

  // Carrying handle on the front.
  {
    [-0.38, -1.32].forEach((z) => {
      const s = mesh(rbox(0.24, 0.12, 0.11, 0.035, 3), trimMat);
      s.position.set(FRONT_X + 0.1, 0.86, z);
      projector.add(s);
    });
    const bar = mesh(rbox(0.09, 0.12, 1.06, 0.04, 3), trimMat);
    bar.position.set(FRONT_X + 0.2, 0.86, -0.85);
    projector.add(bar);
  }

  /* ---------- The tray: wedge fins, slides, number band and locking ring ---------- */
  const tray = new THREE.Group();
  tray.position.set(TRAY_CX, DECK_TOP + 0.005, 0);
  projector.add(tray);
  const wedge = (r0, r1, w0, w1, h) => {
    const s = new THREE.Shape();
    s.moveTo(r0, -w0 / 2);
    s.lineTo(r1, -w1 / 2);
    s.lineTo(r1, w1 / 2);
    s.lineTo(r0, w0 / 2);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 1 });
    g.rotateX(-Math.PI / 2);
    return g;
  };
  const slideMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(SLIDE, SLIDE, SLIDE_T), slideMat, SLOTS);
  {
    const base = mesh(new THREE.CylinderGeometry(1.47, 1.47, BASE_H, 128), trayMat);
    base.position.y = BASE_H / 2;
    const band = mesh(new THREE.CylinderGeometry(1.478, 1.478, 0.14, 280, 1, true), bandMat);
    band.position.y = 0.07;
    const wall = mesh(new THREE.CylinderGeometry(R_IN, R_IN, FIN_H, 96, 1, true), trayWallMat);
    wall.position.y = BASE_H + FIN_H / 2;
    const well = mesh(new THREE.CircleGeometry(R_IN, 64), wellMat);
    well.rotation.x = -Math.PI / 2;
    well.position.y = BASE_H + 0.002;
    const spindle = mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.18, 32), trimMat);
    spindle.position.y = BASE_H + 0.09;
    tray.add(base, band, wall, well, spindle);

    const fins = new THREE.InstancedMesh(
      wedge(R_IN - 0.01, R_OUT, (R_IN - 0.01) * ALPHA - GAP * 0.55, R_OUT * ALPHA - GAP, FIN_H), trayMat, SLOTS,
    );
    const m = new THREE.Matrix4();
    for (let j = 0; j < SLOTS; j += 1) {
      m.makeRotationY(-(j + 0.5) * ALPHA);
      m.setPosition(0, BASE_H, 0);
      fins.setMatrixAt(j, m);
    }
    fins.castShadow = fins.receiveShadow = true;
    tray.add(fins);

    // Slot 0 is solid: no slide goes there.
    const zero = mesh(wedge(R_IN, R_OUT, R_IN * ALPHA, R_OUT * ALPHA, FIN_H + 0.01), zeroMat);
    zero.position.y = BASE_H;
    tray.add(zero);

    const lock = mesh(new THREE.LatheGeometry([
      new THREE.Vector2(0.52, -0.3), new THREE.Vector2(0.52, 0.06), new THREE.Vector2(0.56, 0.1),
      new THREE.Vector2(0.86, 0.1), new THREE.Vector2(0.9, 0.06), new THREE.Vector2(0.9, 0.0),
      new THREE.Vector2(0.6, 0.0), new THREE.Vector2(0.6, -0.3),
    ], 128), trimMat);
    lock.position.y = BASE_H + FIN_H;
    tray.add(lock);

    slideMesh.castShadow = slideMesh.receiveShadow = true;
    tray.add(slideMesh);

    const hit = new THREE.Mesh(new THREE.CylinderGeometry(1.52, 1.52, 0.8, 48), hitMat);
    hit.position.y = 0.4;
    tray.add(hit);
    pickable(hit, 'tray');
  }
  // Place slot i's slide: `loaded` shows its mount, `drop` (0–1) is how far it has sunk into the gate.
  const slotMatrix = new THREE.Matrix4();
  const slotQuat = new THREE.Quaternion();
  const slotPos = new THREE.Vector3();
  const slotScale = new THREE.Vector3();
  const setSlot = (i, loaded, drop = 0) => {
    const phi = -i * ALPHA;
    slotPos.set(SLIDE_RC * Math.cos(phi), SLIDE_Y - drop * DROP_DEPTH, -SLIDE_RC * Math.sin(phi));
    slotQuat.setFromAxisAngle(Y, phi);
    slotScale.setScalar(loaded ? 1 : 0);
    slideMesh.setMatrixAt(i, slotMatrix.compose(slotPos, slotQuat, slotScale));
    slideMesh.instanceMatrix.needsUpdate = true;
  };
  tray.rotation.y = trayAngle(0);

  // Lamp light spilling up through the gate into the tray.
  const gateLight = new THREE.PointLight(0xffa54f, 0, 1.4, 2);
  gateLight.position.set(TRAY_CX, DECK_TOP + 0.38, SLIDE_RC);
  projector.add(gateLight);

  // Remote on its cord, and the mains lead running off the table.
  {
    const remote = new THREE.Group();
    remote.position.set(-2.95, 0, 2.2);
    remote.rotation.y = -0.74;
    projector.add(remote);
    const body = mesh(rbox(0.5, 0.17, 1.02, 0.07, 4), new THREE.MeshStandardMaterial({
      color: '#1b1a19', roughness: 0.55, bumpMap: surfBody, bumpScale: 0.3, envMapIntensity: 0.7,
    }));
    body.position.y = 0.085;
    remote.add(body);
    [['prev', -0.115], ['next', 0.115]].forEach(([kind, x]) => {
      const b = mesh(rbox(0.17, 0.07, 0.24, 0.03, 3), buttonMat);
      b.position.set(x, 0.18, -0.2);
      const hit = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.32), hitMat);
      hit.position.copy(b.position);
      remote.add(b, hit);
      pickable(hit, kind);
      pressable(kind, b, new THREE.Vector3(0, -1, 0), 0.03);
    });
    const rocker = mesh(rbox(0.12, 0.05, 0.2, 0.025, 3), trimMat);
    rocker.position.set(0, 0.175, 0.17);
    remote.add(rocker);
    const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.1), new THREE.MeshStandardMaterial({
      transparent: true,
      roughness: 0.6,
      map: labelTex((g, w, h) => {
        g.clearRect(0, 0, w, h);
        g.fillStyle = 'rgba(205,200,190,0.85)';
        g.font = '700 60px "Helvetica Neue", Arial, sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText('◀', w * 0.22, h / 2);
        g.fillText('▶', w * 0.78, h / 2);
      }),
    }));
    lbl.rotation.x = -Math.PI / 2;
    lbl.position.set(0, 0.172, 0);
    remote.add(lbl);
    remote.updateMatrix();
    const start = new THREE.Vector3(0, 0.07, -0.53).applyMatrix4(remote.matrix);
    const socket = new THREE.Vector3(-FRONT_X - 0.05, 0.3, 0.95);
    const cord = new THREE.CatmullRomCurve3([
      start, start.clone().add(new THREE.Vector3(0.12, -0.04, -0.25)),
      new THREE.Vector3(-2.35, 0.024, 1.55), new THREE.Vector3(-2.2, 0.024, 1.1),
      new THREE.Vector3(-2.02, 0.08, 0.96), socket,
    ]);
    projector.add(mesh(new THREE.TubeGeometry(cord, 120, 0.022, 10), cordMat));
    // The mains lead runs to a small power strip on the floor, so it ends in shot rather than
    // trailing off the edge of the page.
    const strip = new THREE.Group();
    strip.position.set(-2.75, 0, -2.05);
    strip.rotation.y = 0.5;
    projector.add(strip);
    const stripBody = mesh(rbox(0.36, 0.13, 0.92, 0.05, 4), bodyMat);
    stripBody.position.y = 0.065;
    strip.add(stripBody);
    [-0.2, 0.12].forEach((z) => {
      const socket = mesh(rbox(0.2, 0.012, 0.2, 0.03, 2), trimMat, { cast: false });
      socket.position.set(0, 0.132, z);
      strip.add(socket);
    });
    const plug = mesh(rbox(0.16, 0.1, 0.16, 0.03, 3), trimMat);
    plug.position.set(0, 0.18, 0.12);
    strip.add(plug);
    const stripSwitch = mesh(rbox(0.12, 0.04, 0.09, 0.015, 2), new THREE.MeshStandardMaterial({ color: '#b8322a', roughness: 0.4 }));
    stripSwitch.position.set(0, 0.145, -0.38);
    strip.add(stripSwitch);
    strip.updateMatrix();
    const plugTop = new THREE.Vector3(0, 0.22, 0.12).applyMatrix4(strip.matrix);
    const mains = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-FRONT_X - 0.05, 0.26, -1.1), new THREE.Vector3(-2.05, 0.06, -1.2),
      new THREE.Vector3(-2.3, 0.026, -1.55), new THREE.Vector3(-2.2, 0.026, -2.05),
      plugTop.clone().add(new THREE.Vector3(0.05, 0.06, 0.08)), plugTop,
    ]);
    projector.add(mesh(new THREE.TubeGeometry(mains, 120, 0.026, 10), cordMat));
    [0.95, -1.1].forEach((z) => {
      const relief = mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.12, 20), trimMat);
      relief.rotation.z = Math.PI / 2;
      relief.position.set(-FRONT_X - 0.05, z > 0 ? 0.3 : 0.26, z);
      projector.add(relief);
    });
  }

  /* ---------- Where the picture lands ---------- */
  projector.updateMatrixWorld(true);
  const lensTip = projector.localToWorld(new THREE.Vector3(FRONT_X + 1.0, LENS_Y, LENS_Z));
  const dirFlat = new THREE.Vector3(1, 0, 0).applyAxisAngle(Y, projector.rotation.y);
  // Picture height that puts the screen case's slot at SLOT_H once the cloth leans square to the beam.
  let picY = SLOT_H + B_BOT + IMG_H / 2;
  for (let i = 0; i < 4; i += 1) picY = SLOT_H + (B_BOT + IMG_H / 2) * Math.cos(Math.atan2(picY - LENS_Y, THROW + 0.5));
  const screenCenter = lensTip.clone().addScaledVector(dirFlat, THROW).setY(picY);
  const apex = lensTip.clone().addScaledVector(dirFlat, -0.5);
  const uDir = screenCenter.clone().sub(apex).normalize();

  const projCam = new THREE.PerspectiveCamera(1, 1.5, 0.05, 50);
  projCam.position.copy(apex);
  projCam.lookAt(screenCenter);
  projCam.fov = THREE.MathUtils.radToDeg(2 * Math.atan(IMG_H / 2 / apex.distanceTo(screenCenter)));
  projCam.updateProjectionMatrix();
  projCam.updateMatrixWorld(true);

  // Shared by the screen, the beam and the dust.
  const P = {
    uSlide: { value: null },
    uProj: { value: new THREE.Matrix4().multiplyMatrices(projCam.projectionMatrix, projCam.matrixWorldInverse) },
    uLamp: { value: 0 },
    uShutter: { value: 1 },
    uBlur: { value: 0 },
    uEmpty: { value: 1 },
    uWhite: { value: new THREE.Color(1, 0.93, 0.82) },
    uTime: { value: 0 },
    uBeam: { value: 0 },
    uApex: { value: apex.clone() },
    uDir: { value: uDir.clone() },
    uThrow: { value: apex.distanceTo(screenCenter) },
    uPR: { value: renderer.getPixelRatio() },
  };

  const fabricMap = screenFabricTex({
    width: FAB_W, height: FAB_H, view: { width: IMG_W, height: IMG_H }, border: { top: B_TOP, bottom: B_BOT },
  });
  const screenMat = new THREE.MeshStandardMaterial({
    map: fabricMap, bumpMap: weaveTex([FAB_W * 14, FAB_H * 14]), bumpScale: 0.1, roughness: 0.96, envMapIntensity: 0.25,
    emissive: '#ffffff', emissiveMap: fabricMap, emissiveIntensity: 0.55,
  });
  // The slide is projected onto the cloth and reflected by its colour, so any overspill dies on the border.
  screenMat.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, P, { uGain: { value: 2.5 } });
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nuniform mat4 uProj;\nvarying vec4 vPC;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvPC = uProj * modelMatrix * vec4(transformed, 1.0);');
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>
uniform sampler2D uSlide; uniform float uLamp, uShutter, uBlur, uEmpty, uGain; uniform vec3 uWhite; varying vec4 vPC;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{
  vec2 q = vPC.xy / vPC.w; vec2 puv = q * 0.5 + 0.5;
  vec2 e = smoothstep(vec2(0.0), vec2(0.004), puv) * smoothstep(vec2(0.0), vec2(0.004), 1.0 - puv);
  float m = e.x * e.y * step(0.0, vPC.w);
  vec3 img = mix(texture2D(uSlide, puv, uBlur).rgb, vec3(1.0), uEmpty);
  float vig = 1.0 - 0.3 * dot(q, q) * 0.5;
  totalEmissiveRadiance += img * uWhite * m * vig * uLamp * uShutter * uGain * (diffuseColor.rgb / 0.9);
}`);
  };

  /* ---------- The tripod screen ---------- */
  // The cloth pulls up out of its carry case to a top bar held by a keystone arm, which leans it
  // square to the beam so the picture stays rectangular.
  const tilt = Math.asin(uDir.y);
  const fabricUp = Y.clone().addScaledVector(uDir, -uDir.y).normalize();
  const slotPt = screenCenter.clone().addScaledVector(fabricUp, -(B_BOT + IMG_H / 2));
  const SLOT_Y = slotPt.y;
  const CASE_Y = SLOT_Y - CASE_H / 2 + 0.012;
  const TOPBAR_Y = SLOT_Y + (FAB_H + 0.01) * Math.cos(tilt);
  const TOPBAR_Z = (FAB_H + 0.01) * Math.sin(tilt);
  const ARM_Y = TOPBAR_Y + 0.14;
  const POLE_TOP = ARM_Y + 0.05;
  const HUB_Y = CASE_Y - CASE_H / 2 - 0.13;
  const COLLAR_Y = SLOT_Y + FAB_H * 0.36;
  const screen = new THREE.Group();
  {
    screen.position.set(slotPt.x, 0, slotPt.z);
    screen.lookAt(apex.x, 0, apex.z);
    scene.add(screen);
    const poleMat = new THREE.MeshStandardMaterial({ color: '#1b1a19', roughness: 0.36, metalness: 0.55, envMapIntensity: 0.9 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: '#d4d4d0', roughness: 0.2, metalness: 1, envMapIntensity: 1.3 });
    const add = (m, x, y, z, parent = screen) => {
      m.position.set(x, y, z);
      parent.add(m);
      return m;
    };
    const tube = (r, y0, y1, mat, seg = 24) => add(mesh(new THREE.CylinderGeometry(r, r, y1 - y0, seg), mat), 0, (y0 + y1) / 2, POLE_Z);
    const sideCyl = (r, len, mats) => {
      const m = mesh(new THREE.CylinderGeometry(r, r, len, 32), mats);
      m.rotation.z = Math.PI / 2;
      return m;
    };

    // The cloth hinges at the case slot and leans toward the projector; its side edges curl back a touch.
    const cloth = new THREE.Group();
    cloth.position.set(0, SLOT_Y, 0);
    cloth.rotation.x = tilt;
    screen.add(cloth);
    const fg = new THREE.PlaneGeometry(FAB_W, FAB_H, 64, 1);
    fg.translate(0, FAB_H / 2, 0);
    const fp = fg.attributes.position;
    for (let i = 0; i < fp.count; i += 1) fp.setZ(i, -0.022 * (Math.abs(fp.getX(i)) / (FAB_W / 2)) ** 10);
    fg.computeVertexNormals();
    cloth.add(mesh(fg, screenMat), mesh(fg, new THREE.MeshStandardMaterial({ color: '#9d988f', roughness: 0.8, side: THREE.BackSide })));
    add(mesh(rbox(FAB_W + 0.1, 0.075, 0.075, 0.03, 3), trimMat), 0, FAB_H + 0.01, 0, cloth);
    [-1, 1].forEach((s) => add(sideCyl(0.044, 0.05, [metalBar, metalTop, metalTop]), s * (FAB_W / 2 + 0.075), FAB_H + 0.01, 0, cloth));

    // Carry case, in the projector's own plastic.
    add(mesh(rbox(CASE_W, CASE_H, CASE_D, 0.05, 5), bodyMat), 0, CASE_Y, 0);
    add(mesh(rbox(FAB_W + 0.08, 0.022, 0.06, 0.009, 2), trimMat), 0, SLOT_Y + 0.004, 0);
    [-1, 1].forEach((s) => {
      add(mesh(rbox(0.1, CASE_H + 0.03, CASE_D + 0.03, 0.045, 4), trimMat), s * (CASE_W / 2 + 0.02), CASE_Y, 0);
      add(sideCyl(0.05, 0.016, [metalBar, metalTop, metalTop]), s * (CASE_W / 2 + 0.076), CASE_Y, 0);
    });
    add(mesh(new THREE.BoxGeometry(1.0, 0.1, 0.012), [metalBar, metalBar, metalBar, metalBar, plateMat('PROJECTION SCREEN', 1280), metalBar]), 0, CASE_Y, CASE_D / 2 + 0.004);

    // Telescoping pole: satin black below, chrome above, a silver lock knob at the joint.
    tube(0.03, HUB_Y - 0.06, COLLAR_Y, poleMat);
    tube(0.021, COLLAR_Y, POLE_TOP, chromeMat);
    tube(0.044, COLLAR_Y - 0.05, COLLAR_Y + 0.05, trimMat);
    add(sideCyl(0.012, 0.04, trimMat), 0.06, COLLAR_Y, POLE_Z);
    add(sideCyl(0.036, 0.036, [metalSide, metalTop, metalTop]), 0.095, COLLAR_Y, POLE_Z);
    add(mesh(new THREE.SphereGeometry(0.03, 16, 12), trimMat), 0, POLE_TOP, POLE_Z);
    tube(0.05, CASE_Y - 0.08, CASE_Y + 0.08, trimMat);
    add(mesh(rbox(0.16, 0.12, 0.09, 0.02, 2), trimMat), 0, CASE_Y, (POLE_Z - CASE_D / 2) / 2);

    // Keystone arm and the hook holding the top bar.
    tube(0.036, ARM_Y - 0.045, ARM_Y + 0.045, trimMat);
    add(mesh(rbox(0.05, 0.05, TOPBAR_Z - POLE_Z + 0.05, 0.02, 2), trimMat), 0, ARM_Y, (TOPBAR_Z + POLE_Z) / 2);
    add(mesh(new THREE.BoxGeometry(0.028, ARM_Y - TOPBAR_Y, 0.028), chromeMat), 0, (ARM_Y + TOPBAR_Y) / 2, TOPBAR_Z);

    // Tripod: hub collar, three splayed legs with rubber tips.
    tube(0.055, HUB_Y - 0.06, HUB_Y + 0.06, trimMat);
    const hub = new THREE.Vector3(0, HUB_Y - 0.03, POLE_Z);
    [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6].forEach((a) => {
      const foot = new THREE.Vector3(Math.cos(a) * 1.0, 0.03, POLE_Z + Math.sin(a) * 1.0);
      const d = foot.clone().sub(hub);
      const leg = mesh(new THREE.CylinderGeometry(0.017, 0.017, d.length(), 12), poleMat);
      leg.position.copy(hub).addScaledVector(d, 0.5);
      leg.quaternion.setFromUnitVectors(Y, d.normalize());
      screen.add(leg);
      add(mesh(new THREE.SphereGeometry(0.032, 16, 10), rubberMat), foot.x, 0.026, foot.z).scale.y = 0.8;
    });
  }
  bounce.position.copy(screenCenter).addScaledVector(uDir, -0.15);
  bounce.lookAt(apex);

  /* ---------- The beam ---------- */
  // The back faces of the projection frustum, ray-marched toward the eye. Each sample looks the
  // slide up again, so the dusty air carries the picture's colours.
  const beamSpan = (sx, sy, toScreen) => {
    const n = uDir.clone().negate();
    const v = new THREE.Vector3(sx, sy, 0.5).unproject(projCam).sub(apex).normalize();
    const t = toScreen ? screenCenter.clone().sub(apex).dot(n) / v.dot(n) : 0.5 / v.dot(uDir);
    return apex.clone().addScaledVector(v, t);
  };
  {
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    const near = corners.map(([x, y]) => beamSpan(x, y, false));
    const far = corners.map(([x, y]) => beamSpan(x, y, true));
    const mid = apex.clone().lerp(screenCenter, 0.5);
    const pos = [];
    for (let i = 0; i < 4; i += 1) {
      const j = (i + 1) % 4;
      const quad = [near[i], near[j], far[j], far[i]];
      const nrm = new THREE.Vector3().crossVectors(quad[1].clone().sub(quad[0]), quad[3].clone().sub(quad[0]));
      const ctr = quad.reduce((a, b) => a.add(b), new THREE.Vector3()).multiplyScalar(0.25);
      if (nrm.dot(ctr.sub(mid)) < 0) quad.reverse();
      [0, 1, 2, 0, 2, 3].forEach((k) => pos.push(quad[k].x, quad[k].y, quad[k].z));
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const beam = new THREE.Mesh(geo, new THREE.ShaderMaterial(additive({
      side: THREE.BackSide,
      uniforms: P,
      vertexShader: `varying vec3 vW;
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `
uniform sampler2D uSlide; uniform mat4 uProj; uniform vec3 uWhite, uApex, uDir;
uniform float uLamp, uShutter, uEmpty, uTime, uBeam, uThrow;
varying vec3 vW;
float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
void main() {
  float k = uBeam * uLamp * uShutter;
  if (k < 0.001) discard;
  vec3 toCam = cameraPosition - vW; float maxL = length(toCam); vec3 rd = toCam / maxL;
  float along = clamp(dot(vW - uApex, uDir) / uThrow, 0.0, 1.0);
  float L = min(maxL, mix(0.3, 4.2, along) * 1.5);
  const int N = 40; float dl = L / float(N);
  float j = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  vec3 acc = vec3(0.0);
  for (int i = 0; i < N; i++) {
    vec3 p = vW + rd * (float(i) + j) * dl;
    vec4 c = uProj * vec4(p, 1.0);
    if (c.w <= 0.0) continue;
    vec2 uv = c.xy / c.w * 0.5 + 0.5;
    if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) continue;
    float t = dot(p - uApex, uDir) / uThrow;
    if (t < 0.07 || t > 1.0) continue;
    vec3 col = mix(textureLod(uSlide, uv, 4.0).rgb, vec3(1.0), uEmpty);
    float dust = 0.45 + 1.1 * noise(p * 2.4 + vec3(0.0, uTime * 0.12, uTime * 0.05));
    acc += col * dust * smoothstep(0.07, 0.12, t) / (0.2 + t * t * 5.0);
  }
  gl_FragColor = vec4(acc * dl * k * uWhite * 0.45, 0.0);
}`,
    })));
    beam.frustumCulled = false;
    scene.add(beam);
  }

  // Dust motes drifting through the light, lit in the picture's colours.
  {
    const N = 700;
    const pos = new Float32Array(N * 3);
    const seed = new Float32Array(N * 3);
    for (let i = 0; i < N; i += 1) {
      const end = beamSpan(rand() * 2 - 1, rand() * 2 - 1, true);
      const p = apex.clone().lerp(end, 0.1 + 0.88 * Math.cbrt(rand()));
      pos.set([p.x, p.y, p.z], i * 3);
      seed.set([rand(), rand(), rand()], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('seed', new THREE.BufferAttribute(seed, 3));
    const dust = new THREE.Points(geo, new THREE.ShaderMaterial(additive({
      uniforms: P,
      vertexShader: `
attribute vec3 seed; uniform sampler2D uSlide; uniform mat4 uProj; uniform vec3 uWhite, uApex;
uniform float uTime, uLamp, uShutter, uEmpty, uBeam, uPR; varying vec3 vC;
void main() {
  vec3 p = position + vec3(sin(uTime * 0.21 * (0.5 + seed.x) + seed.y * 40.0) * 0.09,
                           sin(uTime * 0.13 * (0.5 + seed.z) + seed.x * 30.0) * 0.12 + 0.05 * sin(uTime * 0.05 + seed.z * 9.0),
                           cos(uTime * 0.17 * (0.5 + seed.y) + seed.z * 50.0) * 0.09);
  vec4 c = uProj * vec4(p, 1.0); vec2 uv = c.xy / c.w * 0.5 + 0.5;
  float inside = step(0.0, c.w) * step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  vec3 col = mix(textureLod(uSlide, clamp(uv, 0.0, 1.0), 3.0).rgb, vec3(1.0), uEmpty);
  float tw = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * (0.8 + seed.y * 2.0) + seed.z * 40.0), 3.0);
  float d = distance(p, uApex);
  vC = col * uWhite * inside * tw * uLamp * uShutter * uBeam * 1.6 / (0.5 + d * 0.35);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (2.0 + seed.x * 3.0) * uPR * 16.0 / -mv.z;
}`,
      fragmentShader: `varying vec3 vC;
void main() { float r = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vC * smoothstep(0.5, 0.0, r), 0.0); }`,
    })));
    dust.frustumCulled = false;
    scene.add(dust);
  }

  /* ---------- Framing ---------- */
  // Points that must stay in shot: the projector's body and lens, its remote, and the screen
  // from the top of its pole down to the case (the tripod's feet may crop).
  screen.updateMatrixWorld(true);
  const framePoints = [];
  const box = (obj, xs, ys, zs) => xs.forEach((x) => ys.forEach((y) => zs.forEach((z) => {
    framePoints.push(obj.localToWorld(new THREE.Vector3(x, y, z)));
  })));
  box(projector, [-FRONT_X - 0.1, FRONT_X + 1.05], [0, DECK_TOP + 0.74], [-SIDE_Z - 0.05, SIDE_Z + 0.05]);
  box(projector, [-3.3, -2.6], [0, 0.2], [1.75, 2.65]);
  box(projector, [-3.1, -2.4], [0, 0.25], [-2.6, -1.5]);
  box(screen, [-CASE_W / 2 - 0.1, CASE_W / 2 + 0.1], [CASE_Y - 0.25, POLE_TOP + 0.05], [POLE_Z, TOPBAR_Z]);
  const projectorCenter = projector.localToWorld(new THREE.Vector3(0.2, 0.9, 0.3));
  const sceneCenter = projectorCenter.clone().lerp(screenCenter, 0.5);
  key.target.position.copy(sceneCenter);
  key.position.copy(sceneCenter).add(new THREE.Vector3(4, 7, 6));
  rectLight.position.copy(projectorCenter).add(new THREE.Vector3(0, 4.2, 3));
  rectLight.lookAt(projectorCenter.x, projectorCenter.y - 0.4, projectorCenter.z);

  return {
    scene,
    lights: { amb, key, rectLight, bounce, gateLight },
    floor,
    projector,
    tray,
    knob,
    lens,
    lensGlow,
    glassMat,
    ventMat,
    screenMat,
    uniforms: P,
    dirFlat,
    framePoints,
    pickables,
    pressables,
    setSlot,
  };
}

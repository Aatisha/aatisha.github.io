// Textures for the slide projector, all drawn on canvases at load: aged moulded plastic, scuffs,
// brushed metal, knurling, the tray's printed slot numbers, the screen cloth, and each photo turned
// into an old 35 mm slide.
import * as THREE from 'three';

export const TAU = Math.PI * 2;

// Seeded random, so the plastic's speckle and scuffs come out the same on every visit.
export function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const rand = mulberry32(1974);

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

export function toTex(canvas, { srgb = true, repeat = null, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  t.anisotropy = aniso;
  return t;
}

export function lgrad(g, x0, y0, x1, y1, stops) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([o, c]) => gr.addColorStop(o, c));
  return gr;
}

// Injection-moulded plastic: flat colour, soft yellowing blotches and a fine speckle.
export function plasticAlbedo(base, {
  speck = 900, blotch = '172,140,74', blotchAmt = 0.035, speckRGB = '100,90,64', speckA = [0.035, 0.11], repeat = [2, 2],
} = {}) {
  const S = 256;
  const [c, g] = makeCanvas(S, S);
  g.fillStyle = base;
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 16; i += 1) {
    const x = rand() * S;
    const y = rand() * S;
    const r = 45 + rand() * 70;
    const a = 0.012 + rand() * blotchAmt;
    for (const ox of [-S, 0, S]) {
      for (const oy of [-S, 0, S]) {
        const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
        gr.addColorStop(0, `rgba(${blotch},${a})`);
        gr.addColorStop(1, `rgba(${blotch},0)`);
        g.fillStyle = gr;
        g.beginPath();
        g.arc(x + ox, y + oy, r, 0, TAU);
        g.fill();
      }
    }
  }
  for (let i = 0; i < speck; i += 1) {
    g.fillStyle = `rgba(${speckRGB},${speckA[0] + rand() * (speckA[1] - speckA[0])})`;
    g.beginPath();
    g.arc(rand() * S, rand() * S, 0.3 + rand() * 1.1, 0, TAU);
    g.fill();
  }
  return toTex(c, { repeat });
}

// One map for both bump and roughness: grain, a moulded stipple and hairline scuffs.
export function surfaceMap({ stipple = 0, scratches = 420, repeat = [2, 2] } = {}) {
  const S = 512;
  const [c, g] = makeCanvas(S, S);
  g.fillStyle = 'rgb(199,199,199)';
  g.fillRect(0, 0, S, S);
  const [n, ng] = makeCanvas(256, 256);
  const id = ng.createImageData(256, 256);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = 199 + (rand() - 0.5) * 22;
    id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
    id.data[i + 3] = 255;
  }
  ng.putImageData(id, 0, 0);
  g.globalAlpha = 0.45;
  g.drawImage(n, 0, 0, S, S);
  g.globalAlpha = 1;
  for (let i = 0; i < stipple; i += 1) {
    g.fillStyle = rand() < 0.5 ? 'rgba(255,255,255,0.16)' : 'rgba(60,60,60,0.16)';
    g.beginPath();
    g.arc(rand() * S, rand() * S, 0.8 + rand() * 1.7, 0, TAU);
    g.fill();
  }
  g.lineCap = 'round';
  const line = (len, spread, w, a) => {
    const x = rand() * S;
    const y = rand() * S;
    const ang = (rand() - 0.5) * spread;
    const dx = Math.cos(ang) * len;
    const dy = Math.sin(ang) * len;
    g.lineWidth = w;
    g.strokeStyle = `rgba(${rand() < 0.55 ? '255,255,255' : '90,90,90'},${a})`;
    for (const [ox, oy] of [[0, 0], [-S, 0], [0, -S], [-S, -S]]) {
      g.beginPath();
      g.moveTo(x + ox, y + oy);
      g.lineTo(x + dx + ox, y + dy + oy);
      g.stroke();
    }
  };
  for (let i = 0; i < scratches; i += 1) line(14 + rand() * 90, 0.5, 0.9 + rand() * 0.9, 0.14 + rand() * 0.34);
  for (let i = 0; i < scratches * 0.1; i += 1) line(120 + rand() * 320, 0.22, 1.2, 0.08 + rand() * 0.2);
  for (let i = 0; i < 16; i += 1) line(5 + rand() * 20, 2.4, 2.2, 0.25 + rand() * 0.3);
  return toTex(c, { srgb: false, repeat });
}

// Slot numbers printed round the base of the tray; they count up to the left, as on the real one.
export function numberBandTex(slots) {
  const W = 8192;
  const H = 128;
  const [c, g] = makeCanvas(W, H);
  g.fillStyle = '#a69d8d';
  g.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 3) {
    if (rand() < 0.25) {
      g.fillStyle = `rgba(0,0,0,${0.03 + rand() * 0.04})`;
      g.fillRect(x, 0, 1, H);
    }
  }
  g.fillStyle = '#2d2a25';
  g.font = '600 50px "Helvetica Neue", Helvetica, Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (let i = 0; i < slots; i += 1) {
    const x = ((((0.25 - i / slots) % 1) + 1) % 1) * W;
    g.fillRect(x - 1.5, 4, 3, i % 2 === 0 ? 18 : 10);
    if (i % 2 === 0 && i > 0) for (const ox of [-W, 0, W]) g.fillText(String(i), x + ox, 74);
  }
  const t = toTex(c, { aniso: 16 });
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

// The card mount of a slide sitting in the tray.
export function mountTex() {
  const S = 256;
  const [c, g] = makeCanvas(S, S);
  g.fillStyle = '#efe8da';
  g.fillRect(0, 0, S, S);
  const ww = 184;
  const wh = 123;
  const x0 = (S - ww) / 2;
  const y0 = (S - wh) / 2;
  g.fillStyle = lgrad(g, 0, y0, 0, y0 + wh, [[0, '#5a3d2c'], [1, '#22263a']]);
  g.fillRect(x0, y0, ww, wh);
  g.fillStyle = 'rgba(60,50,40,0.55)';
  g.font = '600 12px Helvetica, Arial, sans-serif';
  g.fillText('PROCESSED', 36, 46);
  g.fillText('35 mm', 180, 224);
  g.strokeStyle = 'rgba(0,0,0,0.12)';
  g.lineWidth = 4;
  g.strokeRect(3, 3, S - 6, S - 6);
  return toTex(c);
}

export function brushedDiscTex() {
  const S = 256;
  const [c, g] = makeCanvas(S, S);
  g.fillStyle = '#bdbdb9';
  g.fillRect(0, 0, S, S);
  for (let r = 2; r < S * 0.72; r += 1) {
    const v = (160 + rand() * 80) | 0;
    g.strokeStyle = `rgba(${v},${v},${v},0.55)`;
    g.lineWidth = 1;
    g.beginPath();
    g.arc(S / 2, S / 2, r, 0, TAU);
    g.stroke();
  }
  return toTex(c, { aniso: 16 });
}

export function brushedLinearTex(w = 512, h = 128) {
  const [c, g] = makeCanvas(w, h);
  g.fillStyle = '#c4c3bf';
  g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 1) {
    const v = (165 + rand() * 70) | 0;
    g.fillStyle = `rgba(${v},${v},${v},0.5)`;
    g.fillRect(0, y, w, 1);
  }
  return [c, g];
}

export function knurlTex(ridges = 72) {
  const W = 512;
  const [c, g] = makeCanvas(W, 4);
  for (let x = 0; x < W; x += 1) {
    const v = (128 + 110 * Math.sin((x / W) * ridges * TAU)) | 0;
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.fillRect(x, 0, 1, 4);
  }
  const t = toTex(c, { srgb: false });
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

// Additive glows fade to solid black (not transparent) so their colour adds cleanly.
export function glowTex() {
  const S = 128;
  const [c, g] = makeCanvas(S, S);
  g.fillStyle = '#000';
  g.fillRect(0, 0, S, S);
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, '#fff');
  gr.addColorStop(0.15, 'rgb(150,150,150)');
  gr.addColorStop(0.35, 'rgb(46,46,46)');
  gr.addColorStop(0.65, 'rgb(8,8,8)');
  gr.addColorStop(1, '#000');
  g.fillStyle = gr;
  g.fillRect(0, 0, S, S);
  return toTex(c);
}

export function lensEmissiveTex() {
  const S = 256;
  const [c, g] = makeCanvas(S, S);
  g.fillStyle = '#000';
  g.fillRect(0, 0, S, S);
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, '#ffffff');
  gr.addColorStop(0.3, '#ffd9a8');
  gr.addColorStop(0.72, '#4a2d14');
  gr.addColorStop(1, '#000');
  g.fillStyle = gr;
  g.fillRect(0, 0, S, S);
  g.strokeStyle = 'rgba(255,225,180,0.45)';
  g.lineWidth = 3;
  for (const r of [50, 76, 98]) {
    g.beginPath();
    g.arc(S / 2, S / 2, r, 0, TAU);
    g.stroke();
  }
  return toTex(c);
}

export function labelTex(draw, w = 512, h = 128) {
  const [c, g] = makeCanvas(w, h);
  draw(g, w, h);
  return toTex(c, { aniso: 16 });
}

// A brushed-metal nameplate with stamped lettering.
export function nameplateTex(text, w = 1024) {
  const [c, g] = brushedLinearTex(w, 128);
  g.fillStyle = '#1d1c1a';
  g.font = '700 54px "Helvetica Neue", Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.letterSpacing = '22px';
  g.fillText(text, w / 2 + 11, 66);
  g.strokeStyle = 'rgba(0,0,0,0.35)';
  g.lineWidth = 6;
  g.strokeRect(3, 3, w - 6, 122);
  return toTex(c);
}

// Screen cloth: a matte white viewing area inside a black masking border, a stitched hem and a
// sewn-in label. Sizes are in scene units; `view` is the white area, `border` the black margins.
export function screenFabricTex({ width, height, view, border }) {
  const W = 2048;
  const H = Math.round((W * height) / width);
  const k = W / width;
  const [c, g] = makeCanvas(W, H);
  g.fillStyle = '#161514';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i += 1) {
    const x = rand() * W;
    const y = rand() * H;
    const r = 60 + rand() * 220;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(255,255,255,${0.01 + rand() * 0.018})`);
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // A hair smaller than the picture, so the border crops the slide's edge crisply.
  const vw = view.width * 0.99 * k;
  const vh = view.height * 0.985 * k;
  const vx = (W - vw) / 2;
  const vy = (border.top + view.height * 0.0075) * k;
  g.fillStyle = lgrad(g, 0, vy, 0, vy + vh, [[0, '#f7f4ee'], [0.7, '#f3efe7'], [1, '#ece6da']]);
  g.fillRect(vx, vy, vw, vh);
  g.save();
  g.beginPath();
  g.rect(vx, vy, vw, vh);
  g.clip();
  for (let i = 0; i < 70; i += 1) {
    const x = vx + rand() * vw;
    const y = vy + rand() * vh;
    const r = 50 + rand() * 180;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(170,150,112,${0.008 + rand() * 0.016})`);
    gr.addColorStop(1, 'rgba(170,150,112,0)');
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.restore();
  g.strokeStyle = 'rgba(0,0,0,0.18)';
  g.lineWidth = 2;
  g.strokeRect(vx, vy, vw, vh);
  const hem = 0.04 * k;
  g.setLineDash([12, 9]);
  g.strokeStyle = 'rgba(255,255,255,0.1)';
  g.lineWidth = 2.5;
  g.strokeRect(hem, hem, W - hem * 2, H - hem * 2);
  g.setLineDash([]);
  const lw = 0.36 * k;
  const lh = 0.07 * k;
  const lx = W - hem * 2.2 - lw;
  const ly = H - (border.bottom * k + lh) / 2;
  g.fillStyle = '#27251f';
  g.fillRect(lx, ly, lw, lh);
  g.strokeStyle = 'rgba(255,255,255,0.12)';
  g.lineWidth = 2;
  g.strokeRect(lx + 4, ly + 4, lw - 8, lh - 8);
  g.fillStyle = 'rgba(214,206,190,0.75)';
  g.font = `600 ${Math.round(lh * 0.46)}px "Helvetica Neue", Arial, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.letterSpacing = `${Math.round(lh * 0.12)}px`;
  g.fillText('MATTE WHITE', lx + lw / 2, ly + lh / 2 + 1);
  return toTex(c, { aniso: 16 });
}

// Plain-weave relief for the screen cloth.
export function weaveTex(repeat) {
  const S = 128;
  const [c, g] = makeCanvas(S, S);
  const id = g.createImageData(S, S);
  for (let y = 0; y < S; y += 1) {
    for (let x = 0; x < S; x += 1) {
      const over = ((x >> 2) + (y >> 2)) & 1;
      const ph = ((over ? y : x) % 4) / 4;
      const v = 128 + 46 * Math.sin(ph * Math.PI) * (over ? 1 : 0.8) + (rand() - 0.5) * 26;
      const i = (y * S + x) * 4;
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
      id.data[i + 3] = 255;
    }
  }
  g.putImageData(id, 0, 0);
  return toTex(c, { srgb: false, repeat });
}

/* ---------- Photos as old slides ---------- */
// A 35 mm frame is 3:2. Landscape photos fill it; portrait ones sit in an upright 2:3 window, and
// the card mount around that window stops the light, so they project tall with dark either side.
export const SLIDE_W = 960;
export const SLIDE_H = 640;

let grainCanvas = null;
function grain() {
  if (grainCanvas) return grainCanvas;
  const [c, g] = makeCanvas(256, 256);
  const id = g.createImageData(256, 256);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = 128 + (rand() - 0.5) * 230;
    id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
    id.data[i + 3] = 255;
  }
  g.putImageData(id, 0, 0);
  grainCanvas = c;
  return c;
}

// How the dyes have aged on each slide.
const TINTS = {
  amber: (g, w, h) => {
    g.globalCompositeOperation = 'soft-light';
    g.fillStyle = 'rgba(255,170,100,0.3)';
    g.fillRect(0, 0, w, h);
  },
  rose: (g, w, h) => {
    g.globalCompositeOperation = 'soft-light';
    g.fillStyle = 'rgba(240,120,165,0.32)';
    g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,175,110,0.12)';
    g.fillRect(0, 0, w, h);
  },
  faded: (g, w, h) => {
    g.globalCompositeOperation = 'saturation';
    g.fillStyle = 'rgba(128,128,128,0.32)';
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'screen';
    g.fillStyle = 'rgba(52,46,40,0.4)';
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'soft-light';
    g.fillStyle = 'rgba(190,220,200,0.24)';
    g.fillRect(0, 0, w, h);
  },
};

// Kodachrome-ish: the dye tint, grain, a warm falloff at the edges, dust and the odd hair.
function filmLook(g, x, y, w, h, tint, r) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.translate(x, y);
  (TINTS[tint] || TINTS.amber)(g, w, h);
  g.globalCompositeOperation = 'overlay';
  g.globalAlpha = 0.14;
  g.fillStyle = g.createPattern(grain(), 'repeat');
  g.fillRect(0, 0, w, h);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'multiply';
  const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, '#fff');
  v.addColorStop(1, 'rgb(150,124,108)');
  g.fillStyle = v;
  g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 7; i += 1) {
    g.fillStyle = `rgba(20,15,10,${0.25 + r() * 0.45})`;
    g.beginPath();
    g.arc(r() * w, r() * h, 0.7 + r() * 1.8, 0, TAU);
    g.fill();
  }
  if (r() < 0.35) {
    const hx = r() * w;
    const hy = r() * h;
    const d = () => (r() - 0.5) * 200;
    g.strokeStyle = 'rgba(20,15,10,0.4)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(hx, hy);
    g.bezierCurveTo(hx + d(), hy + d(), hx + d(), hy + d(), hx + d(), hy + d());
    g.stroke();
  }
  g.restore();
}

// Turns a loaded <img> into a slide: { tex, avg } where avg is its average colour (the light it
// throws back into the room).
export function photoSlide(img, { tint = 'amber', tall = false, seed = 1 } = {}) {
  const [c, g] = makeCanvas(SLIDE_W, SLIDE_H);
  const r = mulberry32(seed);
  g.fillStyle = '#000';
  g.fillRect(0, 0, SLIDE_W, SLIDE_H);
  const fh = SLIDE_H;
  const fw = tall ? Math.round((SLIDE_H * 2) / 3) : SLIDE_W;
  const fx = (SLIDE_W - fw) / 2;
  const s = Math.max(fw / img.naturalWidth, fh / img.naturalHeight);
  const w = img.naturalWidth * s;
  const h = img.naturalHeight * s;
  g.save();
  g.beginPath();
  if (g.roundRect) g.roundRect(fx, 0, fw, fh, 10); else g.rect(fx, 0, fw, fh);
  g.clip();
  // Where the canvas filter isn't supported the tints below still age the picture.
  g.filter = 'sepia(0.22) saturate(0.88) contrast(1.05)';
  g.drawImage(img, fx + (fw - w) / 2, (fh - h) / 2, w, h);
  g.filter = 'none';
  g.restore();
  filmLook(g, fx, 0, fw, fh, tint, r);

  const tex = toTex(c, { aniso: 8 });
  const [, sg] = makeCanvas(1, 1);
  sg.drawImage(c, fx, 0, fw, fh, 0, 0, 1, 1);
  const [R, G, B] = sg.getImageData(0, 0, 1, 1).data;
  const avg = new THREE.Color().setRGB(R / 255, G / 255, B / 255, THREE.SRGBColorSpace);
  return { tex, avg };
}

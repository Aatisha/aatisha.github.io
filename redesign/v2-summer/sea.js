/* The always-summer sea: a WebGL shader of sunlit water with glinting "diamonds",
   plus a little Mediterranean foliage leaning into frame. Falls back to a CSS gradient. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const host = document.getElementById('sea');
  if (!host) return;

  /* ---------- optional real footage ---------- */
  const vid = window.DATA && window.DATA.summer && window.DATA.summer.oceanVideo;
  if (vid) {
    host.insertAdjacentHTML('afterbegin', `<video class="sea-video" src="${vid}" autoplay muted loop playsinline></video>`);
  } else {
    const canvas = document.createElement('canvas');
    canvas.className = 'sea-canvas';
    host.prepend(canvas);
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false, powerPreference: 'low-power' });
    if (!gl) host.classList.add('no-gl');
    else run(gl, canvas);
  }

  function run(gl, canvas) {
    const vs = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
    const fs = `
      precision highp float;
      uniform vec2 r; uniform float t; uniform vec2 m;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
        return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float v = 0., a = .5; for (int k = 0; k < 5; k++){ v += a*n(p); p = p*2.03 + vec2(1.7, 9.2); a *= .5; } return v; }
      void main(){
        vec2 uv = gl_FragCoord.xy / r;
        float asp = r.x / r.y;
        // a gentle perspective: ripples get smaller and denser toward the top
        float depth = mix(.85, 2.6, uv.y);
        vec2 q = vec2((uv.x - .5) * asp * depth * .9, uv.y * depth * 2.2);
        vec2 drift = vec2(t * .018, t * .05);
        float w  = fbm(q * 2.4 + drift);
        float w2 = fbm(q * 5.5 - drift * 1.4 + w * 1.6);
        // caustic bands where the light bends through the swell
        float band = pow(1. - abs(sin(w2 * 7. + t * .35)), 10.);
        vec3 deep  = vec3(.012, .38, .52);
        vec3 mid   = vec3(.03, .6, .7);
        vec3 shal  = vec3(.36, .84, .82);
        vec3 col = mix(deep, mid, smoothstep(.25, .75, w));
        col = mix(col, shal, band * .38 + smoothstep(.55, .9, w2) * .25);
        // warm light falling from the upper right, where the sun is
        float sunX = .72 * asp, sunUV = (uv.x - .5) * asp + .5 * asp;
        float sun = exp(-pow((sunUV - sunX) * 1.25, 2.)) * smoothstep(-.2, 1., uv.y);
        // glints: tiny sharp highlights that twinkle, densest in the sun's path
        vec2 g = q * vec2(70., 46.) + vec2(w * 6., w2 * 4.);
        float s = n(g + vec2(0., t * 2.2)) * n(g * 1.63 - vec2(t * 1.7, t * .3));
        float glint = smoothstep(.58 - sun * .12, .78, s);
        col += glint * (.35 + 1.6 * sun) * vec3(1., .96, .84);
        col += sun * vec3(.1, .08, .02);
        // a whisper of mouse light
        col += .05 * exp(-dot(uv - m, uv - m) * 18.) * vec3(1., .95, .8);
        gl_FragColor = vec4(col, 1.);
      }`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    let prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(prog); gl.useProgram(prog);
    } catch (e) { host.classList.add('no-gl'); canvas.remove(); console.warn('sea shader', e); return; }
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(prog, 'r'), uT = gl.getUniformLocation(prog, 't'), uM = gl.getUniformLocation(prog, 'm');
    // render below device resolution: water is soft by nature, and this keeps it cheap
    const scale = Math.min(1, (window.devicePixelRatio || 1)) * .75;
    const size = () => { canvas.width = Math.max(2, innerWidth * scale | 0); canvas.height = Math.max(2, innerHeight * scale | 0); gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(uR, canvas.width, canvas.height); };
    size(); addEventListener('resize', size);
    let mx = .7, my = .6, tmx = mx, tmy = my;
    addEventListener('pointermove', e => { tmx = e.clientX / innerWidth; tmy = 1 - e.clientY / innerHeight; }, { passive: true });
    const t0 = performance.now(); let last = 0;
    const frame = now => {
      if (!document.hidden && now - last > 32) {   // ~30fps is plenty for water
        last = now; mx += (tmx - mx) * .06; my += (tmy - my) * .06;
        gl.uniform1f(uT, (now - t0) / 1000); gl.uniform2f(uM, mx, my);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      if (!reduce) requestAnimationFrame(frame);
    };
    if (reduce) { gl.uniform1f(uT, 12.); gl.uniform2f(uM, mx, my); gl.drawArrays(gl.TRIANGLES, 0, 3); }
    else requestAnimationFrame(frame);
  }

  /* ---------- foliage: olive and pine sprigs leaning in from the corners ---------- */
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const greens = ['#1F5B33', '#2E7A3F', '#3F9150', '#5FA85A', '#86BF6A'];
  function branch(x, y, len, ang, depth, out) {
    const bend = (rnd() - .5) * .6;
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    const cx = x + Math.cos(ang + bend) * len * .55, cy = y + Math.sin(ang + bend) * len * .55;
    out.stems.push(`<path d="M${x.toFixed(1)} ${y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" />`);
    const leaves = 7 + (rnd() * 6 | 0);
    for (let i = 1; i <= leaves; i++) {
      const k = i / (leaves + 1), it = 1 - k;
      const px = it * it * x + 2 * it * k * cx + k * k * x2, py = it * it * y + 2 * it * k * cy + k * k * y2;
      const side = i % 2 ? 1 : -1, la = ang + side * (0.7 + rnd() * .5), L = 16 + rnd() * 22 * (1 - k * .4);
      const c = greens[(rnd() * greens.length) | 0];
      out.leaves.push(`<ellipse cx="${(px + Math.cos(la) * L / 2).toFixed(1)}" cy="${(py + Math.sin(la) * L / 2).toFixed(1)}" rx="${(L / 2).toFixed(1)}" ry="${(3.4 + rnd() * 2.6).toFixed(1)}" transform="rotate(${(la * 180 / Math.PI).toFixed(1)} ${(px + Math.cos(la) * L / 2).toFixed(1)} ${(py + Math.sin(la) * L / 2).toFixed(1)})" fill="${c}" />`);
    }
    out.leaves.push(`<ellipse cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" rx="14" ry="4.2" transform="rotate(${(ang * 180 / Math.PI).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)})" fill="${greens[2]}" />`);
    if (depth > 0) for (let b = 0; b < 2; b++) branch(x + (x2 - x) * (.35 + b * .3), y + (y2 - y) * (.35 + b * .3), len * (.5 + rnd() * .15), ang + (b ? .55 : -.5) + (rnd() - .5) * .3, depth - 1, out);
  }
  function sprig(id, x, y, ang, len, cls) {
    const out = { stems: [], leaves: [] };
    branch(x, y, len, ang, 2, out);
    return `<g class="sprig ${cls}" id="${id}"><g stroke="#3B2F1E" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8">${out.stems.join('')}</g>${out.leaves.join('')}</g>`;
  }
  const svg = `<svg class="foliage" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><filter id="leafShade" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#06303A" flood-opacity=".35"/></filter></defs>
    <g filter="url(#leafShade)">
      ${sprig('sprTR', 1040, -30, 2.35, 260, 'tr')}
      ${sprig('sprTR2', 1010, 120, 2.75, 170, 'tr2')}
      ${sprig('sprBL', -40, 1040, -0.8, 230, 'bl')}
      ${sprig('sprTL', -30, 410, 0.1, 320, 'tl')}
      ${sprig('sprR', 1040, 520, 3.3, 260, 'r')}
    </g></svg>`;
  host.insertAdjacentHTML('beforeend', svg);
})();

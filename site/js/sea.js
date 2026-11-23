// Peak-summer sea for the hero: a single full-screen WebGL fragment shader.
// Sky, sun, wave normals, sun glints and screen-space sun beams are all procedural.
(() => {
  const canvas = document.querySelector('.hero__sea');
  const gl = canvas && canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) return; // CSS gradient on .hero stays as the fallback.

  const vertexSource = `
    attribute vec2 aPos;
    void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
  `;

  const fragmentSource = `
    precision highp float;
    uniform vec2 uRes;
    uniform float uTime;

    const float FOV = 1.4;      // focal length in screen-height units
    const float HORIZON = 0.10; // horizon height above screen centre
    const float CAM_H = 2.0;    // camera height above the water

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    vec3 sky(vec3 rd, vec3 sun) {
      float y = max(rd.y, 0.0);
      vec3 zenith = vec3(0.03, 0.36, 0.86);
      vec3 horizon = vec3(0.62, 0.86, 1.0);
      vec3 c = mix(horizon, zenith, pow(y, 0.42));
      float s = max(dot(rd, sun), 0.0);
      c += vec3(1.0, 0.88, 0.66) * pow(s, 10.0) * 0.14;
      c += vec3(1.0, 0.93, 0.80) * (pow(s, 120.0) * 0.35 + pow(s, 900.0) * 1.2);
      c += vec3(1.0, 0.98, 0.92) * smoothstep(0.99935, 0.99965, s) * 8.0;
      return c;
    }

    // Gradient of a sum of directional waves. fp is the world-space size of a pixel,
    // used to fade out waves too fine to sample (stops shimmering noise at the horizon).
    vec2 waveGrad(vec2 p, float t, float fp) {
      vec2 g = vec2(0.0);
      float amp = 0.30;
      float k = 0.55;
      float ang = 1.9;
      for (int i = 0; i < 12; i++) {
        vec2 d = vec2(cos(ang), sin(ang));
        float phase = dot(d, p) * k - t * sqrt(9.8 * k) + float(i) * 1.7;
        float fade = 1.0 - smoothstep(0.6, 2.2, k * fp);
        g += d * amp * k * cos(phase) * fade;
        amp *= 0.60;
        k *= 1.52;
        ang += 2.39996; // golden angle spreads the directions
      }
      return g * 0.55;
    }

    void main() {
      vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
      float t = uTime;
      // Keep the sun inside the frame on portrait screens.
      float sunX = min(0.42, 0.5 * uRes.x / uRes.y - 0.07) / FOV;
      vec3 sun = normalize(vec3(sunX, 0.20, 1.0));
      vec3 rd = normalize(vec3(p.x, p.y - HORIZON, FOV));
      vec3 horizonCol = vec3(0.66, 0.88, 1.0);
      vec3 col;

      if (rd.y > 0.0) {
        col = sky(rd, sun);
      } else {
        float dist = CAM_H / -rd.y;
        vec2 xz = rd.xz * dist + vec2(0.0, t * 0.35);
        float fp = dist * dist / (CAM_H * uRes.y * FOV);

        vec2 g = waveGrad(xz, t, fp);
        vec3 n = normalize(vec3(-g.x, 1.0, -g.y));
        vec3 r = reflect(rd, n);
        r.y = abs(r.y);

        float fres = 0.02 + 0.98 * pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
        vec3 deep = vec3(0.00, 0.26, 0.50);
        vec3 turquoise = vec3(0.02, 0.66, 0.76);
        float near = clamp(-rd.y * 2.4, 0.0, 1.0);
        float facing = max(dot(n, normalize(sun + vec3(0.0, 0.4, 0.0))), 0.0);
        vec3 water = mix(deep, turquoise, near * 0.75 + 0.15 * facing);

        col = mix(water, sky(r, sun), fres * 0.85);

        // Sun path: broad sheen plus razor-sharp highlights on individual wavelets.
        float s = max(dot(r, sun), 0.0);
        col += vec3(1.0, 0.94, 0.82) * (pow(s, 50.0) * 0.55 + pow(s, 900.0) * 40.0);

        // Twinkling glitter, confined to the sun path and faded once cells get sub-pixel.
        vec2 gp = xz * vec2(14.0, 22.0);
        vec2 cell = floor(gp);
        vec2 f = fract(gp) - 0.5;
        float rnd = hash(cell);
        float twinkle = smoothstep(0.90, 1.0, sin(t * (2.5 + rnd * 5.0) + rnd * 40.0));
        float dotShape = smoothstep(0.32, 0.0, length(f));
        float sparkleFade = 1.0 - smoothstep(0.012, 0.05, fp);
        float sparkle = step(0.55, rnd) * twinkle * dotShape * sparkleFade * pow(s, 40.0);
        col += vec3(1.0, 0.97, 0.9) * sparkle * 5.0;

        // Haze where sea meets sky.
        col = mix(col, horizonCol, exp(rd.y * 60.0) * 0.7);
      }

      // Sun beams radiating across the whole frame. Integer frequencies keep atan seamless.
      vec2 sunScreen = vec2(sun.x / sun.z * FOV, sun.y / sun.z * FOV + HORIZON);
      vec2 d = p - sunScreen;
      float L = length(d);
      float a = atan(d.y, d.x);
      float rays = 0.5 + 0.5 * (0.5 * sin(a * 7.0 + t * 0.21)
                              + 0.3 * sin(a * 13.0 - t * 0.17 + 1.3)
                              + 0.2 * sin(a * 31.0 + t * 0.33 + 2.1));
      rays = pow(rays, 4.0);
      vec3 warm = vec3(1.0, 0.95, 0.84);
      col += warm * (rays * 0.38 * exp(-L * 1.6) * smoothstep(0.0, 0.12, L) + exp(-L * 11.0) * 0.30);

      // Colours are authored in display space; only roll off the highlights.
      col = col / sqrt(1.0 + col * col * 0.22) * 1.06;
      col *= 1.0 - 0.18 * dot(p * vec2(0.6, 0.9), p * vec2(0.6, 0.9));
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  }

  const vs = compile(gl.VERTEX_SHADER, vertexSource);
  const fs = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vs || !fs) return;

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return;
  }
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(program, 'uRes');
  const uTime = gl.getUniformLocation(program, 'uTime');

  // Cap the pixel count so large or high-DPI screens stay smooth.
  const MAX_PIXELS = 2.4e6;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = canvas.clientWidth * dpr;
    let h = canvas.clientHeight * dpr;
    const scale = Math.min(1, Math.sqrt(MAX_PIXELS / (w * h)));
    w = Math.max(1, Math.round(w * scale));
    h = Math.max(1, Math.round(h * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  function draw(seconds) {
    resize();
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, seconds);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible = true;
  let frame = 0;

  function loop(ms) {
    draw(ms / 1000);
    frame = requestAnimationFrame(loop);
  }

  function update() {
    cancelAnimationFrame(frame);
    if (reduceMotion.matches) {
      draw(12.0);
    } else if (visible) {
      frame = requestAnimationFrame(loop);
    }
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    update();
  }).observe(canvas);

  reduceMotion.addEventListener('change', update);
  window.addEventListener('resize', () => { if (reduceMotion.matches) draw(12.0); });
  update();
})();

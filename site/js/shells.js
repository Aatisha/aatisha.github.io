// Sea shells: the drawings shared by the homepage polaroids (polaroids.js), which shake them out onto
// the window, and the beach in every footer (shore.js), which scatters them on the sand and leaves
// one where you tap. Each shell is drawn in a 48-unit box, styled on real shore finds: banded and
// rayed scallops, pearly turban and nautilus shells, starfish, conchs, sand dollars and the odd pearl
// oyster. `looks` are the colourings each one comes in (the `shiny` ones are mother-of-pearl, with a
// soft rainbow film). `rest` is how it lies once landed (angles in deg, or null for round ones, which
// roll and lie any way up), `foot` how far its lowest point then sits below its centre, and `r` the
// radius it takes up when it bumps into other shells, in box units.
// Load it before polaroids.js and shore.js; it sets window.seaShells = { SHELLS, pickShell }.
(() => {
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

  window.seaShells = { SHELLS, pickShell };
})();

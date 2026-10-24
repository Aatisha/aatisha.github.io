/* Kai, the seahorse. Lives in the nav, watches your cursor, blows bubbles, and knows the way around. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const OUT = '#5A2E14', BODY = '#FFC24B', BELLY = '#FFE39A', SPOT = '#F2983A', FIN = '#5ED3CF';

  // outline layer first (thick dark strokes), then the same shapes filled on top: one clean silhouette
  const shapes = (outline) => {
    const s = outline ? `fill="${OUT}" stroke="${OUT}" stroke-width="4.4" stroke-linejoin="round"` : `fill="${BODY}"`;
    const tailW = outline ? 15.4 : 11, tailC = outline ? OUT : BODY;
    return `
      <path d="M52 88 C50 104 40 115 31 111 C22 107 24 95 33 95 C40 95 41 103 35.5 104" fill="none" stroke="${tailC}" stroke-width="${tailW}" stroke-linecap="round"/>
      <path d="M40 36 C33 52 35 71 44 85 C50 95 62 97 68 87 C76 73 73 52 62 42 Z" ${s}/>
      <path d="M60 23 L86 28.5 Q93.5 30.5 91.5 37 Q89.5 41.5 84 40.5 L60 41 Z" ${s}/>
      <circle cx="51" cy="30" r="17" ${s}/>`;
  };
  const svg = `<svg class="kai-svg" viewBox="0 0 100 124" aria-hidden="true">
    <g class="kai-fin-back"><path d="M41 55 Q20 57 24 78 Q33 71 43 72 Z" fill="${FIN}" stroke="${OUT}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M40 58 L28 62 M40 62 L27 68 M41 66 L28 74" stroke="${OUT}" stroke-width="1.3" stroke-linecap="round" opacity=".55"/></g>
    ${shapes(true)}${shapes(false)}
    <path d="M44 16 L46 7 L50 13 L53 6 L56 14" fill="${SPOT}" stroke="${OUT}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M58 44 C66 48 70 56 70 64 M67 70 C66 76 63 82 58 86" fill="none" stroke="${BELLY}" stroke-width="7" stroke-linecap="round" opacity=".9"/>
    <path d="M61 49 l5 -2 M65 55 l5 -1 M67 61 l5 0 M67 67 l5 1 M65 73 l5 2 M62 79 l4 3" stroke="${SPOT}" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="47" cy="58" r="1.8" fill="${SPOT}"/><circle cx="51" cy="68" r="1.5" fill="${SPOT}"/><circle cx="46" cy="76" r="1.7" fill="${SPOT}"/><circle cx="40" cy="30" r="1.6" fill="${SPOT}"/>
    <ellipse class="kai-pec" cx="45" cy="45" rx="5" ry="3" fill="${FIN}" stroke="${OUT}" stroke-width="1.6" transform="rotate(-30 45 45)"/>
    <ellipse cx="65" cy="38" rx="4.2" ry="2.4" fill="#FF8FA3" opacity=".75"/>
    <g class="kai-eye"><circle cx="56" cy="28" r="7" fill="#fff" stroke="${OUT}" stroke-width="2.2"/>
      <g class="kai-pupil"><circle cx="57.5" cy="28.5" r="3.6" fill="#1D2B36"/><circle cx="59" cy="26.8" r="1.3" fill="#fff"/></g></g>
    <path class="kai-smile" d="M83 38.5 q3 1.2 5 -0.6" fill="none" stroke="${OUT}" stroke-width="1.6" stroke-linecap="round"/>
    <g class="kai-bubbles"><circle cx="94" cy="30" r="2.2"/><circle cx="96" cy="24" r="1.5"/><circle cx="93" cy="18" r="1.1"/></g>
  </svg>`;

  const host = document.getElementById('kai');
  if (!host) return;
  host.insertAdjacentHTML('afterbegin', svg);
  const pupil = host.querySelector('.kai-pupil'), eye = host.querySelector('.kai-eye');
  window.kaiMark = () => 'data:image/svg+xml,' + encodeURIComponent(svg.replace('class="kai-svg"', 'xmlns="http://www.w3.org/2000/svg"'));

  /* ---------- eyes follow you ---------- */
  let px = 0, py = 0;
  addEventListener('pointermove', e => {
    const r = host.getBoundingClientRect(), ex = r.left + r.width * .56, ey = r.top + r.height * .23;
    const dx = e.clientX - ex, dy = e.clientY - ey, d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 160);
    px = dx / d * 2 * k; py = dy / d * 2 * k;
    pupil.setAttribute('transform', `translate(${px.toFixed(2)} ${py.toFixed(2)})`);
  }, { passive: true });
  const blink = () => { eye.classList.add('blink'); setTimeout(() => eye.classList.remove('blink'), 140); setTimeout(blink, 2600 + Math.random() * 3800); };
  if (!reduce) setTimeout(blink, 2400);
  const puff = () => { host.classList.remove('puff'); void host.offsetWidth; host.classList.add('puff'); setTimeout(puff, 5200 + Math.random() * 6000); };
  if (!reduce) setTimeout(puff, 3500);

  /* ---------- speech bubble ---------- */
  const bubble = document.getElementById('kaiBubble');
  let timer, menuFn = () => [];
  function place() {
    const r = host.getBoundingClientRect();
    bubble.style.left = Math.max(12, r.left - 6) + 'px';
    bubble.style.top = (r.bottom + 12) + 'px';
  }
  let shownAt = 0, shownY = 0, userAt = 0;
  function say(html, { actions = [], hold = 4200 } = {}) {
    clearTimeout(timer);
    bubble.innerHTML = `<p>${html}</p>` + (actions.length ? `<div class="kb-acts">${actions.map((a, i) => `<button type="button" data-i="${i}" class="${a.primary ? 'pri' : ''}">${a.label}</button>`).join('')}</div>` : '');
    $$('button', bubble).forEach(b => b.addEventListener('click', e => { e.stopPropagation(); hush(); actions[+b.dataset.i].run && actions[+b.dataset.i].run(); }));
    shownAt = performance.now(); shownY = scrollY;
    place(); bubble.classList.add('on'); bubble.setAttribute('aria-hidden', 'false');
    if (hold) timer = setTimeout(hush, hold + (actions.length ? 4000 : 0));
  }
  function hush() { bubble.classList.remove('on'); bubble.setAttribute('aria-hidden', 'true'); }
  function react(kind = 'happy') {
    host.classList.remove('hop', 'wow'); void host.offsetWidth; host.classList.add(kind === 'wow' ? 'wow' : 'hop');
  }
  function $$(s, c) { return [...c.querySelectorAll(s)]; }
  host.addEventListener('click', e => {
    e.stopPropagation(); react();
    if (bubble.classList.contains('on') && bubble.dataset.kind === 'menu') { hush(); return; }
    bubble.dataset.kind = 'menu';
    say('Where to? I know every tide pool on this page.', { actions: menuFn(), hold: 9000 });
  });
  document.addEventListener('click', e => { if (!bubble.contains(e.target)) hush(); });
  // a bubble drifting over content mid-scroll feels clingy — let it go once the visitor has moved on
  addEventListener('scroll', () => {
    if (!bubble.classList.contains('on')) return;
    const now = performance.now();
    if (now - shownAt > 1200 && now - userAt < 400 && Math.abs(scrollY - shownY) > 420) hush(); else place();
  }, { passive: true });
  ['wheel', 'touchmove', 'keydown'].forEach(t => addEventListener(t, () => { userAt = performance.now(); }, { passive: true }));
  addEventListener('resize', place);

  window.Kai = {
    say: (h, o) => { bubble.dataset.kind = 'say'; say(h, o); },
    hush, react,
    setMenu: fn => { menuFn = fn; },
  };
})();

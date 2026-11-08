// About page: blocks marked [data-reveal] drift up and come into focus as they scroll into view,
// using the same soft entrance as the home page text. Without the script (or with reduced motion)
// everything simply shows.
(() => {
  const blocks = document.querySelectorAll('[data-reveal]');
  if (!blocks.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.documentElement.classList.add('has-reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-shown');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });

  blocks.forEach((el) => observer.observe(el));
})();

// The ID badge swings on its lanyard: a pendulum hung from the top of the strap, with the cards
// lagging a little on the clip and turning as they go. Pull it sideways and let go and it swings
// back and settles. While the pointer rests on it, the lanyard holds still and the cards rock
// gently on the clip's hook instead: the front one tipping and turning a little, the sea card
// behind fanning open and shut out of step with it, like a badge stirring in a draught. It gives a
// small swing hello the first time it comes into view. With reduced motion it just hangs still.
(() => {
  const badge = document.querySelector('.badge');
  if (!badge || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const swing = badge.querySelector('.badge__swing');
  const cards = badge.querySelector('.badge__cards');
  const back = badge.querySelector('.badge__card--back');
  const clip = badge.querySelector('.badge__clip');
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

  const GRAVITY = 20; // g / L, per second squared: sets how slowly it swings
  const DRAG = 1.3; // air and strap friction
  const ROCK = (Math.PI * 2) / 2.8; // the hover rock: one slow breath every 2.8s
  const FAN = -9; // the back card's resting angle, degrees (as in styles.css)
  let a = 0; // the strap's angle, radians (positive turns clockwise, so the card goes left)
  let v = 0;
  let tilt = 0; // the cards on the clip, against the strap
  let tiltV = 0;
  let pull = null; // while held: the angle the pointer is asking for
  let over = false; // the pointer is resting on the badge
  let rock = 0; // how much of the hover rock is showing, eased 0 to 1
  let clock = 0;
  let frame = 0;
  let last = 0;

  const draw = () => {
    const s = Math.sin(clock * ROCK);
    const r = tilt + rock * 0.045 * s;
    const turn = clamp(v * 7, -18, 18) + rock * 11 * Math.sin(clock * ROCK - 0.9);
    swing.style.rotate = `${a}rad`;
    cards.style.transform = `rotate(${r}rad) perspective(900px) rotateY(${turn}deg)`;
    back.style.rotate = `${FAN - rock * (2.5 + 4 * Math.sin(clock * ROCK + 1.6))}deg`;
    clip.style.rotate = `${r}rad`; // the hook turns with the cards, so it stays in their slot
  };

  const step = (now) => {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    clock += dt;
    rock += ((over && pull === null ? 1 : 0) - rock) * Math.min(1, dt * 3);
    const force = pull === null
      ? -GRAVITY * Math.sin(a) - DRAG * v
      : (pull - a) * 140 - v * 16;
    v += force * dt;
    a += v * dt;
    // The cards trail the strap: pushed back by its swing, sprung back to hang straight.
    tiltV += ((-v * 0.08 - tilt) * 110 - tiltV * 9) * dt;
    tilt += tiltV * dt;
    draw();
    const resting = pull === null && !over && rock < 1e-3
      && Math.abs(a) + Math.abs(v) + Math.abs(tilt) + Math.abs(tiltV) < 2e-4;
    frame = resting ? 0 : requestAnimationFrame(step);
  };
  const wake = () => {
    if (frame) return;
    last = performance.now();
    frame = requestAnimationFrame(step);
  };

  // The angle from the top of the strap to the pointer.
  const angleTo = (e) => {
    const r = badge.getBoundingClientRect();
    return -Math.atan2(e.clientX - (r.left + r.width / 2), Math.max(e.clientY - r.top, 60));
  };

  let offset = 0;
  cards.addEventListener('pointerdown', (e) => {
    offset = a - angleTo(e);
    pull = a;
    try { cards.setPointerCapture(e.pointerId); } catch (err) { /* pointer already gone */ }
    wake();
  });
  cards.addEventListener('pointermove', (e) => {
    if (pull === null) return;
    pull = clamp(angleTo(e) + offset, -0.75, 0.75);
  });
  const letGo = () => { pull = null; };
  cards.addEventListener('pointerup', letGo);
  cards.addEventListener('pointercancel', letGo);

  // Resting the mouse on it starts the rock; it eases out again when the pointer leaves.
  badge.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse') return;
    over = true;
    wake();
  });
  badge.addEventListener('pointerleave', () => { over = false; });

  const hello = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    hello.disconnect();
    v = -0.9;
    wake();
  }, { threshold: 0.4 });
  hello.observe(cards);
})();

// The badge follows the Experience list: pointing at a place puts that role, number and logo on
// it (each row's data-org and data-badge), and leaving the list brings back where I am now.
(() => {
  const badge = document.querySelector('.badge');
  const list = document.querySelector('.exp-list');
  if (!badge || !list || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const front = badge.querySelector('.badge__card--front');
  const role = front.querySelector('.badge__role');
  const no = front.querySelector('.badge__no');
  const logos = [...front.querySelectorAll('.badge__logo')];
  const now = list.querySelector('.exp-row');
  let shown = now;
  let back = 0;

  const show = (row) => {
    if (row === shown) return;
    shown = row;
    role.textContent = row.querySelector('.exp-row__role').textContent;
    no.textContent = row.dataset.badge;
    logos.forEach((logo) => { logo.hidden = logo.dataset.org !== row.dataset.org; });
    front.classList.remove('is-swapping');
    void front.offsetWidth; // restart the settle-in
    front.classList.add('is-swapping');
  };

  list.addEventListener('pointerover', (e) => {
    const row = e.target.closest('.exp-row');
    if (!row) return;
    clearTimeout(back);
    show(row);
  });
  list.addEventListener('pointerleave', () => {
    back = setTimeout(() => show(now), 600);
  });
})();

// Outside of design: the photo journal. Under the strip, a thumbnail for each print (taken from
// the prints themselves), with the one nearest the middle of the strip named above them. Running
// the mouse along the thumbnails, or clicking or tabbing to one, slides that print to the middle.
// With a mouse the section pins mid-screen and scrolling the page moves the strip along (a sideways
// trackpad swipe or a drag does the same, by scrolling the page); on touch screens the strip just
// swipes sideways on its own.
(() => {
  const journal = document.querySelector('.journal');
  if (!journal) return;
  const runway = journal.querySelector('.journal__runway');
  const pin = journal.querySelector('.journal__pin');
  const track = journal.querySelector('.journal__track');
  const prints = [...track.querySelectorAll('.journal__print')];
  const nav = journal.querySelector('.journal__nav');
  const strip = journal.querySelector('.journal__strip');
  const title = journal.querySelector('[data-journal-title]');
  const place = journal.querySelector('[data-journal-place]');
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  const mouse = window.matchMedia('(hover: hover) and (pointer: fine)');

  let pinned = false;
  let travel = 0; // how far the strip moves end to end, px
  let top = 0; // where the pinned section sits on screen

  const runwayTop = () => runway.getBoundingClientRect().top + window.scrollY;

  // Pinned, the page's scroll through the runway is how far along the strip is.
  const sync = () => {
    if (pinned) track.scrollLeft = Math.min(travel, Math.max(0, window.scrollY + top - runwayTop()));
  };

  // Make the runway the pinned section's height plus the strip's travel, so it pins for exactly
  // as long as it takes to reach the end, centred on screen.
  const measure = () => {
    pinned = mouse.matches;
    journal.classList.toggle('is-pinned', pinned);
    if (!pinned) {
      runway.style.height = '';
      pin.style.top = '';
      return;
    }
    travel = track.scrollWidth - track.clientWidth;
    const h = pin.offsetHeight;
    top = Math.max(0, (window.innerHeight - h) / 2);
    pin.style.top = `${top}px`;
    runway.style.height = `${h + travel}px`;
    sync();
  };

  // Moves the strip to a point along it: by scrolling the page when pinned, the strip otherwise.
  const slideTo = (left, how) => {
    const to = Math.min(track.scrollWidth - track.clientWidth, Math.max(0, left));
    if (pinned) window.scrollTo({ top: runwayTop() - top + to, behavior: how });
    else track.scrollTo({ left: to, behavior: how });
  };

  let current = -1;
  let gliding = false; // sliding to a chosen print: the label waits for it to arrive
  let glide = 0;
  const arrived = () => {
    gliding = false;
    clearTimeout(glide);
  };

  const mark = (i) => {
    if (i === current) return;
    current = i;
    thumbs.forEach((thumb, j) => {
      thumb.classList.toggle('is-current', j === i);
      thumb.classList.toggle('is-near', Math.abs(j - i) === 1);
      thumb.setAttribute('aria-current', j === i ? 'true' : 'false');
    });
    title.textContent = prints[i].dataset.title;
    place.textContent = prints[i].dataset.place;
  };

  const middleOf = (el) => {
    const r = el.getBoundingClientRect();
    return r.left + r.width / 2;
  };

  const go = (i) => {
    mark(i);
    gliding = true;
    clearTimeout(glide);
    glide = setTimeout(arrived, 900);
    const t = track.getBoundingClientRect();
    slideTo(track.scrollLeft + middleOf(prints[i]) - (t.left + t.width / 2), behavior);
  };

  const thumbs = prints.map((print, i) => {
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'journal__thumb';
    thumb.setAttribute('aria-label', `${print.dataset.title}, ${print.dataset.place}`);
    const img = print.querySelector('img').cloneNode();
    img.alt = '';
    thumb.append(img);
    thumb.addEventListener('click', () => go(i));
    thumb.addEventListener('focus', () => go(i));
    thumb.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') go(i); });
    strip.append(thumb);
    return thumb;
  });
  nav.hidden = false;

  // Whichever print is nearest the middle of the strip is the one named.
  let frame = 0;
  const follow = () => {
    frame = 0;
    if (gliding) return;
    const t = track.getBoundingClientRect();
    const mid = t.left + t.width / 2;
    let best = 0;
    prints.forEach((print, i) => {
      if (Math.abs(middleOf(print) - mid) < Math.abs(middleOf(prints[best]) - mid)) best = i;
    });
    mark(best);
  };
  track.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(follow); }, { passive: true });
  track.addEventListener('scrollend', () => { if (!pinned) arrived(); });
  window.addEventListener('scrollend', () => { if (pinned) arrived(); });
  window.addEventListener('scroll', sync, { passive: true });

  // A sideways trackpad swipe over the pinned strip scrolls the page, so it moves the strip too.
  track.addEventListener('wheel', (e) => {
    if (!pinned || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    window.scrollBy(0, e.deltaX);
  }, { passive: false });

  // Dragging with the mouse; touch screens already swipe it.
  let drag = null;
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, left: track.scrollLeft };
    track.setPointerCapture(e.pointerId);
  });
  track.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 3) track.classList.add('is-dragging');
    slideTo(drag.left - dx, 'auto');
  });
  const letGo = () => {
    drag = null;
    track.classList.remove('is-dragging');
  };
  track.addEventListener('pointerup', letGo);
  track.addEventListener('pointercancel', letGo);

  mouse.addEventListener('change', measure);
  new ResizeObserver(measure).observe(pin);
  window.addEventListener('resize', measure);
  measure();
  follow();
})();

// Playground: screen recordings marked [data-autoplay] play, muted and looping, only while they're
// on screen. With reduced motion they stay on their poster frame.
(() => {
  const videos = document.querySelectorAll('video[data-autoplay]');
  if (!videos.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) target.play().catch(() => {});
      else target.pause();
    });
  }, { threshold: 0.25 });
  videos.forEach((video) => observer.observe(video));
})();

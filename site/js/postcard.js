// Postcard (postcard.html): visitors write me a postcard. Picking a stamp from the sheet sticks it
// on the card; sending postmarks it and turns the card over to its picture side, with a thank-you.
//
// Postcards are sent by Web3Forms (web3forms.com, free), which emails each one to me; nothing is
// stored and nobody else sees them. The form's data-web3forms-key is the access key, which is meant
// to be public: it can only send to my inbox. Without it, the page is a preview: it plays the whole
// sending, but sends nothing.
(() => {
  const form = document.querySelector('[data-postcard]');
  if (!form) return;
  const slot = form.querySelector('[data-stamp-slot]');
  const count = form.querySelector('[data-pc-count]');
  const thanks = form.querySelector('[data-pc-thanks]');
  const sent = form.querySelector('[data-pc-sent]');
  const error = document.querySelector('[data-pc-error]');
  const status = document.querySelector('[data-pc-status]');
  const sendButton = document.querySelector('[data-pc-send]');
  const againButton = document.querySelector('[data-pc-again]');
  const stamps = [...document.querySelectorAll('input[name="stamp"]')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const KEY = form.dataset.web3formsKey || '';
  const LIVE = Boolean(KEY);
  const LAST_SENT = 'postcard-last-sent';
  const MAX = 500;
  const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, reduceMotion.matches ? 0 : ms); });

  // Today's date on the postmark, in Seattle.
  const now = new Date();
  const part = (opts) => new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', ...opts }).format(now);
  form.querySelector('[data-postmark-date]').textContent = `${part({ day: 'numeric' })} ${part({ month: 'short' }).toUpperCase()}`;
  form.querySelector('[data-postmark-year]').textContent = part({ year: 'numeric' });

  /* ---------- The stamp ---------- */
  const stick = (input, animate) => {
    const stamp = input.closest('.stamp-pick').querySelector('.stamp').cloneNode(true);
    // The clownfish stamp's clip has an id; the copy on the card needs its own.
    stamp.querySelectorAll('[id]').forEach((el) => {
      const id = el.id;
      el.id = `${id}-card`;
      stamp.querySelectorAll(`[clip-path="url(#${id})"]`).forEach((c) => c.setAttribute('clip-path', `url(#${id}-card)`));
    });
    slot.replaceChildren(stamp);
    slot.classList.remove('is-stuck');
    if (animate) {
      void slot.offsetWidth; // restart the stick
      slot.classList.add('is-stuck');
    }
  };

  stamps.forEach((input) => input.addEventListener('change', () => stick(input, true)));
  stick(stamps.find((s) => s.checked) || stamps[0], false);

  /* ---------- Writing ---------- */
  const message = form.elements.message;
  let started = 0;
  message.addEventListener('input', () => {
    if (!started) started = Date.now();
    count.textContent = `${message.value.length} / ${MAX}`;
  });

  // The email: a subject that says who it's from, a reply that goes straight back to them (when
  // they left an address), and the card's fields in the order they're written.
  const send = async (card) => {
    if (!LIVE) return;
    const from = [card.name, card.place && `(${card.place})`].filter(Boolean).join(' ');
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: KEY,
        subject: `New postcard${from ? ` from ${from}` : ''}`,
        from_name: 'aatishacyrill.com postcard',
        ...(card.email && { replyto: card.email }),
        botcheck: false,
        Message: card.message,
        From: card.name || '—',
        'Writing from': card.place || '—',
        'Reply to': card.email || '—',
        Stamp: card.stamp,
      }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok || !result.success) throw new Error(`The postcard didn't go (${res.status})`);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.textContent = '';
    const text = message.value.trim();
    const name = form.elements.name.value.trim();
    const place = form.elements.place.value.trim();
    const email = form.elements.email.value.trim();
    const stamp = (stamps.find((s) => s.checked) || stamps[0]).value;

    if (text.length < 2) {
      error.textContent = 'Write a few words before you send it.';
      message.focus();
      return;
    }
    if (email && !form.elements.email.checkValidity()) {
      error.textContent = 'That email doesn’t look quite right. Check it, or leave it blank.';
      form.elements.email.focus();
      return;
    }
    let last = 0;
    try { last = Number(localStorage.getItem(LAST_SENT)) || 0; } catch { /* fine */ }
    if (LIVE && Date.now() - last < 60000) {
      error.textContent = 'Your last postcard is still in the post. Give it a minute before the next.';
      return;
    }

    sendButton.disabled = true;
    // Quietly drop what only a bot would send: the hidden field filled in, or a message typed in
    // under two seconds. It still looks sent.
    const bot = form.elements.website.value || (started && Date.now() - started < 2000);
    try {
      if (!bot) await send({ message: text.slice(0, MAX), name: name || null, place: place || null, email: email || null, stamp });
      try { localStorage.setItem(LAST_SENT, String(Date.now())); } catch { /* fine */ }
    } catch {
      error.textContent = 'The postcard didn’t go through. Please try again in a moment.';
      sendButton.disabled = false;
      return;
    }

    // Postmark it, then turn it over.
    thanks.textContent = name ? `Thank you, ${name.split(/\s+/)[0]}!` : 'Thank you!';
    sent.textContent = LIVE ? 'Your postcard is on its way to Seattle' : '';
    form.classList.add('is-postmarked');
    await wait(750);
    form.classList.add('is-sent');
    form.querySelector('.postcard__back').setAttribute('inert', '');
    form.querySelector('.postcard__front').removeAttribute('aria-hidden');
    status.textContent = sent.textContent ? `${thanks.textContent} ${sent.textContent}.` : thanks.textContent;
    sendButton.hidden = true;
    againButton.hidden = false;
    sendButton.disabled = false;
    await wait(1000);
    againButton.focus();
  });

  // A fresh card: clear it, turn it back over and take the postmark off.
  againButton.addEventListener('click', () => {
    const stamp = (stamps.find((s) => s.checked) || stamps[0]).value;
    form.reset();
    stamps.forEach((s) => { s.checked = s.value === stamp; });
    count.textContent = `0 / ${MAX}`;
    started = 0;
    form.classList.remove('is-sent', 'is-postmarked');
    form.querySelector('.postcard__back').removeAttribute('inert');
    form.querySelector('.postcard__front').setAttribute('aria-hidden', 'true');
    status.textContent = '';
    againButton.hidden = true;
    sendButton.hidden = false;
    setTimeout(() => message.focus(), reduceMotion.matches ? 0 : 700);
  });
})();

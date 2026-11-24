// Fieldwork marketing page: small enhancements over server-rendered HTML.
// Everything works without this file; it adds motion and the in-place form.
(() => {
  document.documentElement.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. The composer types a prompt, "sends" it, then moves to the next.
  const ask = document.querySelector('[data-ask]');
  if (ask) {
    const prompts = JSON.parse(ask.dataset.ask || '[]');
    const typed = ask.querySelector('.typed');
    const items = [...ask.querySelectorAll('.ask-list button')];
    let i = 0, timer = 0, visible = true, paused = false;
    const mark = (n) => items.forEach((b, k) => (k === n ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
    const type = (n) => {
      clearTimeout(timer);
      i = n; mark(n);
      const text = prompts[n];
      if (reduce) { typed.dataset.text = text; return; }
      let c = 0;
      const step = () => {
        typed.dataset.text = text.slice(0, c);
        if (c < text.length) { c += 1; timer = setTimeout(step, 18 + Math.random() * 30); return; }
        timer = setTimeout(() => {
          ask.classList.add('sent');
          setTimeout(() => ask.classList.remove('sent'), 300);
          timer = setTimeout(() => { if (visible && !paused) type((i + 1) % prompts.length); }, 2600);
        }, 900);
      };
      step();
    };
    items.forEach((b, k) => b.addEventListener('click', () => { paused = true; type(k); }));
    if (!reduce) {
      new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible && !paused) type(i); else clearTimeout(timer);
      }).observe(ask);
    }
  }

  // 2. Same job, both apps: the chips step both halves at once.
  document.querySelectorAll('[data-demo]').forEach((demo) => {
    const chips = [...demo.querySelectorAll('[data-go]')];
    chips.forEach((c) => c.addEventListener('click', () => {
      demo.dataset.step = c.dataset.go;
      chips.forEach((x) => x.setAttribute('aria-selected', String(x === c)));
    }));
  });

  // 3. The levelling staff reads the time of the block in the middle of the screen.
  const staff = document.querySelector('.staff-reading');
  const rows = [...document.querySelectorAll('.blocks li[data-at]')];
  if (staff && rows.length) {
    const label = staff.querySelector('.rd-t');
    const set = (li) => {
      staff.style.setProperty('--r', li.dataset.at);
      label.dataset.t = li.dataset.t;
      rows.forEach((r) => r.classList.toggle('on', r === li));
    };
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && set(e.target)), { rootMargin: '-45% 0px -50% 0px' });
    rows.forEach((r) => {
      io.observe(r);
      r.addEventListener('mouseenter', () => set(r));
      r.addEventListener('focus', () => set(r));
    });
  }

  // 4. "Ask for a seat" buttons pick the matching day in the form.
  document.querySelectorAll('[data-pick]').forEach((a) => a.addEventListener('click', () => {
    const r = document.querySelector(`.ask-form input[name="day"][value="${CSS.escape(a.dataset.pick)}"]`);
    if (r) r.checked = true;
    setTimeout(() => document.querySelector('.ask-form input[name="name"]')?.focus({ preventScroll: true }), 400);
  }));

  // 5. The form answers in place.
  const form = document.querySelector('[data-interest]');
  if (form) {
    const msg = form.querySelector('.form-msg');
    const btn = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      msg.className = 'form-msg';
      const data = Object.fromEntries(new FormData(form));
      if (!data.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email || ''))) {
        msg.textContent = 'Please give your name and a valid email.';
        msg.classList.add('bad');
        return;
      }
      btn.disabled = true; btn.textContent = 'Sending…';
      try {
        let body;
        if (form.dataset.preview) {
          await new Promise((r) => setTimeout(r, 500));
          body = { ok: true, message: 'Preview only: nothing was sent. On the live site this lands in the cohort admin.' };
        } else {
          const res = await fetch(form.action, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
          body = await res.json();
        }
        msg.textContent = body.message;
        if (body.ok) form.classList.add('done'); else msg.classList.add('bad');
      } catch {
        msg.textContent = 'That didn’t go through. Please try again in a minute.';
        msg.classList.add('bad');
      } finally {
        btn.disabled = false; btn.textContent = 'Send';
      }
    });
  }
})();

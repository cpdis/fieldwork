// Fieldwork marketing page: small enhancements over server-rendered HTML.
// Everything works without this file; it adds motion and the in-place form.
(() => {
  document.documentElement.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. The hero chat: type the prompt, send it, think, reveal the real reply, then the next run.
  const hero = document.querySelector('[data-hero]');
  if (hero) {
    const runs = [...hero.querySelectorAll('.hr-run')];
    const items = [...hero.querySelectorAll('.hr-list button')];
    const typed = hero.querySelector('.typed');
    const chat = hero.querySelector('.hr-chat');
    let i = 0, timers = [], visible = true, paused = false;
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const stop = () => { timers.forEach(clearTimeout); timers = []; };
    const show = (n) => {
      hero.dataset.i = String(n);
      items.forEach((b, k) => (k === n ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
    };
    const play = (n) => {
      stop();
      i = n; show(n);
      const run = runs[n];
      const text = run.querySelector('.me').textContent;
      const ai = run.querySelector('.ai');
      chat.scrollTop = 0;
      if (reduce) { typed.dataset.text = ''; run.dataset.state = 'reply'; return; }
      run.dataset.state = 'typing';
      let c = 0;
      const step = () => {
        typed.dataset.text = text.slice(0, c);
        if (c < text.length) { c += Math.random() < 0.3 ? 2 : 1; later(step, 14 + Math.random() * 22); return; }
        later(() => {
          hero.classList.add('sending');
          typed.dataset.text = '';
          run.dataset.state = 'sent';
          later(() => hero.classList.remove('sending'), 300);
          later(() => {
            const len = ai.textContent.length;
            const d = Math.min(9, Math.max(1.6, len / 160));
            ai.style.setProperty('--d', d + 's');
            run.dataset.state = 'reply';
            // Follow the reply down as it arrives.
            const t0 = performance.now();
            const follow = () => {
              const f = Math.min(1, (performance.now() - t0) / (d * 1000));
              chat.scrollTop = Math.max(0, (chat.scrollHeight - chat.clientHeight) * f);
              if (f < 1 && run.dataset.state === 'reply' && hero.dataset.i === String(n)) requestAnimationFrame(follow);
            };
            requestAnimationFrame(follow);
            later(() => { if (visible && !paused) play((i + 1) % runs.length); }, d * 1000 + 6000);
          }, 1300);
        }, 700);
      };
      step();
    };
    items.forEach((b, k) => b.addEventListener('click', () => { paused = true; play(k); }));
    // Let people scroll a long reply themselves.
    chat.style.overflowY = 'auto';
    if (reduce) show(0);
    else new IntersectionObserver(([e]) => {
      const was = visible;
      visible = e.isIntersecting;
      if (visible && !was && !paused) play(i);
      if (!visible) stop();
    }).observe(hero);
    if (!reduce) play(0);
  }

  // 2. Same job, both apps: the chips step both halves at once.
  document.querySelectorAll('[data-demo]').forEach((demo) => {
    const chips = [...demo.querySelectorAll('[data-go]')];
    chips.forEach((c) => c.addEventListener('click', () => {
      demo.dataset.step = c.dataset.go;
      chips.forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
    }));
  });

  // 3. The levelling staff reads the time at the middle of the screen. The reading is
  // interpolated between blocks and follows the scroll each frame, so it glides rather than jumps.
  const staff = document.querySelector('.staff-reading');
  const rows = [...document.querySelectorAll('.blocks li[data-at]')];
  if (staff && rows.length) {
    const label = staff.querySelector('.rd-t');
    const fmt = (h) => {
      const mins = Math.round((9 + h) * 60 / 15) * 15;
      return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`;
    };
    let queued = false, onRow = null;
    const update = () => {
      queued = false;
      const mid = innerHeight * 0.5;
      const tops = rows.map((r) => r.getBoundingClientRect().top);
      let r = 0;
      if (mid <= tops[0]) r = 0;
      else if (mid >= tops[tops.length - 1]) r = Number(rows[rows.length - 1].dataset.at);
      else {
        for (let k = 0; k < rows.length - 1; k++) {
          if (mid >= tops[k] && mid < tops[k + 1]) {
            const f = (mid - tops[k]) / (tops[k + 1] - tops[k]);
            const a = Number(rows[k].dataset.at), b = Number(rows[k + 1].dataset.at);
            r = a + (b - a) * f;
            if (onRow !== rows[k]) { onRow = rows[k]; rows.forEach((x) => x.classList.toggle('on', x === onRow)); }
            break;
          }
        }
      }
      staff.style.setProperty('--r', r.toFixed(3));
      // Name the block being read, not an in-between time that no block starts at.
      label.dataset.t = onRow ? onRow.dataset.t : fmt(r);
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    update();
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

/*
 * Fieldwork deck tracker and note box. Added to the built deck's entry page by the site
 * (src/lib/deck.ts injectTracker), with its settings in window.__FW_DECK.
 *
 * Tracking: one run per tab (kept across a reload for 30 minutes). Each stop on a page is a
 * view {seq, page, from, at, dwell}; dwell counts only while the tab is visible. Views are sent
 * every 15 s, on each page change and when the tab hides. The presenter window is not tracked:
 * it drives the audience window, which is, and that run is marked "presented".
 *
 * Notes: a small "Note on this page" button. Hidden while presenting or full screen.
 */
(function () {
  'use strict';
  var cfg = window.__FW_DECK;
  if (!cfg || !window.fetch) return;

  var path = location.pathname;
  var m = path.match(/\/s\/([^/]+)(\/presenter)?\/?$/);
  if (!m) return;
  var slide = m[1];
  var isPresenterWindow = Boolean(m[2]);

  /* ---------------------------------------------------------------- run state */

  var KEY = 'fw-deck-run:' + cfg.mode + ':' + slide;
  var RESUME_MS = 30 * 60 * 1000;

  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    var b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 15) | 64;
    b[8] = (b[8] & 63) | 128;
    var h = Array.prototype.map.call(b, function (x) { return (x + 256).toString(16).slice(1); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }

  function load() {
    try {
      var s = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (s && s.sid && Date.now() - s.last < RESUME_MS) return s;
    } catch (e) {}
    return { sid: uuid(), seq: -1, last: Date.now() };
  }
  var run = load();
  function save() {
    run.last = Date.now();
    try { sessionStorage.setItem(KEY, JSON.stringify(run)); } catch (e) {}
  }

  function pageFromUrl() {
    var p = Number(new URLSearchParams(location.search).get('p') || '1');
    return Number.isInteger(p) && p > 0 ? p : 1;
  }

  var presented = false;
  var current = null; // {seq, page, from, at, dwell}
  var visibleSince = document.visibilityState === 'visible' ? Date.now() : null;
  var pending = {}; // seq -> view, sent and kept until acknowledged

  function tick() {
    if (current && visibleSince !== null) {
      var now = Date.now();
      current.dwell += now - visibleSince;
      visibleSince = now;
    }
  }

  function startView(page) {
    var from = current ? current.page : null;
    if (current) pending[current.seq] = current;
    run.seq += 1;
    current = { seq: run.seq, page: page, from: from, at: Date.now(), dwell: 0 };
    if (visibleSince !== null) visibleSince = Date.now();
    save();
    updateNoteButton();
  }

  function body() {
    tick();
    var views = [];
    for (var k in pending) views.push(pending[k]);
    if (current) views.push(current);
    return JSON.stringify({
      sid: run.sid,
      commit: cfg.commit,
      pages: cfg.pageCount,
      presented: presented,
      views: views.slice(-100),
    });
  }

  function send(beacon) {
    if (isPresenterWindow) return;
    var data = body();
    var sentSeqs = Object.keys(pending);
    var url = cfg.api + '/track';
    if (beacon && navigator.sendBeacon) {
      if (navigator.sendBeacon(url, new Blob([data], { type: 'text/plain' }))) sentSeqs.forEach(function (s) { delete pending[s]; });
      return;
    }
    fetch(url, { method: 'POST', body: data, keepalive: true, credentials: 'same-origin', headers: { 'Content-Type': 'text/plain' } })
      .then(function (r) {
        if (r.ok) sentSeqs.forEach(function (s) { delete pending[s]; });
        else if (r.status === 401 && cfg.mode === 'look') location.reload(); // link revoked or expired
      })
      .catch(function () {});
    save();
  }

  var changeTimer = null;
  function check() {
    var page = pageFromUrl();
    if (!current || current.page !== page) {
      tick();
      startView(page);
      clearTimeout(changeTimer);
      changeTimer = setTimeout(function () { send(false); }, 1500);
    }
  }

  if (!isPresenterWindow) {
    ['pushState', 'replaceState'].forEach(function (fn) {
      var orig = history[fn];
      history[fn] = function () {
        var r = orig.apply(this, arguments);
        setTimeout(check, 0);
        return r;
      };
    });
    window.addEventListener('popstate', check);
    setInterval(check, 1000);
    setInterval(function () { send(false); }, 15000);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        visibleSince = Date.now();
      } else {
        tick();
        visibleSince = null;
        send(true);
      }
    });
    window.addEventListener('pagehide', function () { send(true); });
    check();
  }

  // The presenter window drives this one through open-slide's BroadcastChannel.
  try {
    var ch = new BroadcastChannel('open-slide:presenter:' + slide);
    ch.addEventListener('message', function (e) {
      var t = e.data && e.data.type;
      if (!isPresenterWindow && (t === 'goto' || t === 'next' || t === 'prev' || t === 'toggle-blackout' || t === 'request-state')) {
        if (!presented) {
          presented = true;
          updateNoteButton();
        }
      }
    });
  } catch (e) {}

  /* ---------------------------------------------------------------- note box */

  var noteHost = null;
  var noteBtn = null;
  var panel = null;
  var hideTimer = null;

  function updateNoteButton() {
    if (!noteBtn || !current) return;
    noteBtn.querySelector('b').textContent = String(current.page);
    var hidden = presented || Boolean(document.fullscreenElement);
    noteHost.style.display = hidden && !panel.open ? 'none' : '';
  }

  function buildNotes() {
    if (!cfg.notes || isPresenterWindow) return;
    noteHost = document.createElement('div');
    noteHost.setAttribute('data-fw-notes', '');
    var root = noteHost.attachShadow({ mode: 'open' });
    root.innerHTML =
      '<style>' +
      ':host{all:initial;position:fixed;left:16px;bottom:16px;z-index:2147483000;font-family:"Instrument Sans",ui-sans-serif,sans-serif;color:#141518}' +
      '.btn{display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:0 14px;border-radius:999px;border:1px solid #d6d8d1;background:#f6f6f3;color:#141518;font-weight:500;font-size:13px;line-height:1;font-family:inherit;cursor:pointer;box-shadow:0 2px 10px rgba(20,21,24,.12);transition:opacity .25s cubic-bezier(.2,.7,.2,1),transform .15s}' +
      '.btn:hover{transform:translateY(-1px)}' +
      '.btn b{font:500 12px/1 "IBM Plex Mono",ui-monospace,monospace;font-variant-numeric:tabular-nums}' +
      '.btn svg{width:14px;height:14px}' +
      '.quiet .btn{opacity:0;pointer-events:none}' +
      '.panel{position:absolute;left:0;bottom:52px;width:min(360px,calc(100vw - 32px));background:#fff;border:1px solid #d6d8d1;border-radius:10px;padding:14px;box-shadow:0 10px 30px rgba(20,21,24,.18);display:none}' +
      '.panel.open{display:block}' +
      '.k{font:500 11px/1.4 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;color:#6a6d74;margin:0 0 8px}' +
      'textarea{box-sizing:border-box;width:100%;min-height:96px;resize:vertical;border:1px solid #d6d8d1;border-radius:6px;padding:10px;font-size:15px;line-height:1.45;font-family:inherit;color:#141518;background:#f6f6f3}' +
      'textarea:focus{outline:2px solid #141518;outline-offset:1px}' +
      '.row{display:flex;gap:8px;align-items:center;justify-content:space-between;margin-top:10px}' +
      '.send{min-height:36px;padding:0 14px;border-radius:6px;border:0;background:#141518;color:#f6f6f3;font-weight:600;font-size:13px;line-height:1;font-family:inherit;cursor:pointer}' +
      '.send[disabled]{opacity:.5;cursor:default}' +
      '.x{border:0;background:none;color:#6a6d74;font-size:13px;font-family:inherit;cursor:pointer;padding:6px}' +
      '.msg{font-size:13px;color:#6a6d74}' +
      '@media (prefers-reduced-motion:reduce){.btn{transition:none}}' +
      '</style>' +
      '<div class="wrap">' +
      '<div class="panel" role="dialog" aria-label="Note on this page">' +
      '<p class="k">Page <span class="pg"></span> · ' + (cfg.mode === 'admin' ? 'note to self' : 'goes to ' + (cfg.who || 'Colin')) + '</p>' +
      '<textarea maxlength="4000" placeholder="' + (cfg.mode === 'admin' ? 'What to change on this page' : 'What worked, what didn’t, what you’d change') + '"></textarea>' +
      '<div class="row"><span class="msg" aria-live="polite"></span><span><button class="x" type="button">Close</button> <button class="send" type="button">Send</button></span></div>' +
      '</div>' +
      '<button class="btn" type="button" aria-expanded="false"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z"/></svg>Note on page <b>1</b></button>' +
      '</div>';
    noteBtn = root.querySelector('.btn');
    panel = root.querySelector('.panel');
    var wrap = root.querySelector('.wrap');
    var ta = root.querySelector('textarea');
    var sendBtn = root.querySelector('.send');
    var msg = root.querySelector('.msg');
    var pg = root.querySelector('.pg');
    var notePage = 1;

    // Keys and clicks inside the box must not turn the deck's pages.
    ['keydown', 'keyup', 'keypress', 'click', 'pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'wheel'].forEach(function (t) {
      noteHost.addEventListener(t, function (e) { e.stopPropagation(); });
    });

    function setOpen(open) {
      panel.open = open;
      panel.classList.toggle('open', open);
      noteBtn.setAttribute('aria-expanded', String(open));
      if (open) {
        notePage = current ? current.page : pageFromUrl();
        pg.textContent = String(notePage);
        msg.textContent = '';
        setTimeout(function () { ta.focus(); }, 0);
      }
      updateNoteButton();
    }
    noteBtn.addEventListener('click', function () { setOpen(!panel.open); });
    root.querySelector('.x').addEventListener('click', function () { setOpen(false); });
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendBtn.click();
    });
    sendBtn.addEventListener('click', function () {
      var text = ta.value.trim();
      if (!text) { ta.focus(); return; }
      sendBtn.disabled = true;
      msg.textContent = 'Sending…';
      fetch(cfg.api + '/note', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ sid: run.sid, page: notePage, body: text, commit: cfg.commit }),
      })
        .then(function (r) {
          if (!r.ok) throw new Error(String(r.status));
          ta.value = '';
          msg.textContent = 'Sent. Thank you.';
          setTimeout(function () { if (!ta.value) setOpen(false); }, 1400);
        })
        .catch(function () { msg.textContent = 'Didn’t send. Try again?'; })
        .then(function () { sendBtn.disabled = false; });
    });

    // On a share link the button fades when the mouse is still, like a video player's controls.
    function wake() {
      wrap.classList.remove('quiet');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () { if (!panel.open) wrap.classList.add('quiet'); }, 2500);
    }
    window.addEventListener('mousemove', wake, { passive: true });
    window.addEventListener('touchstart', wake, { passive: true });
    window.addEventListener('keydown', wake);
    document.addEventListener('fullscreenchange', updateNoteButton);
    wake();

    document.body.appendChild(noteHost);
    updateNoteButton();
  }

  if (document.body) buildNotes();
  else document.addEventListener('DOMContentLoaded', buildNotes);
})();

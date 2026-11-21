#!/usr/bin/env node
/*
 * Builds the attendee companion page: every lab prompt, the homework, the 30-day plan and more cases.
 *   node scripts/companion.mjs fieldwork-day            # writes dist-companion/index.html
 *   node scripts/companion.mjs fieldwork-day out.html   # writes somewhere else
 * Reads slides/<deck>/companion.json. One self-contained HTML file, no dependencies.
 * Host it anywhere, then put the address in COURSE.companion (course.ts). The deck links to
 * #lab1 … #lab7, #policy and #plan, so keep those ids.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const deck = process.argv[2] || 'fieldwork-day';
const out = process.argv[3] || join('dist-companion', 'index.html');
const d = JSON.parse(readFileSync(join('slides', deck, 'companion.json'), 'utf8'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const prompt = (text, label = 'Prompt') =>
  `<div class="pr"><div class="pr-h"><span class="k">${esc(label)}</span><button type="button" data-copy>Copy</button></div><pre>${esc(text)}</pre></div>`;
const steps = (name, list, cls) => `<div class="side ${cls}"><span class="k">${name}</span><ol>${list.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></div>`;

const labs = d.labs
  .map(
    (l) => `<section id="lab${l.n}">
  <span class="k">${l.home ? 'Take-home lab' : `Lab ${l.n}`}</span>
  <h2>${esc(l.title)}</h2>
  <p>${esc(l.goal)}</p>
  <p class="done"><b>Done when</b> ${esc(l.done)}</p>
  ${l.prompts.map((p, i) => prompt(p, l.promptLabel || (l.prompts.length > 1 ? `Prompt ${i + 1}` : 'Prompt'))).join('\n  ')}
  <div class="two">${steps('ChatGPT', l.openai, 'oa')}${steps('Claude', l.claude, 'cl')}</div>
</section>`,
  )
  .join('\n');

const planText = `${d.plan.title}\n${d.plan.weeks.map(([k, t], i) => `Week ${i + 1}: ${k}. ${t}`).join('\n')}\n${d.plan.day30}`;
const nav = [
  ...d.labs.map((l) => [`lab${l.n}`, l.home ? 'Take-home' : `Lab ${l.n}`]),
  ['policy', 'Policy'],
  ['plan', '30 days'],
  ['try-again', 'Try again'],
  ['cases', 'Cases'],
]
  .map(([id, t]) => `<a href="#${id}">${t}</a>`)
  .join('');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fieldwork companion</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
:root { --paper: #f6f6f3; --ink: #141518; --muted: #6a6d74; --accent: #ffc400; --rule: #e1e2dc; --white: #ffffff; --sans: "Instrument Sans", sans-serif; --mono: "IBM Plex Mono", monospace; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --paper: #141518; --ink: #f1f1ec; --muted: #a3a6ad; --rule: #33363c; --white: #1e2024; } }
:root[data-theme="dark"] { --paper: #141518; --ink: #f1f1ec; --muted: #a3a6ad; --rule: #33363c; --white: #1e2024; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; scroll-padding-top: 64px; }
body { margin: 0; background: var(--paper); color: var(--ink); font: 400 17px/1.55 var(--sans); }
header, main { max-width: 860px; margin: 0 auto; padding: 0 16px; }
header { padding-top: 40px; }
h1 { font: 600 clamp(40px, 9vw, 72px)/.95 var(--sans); letter-spacing: -.05em; margin: 8px 0 16px; }
h2 { font: 600 30px/1.08 var(--sans); letter-spacing: -.03em; margin: 6px 0 10px; text-wrap: balance; }
.k { font: 500 12px/1 var(--mono); letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }
nav { position: sticky; top: 0; z-index: 2; background: var(--paper); border-bottom: 1px solid var(--ink); }
nav div { max-width: 860px; margin: 0 auto; padding: 10px 16px; display: flex; gap: 6px; overflow-x: auto; }
nav a { flex: none; font: 500 12px/1 var(--mono); letter-spacing: .04em; text-transform: uppercase; color: var(--ink); text-decoration: none; padding: 8px 10px; border: 1px solid var(--ink); background: var(--white); }
nav a:hover, nav a:focus-visible { background: var(--ink); color: var(--paper); outline: none; }
section { padding: 36px 0; border-bottom: 1px solid var(--rule); }
p { margin: 0 0 12px; max-width: 68ch; }
.done b { background: var(--accent); color: #141518; padding: 1px 6px; font-weight: 600; margin-right: 4px; }
.pr { background: var(--white); border: 1.5px solid var(--ink); margin: 14px 0; }
.pr-h { display: flex; justify-content: space-between; align-items: center; padding: 8px 8px 8px 14px; border-bottom: 1px solid var(--rule); }
.pr pre { margin: 0; padding: 14px; white-space: pre-wrap; overflow-wrap: anywhere; font: 400 15px/1.5 var(--mono); }
button { font: 500 12px/1 var(--mono); letter-spacing: .04em; text-transform: uppercase; padding: 9px 14px; border: 1px solid var(--ink); background: var(--ink); color: var(--paper); cursor: pointer; }
button:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
button.ok { background: var(--accent); color: #141518; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
.side { background: var(--white); border: 1px solid var(--rule); padding: 14px 16px; }
.side ol { margin: 10px 0 0; padding-left: 20px; display: grid; gap: 6px; font-size: 15.5px; line-height: 1.45; }
.weeks { display: grid; gap: 10px; margin: 16px 0; }
.weeks div { display: grid; grid-template-columns: 76px 1fr; gap: 12px; background: var(--white); border: 1px solid var(--rule); padding: 12px 14px; }
.weeks b { display: block; }
.cases { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
.case { background: var(--white); border: 1px solid var(--rule); padding: 14px 16px; display: grid; gap: 6px; align-content: start; font-size: 15.5px; line-height: 1.45; }
.case b { font-size: 18px; letter-spacing: -.02em; }
.case .src { font: 400 12px/1.4 var(--mono); color: var(--muted); border-top: 1px solid var(--rule); padding-top: 8px; margin-top: 4px; }
.tag { display: inline-block; border: 1px solid var(--ink); color: var(--ink); padding: 2px 6px; margin-right: 6px; text-transform: uppercase; letter-spacing: .05em; }
ul.ideas { margin: 0; padding-left: 20px; display: grid; gap: 6px; }
footer { max-width: 860px; margin: 0 auto; padding: 28px 16px 60px; color: var(--muted); font: 400 12px/1.5 var(--mono); }
@media (max-width: 640px) { .two, .cases { grid-template-columns: 1fr; } h2 { font-size: 25px; } }
</style>
</head>
<body>
<header>
  <span class="k">Fieldwork · companion page</span>
  <h1>Copy the prompts.</h1>
  <p>${esc(d.intro)}</p>
</header>
<nav><div>${nav}</div></nav>
<main>
<section id="warmup">
  <span class="k">Before Lab 1</span>
  <h2>${esc(d.warmup.title)}</h2>
  <p>${esc(d.warmup.lead)}</p>
  <ul class="ideas">${d.warmup.ideas.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
</section>
${labs}
<section id="policy">
  <span class="k">Homework</span>
  <h2>${esc(d.policy.title)}</h2>
  <p>${esc(d.policy.lead)}</p>
  ${prompt(d.policy.prompt)}
</section>
<section id="plan">
  <span class="k">After today</span>
  <h2>${esc(d.plan.title)}</h2>
  <p>${esc(d.plan.lead)}</p>
  <div class="weeks">${d.plan.weeks.map(([k, t], i) => `<div><span class="k">Week ${i + 1}</span><span><b>${esc(k)}</b>${esc(t)}</span></div>`).join('')}</div>
  <p class="done"><b>${esc(d.plan.day30)}</b></p>
  ${prompt(planText, 'The plan as text')}
</section>
<section id="try-again">
  <span class="k">Keep this going</span>
  <h2>${esc(d.tryAgain.title)}</h2>
  <p>${esc(d.tryAgain.lead)}</p>
  ${prompt(d.tryAgain.template, 'Table to copy')}
</section>
<section id="cases">
  <span class="k">Further reading</span>
  <h2>${esc(d.cases.title)}</h2>
  <p>${esc(d.cases.lead)}</p>
  <div class="cases">${d.cases.items
    .map(
      (c) => `<div class="case"><span class="k">${esc(c.where)} · ${esc(c.tool)}</span><b>${esc(c.biz)}</b><span>${esc(c.did)}</span><span>${esc(c.got)}</span><span class="src"><span class="tag">${esc(c.kind)}</span>${esc(c.src)}</span></div>`,
    )
    .join('')}</div>
</section>
</main>
<footer>Fieldwork. The Claude and ChatGPT desktop apps, for people who run a business. Menu names change; if a step does not match your screen, ask the app where the feature moved.</footer>
<script>
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-copy]');
  if (!b) return;
  var text = b.closest('.pr').querySelector('pre').textContent;
  var done = function () { b.textContent = 'Copied'; b.classList.add('ok'); setTimeout(function () { b.textContent = 'Copy'; b.classList.remove('ok'); }, 1600); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
});
</script>
</body>
</html>
`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`Wrote ${out}: ${d.labs.length} labs, ${d.cases.items.length} cases, ${(html.length / 1024).toFixed(1)} KB`);

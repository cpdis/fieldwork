#!/usr/bin/env node
/*
 * brand-check: scans slide source for things that break the Fieldwork brand.
 *
 *   node scripts/brand-check.mjs            check every slide
 *   node scripts/brand-check.mjs fieldwork-day   check one deck
 *
 * Checks
 *   colour   a hex colour that is not in assets/fieldwork/fieldwork.css
 *   font     a font that is not one of the five brand families (use var(--f-*))
 *   word     a word from the never list (supercharge, unlock, seamless, ✨ …)
 *   accent   yellow text (warning only: fine on ink, never on paper)
 *
 * Skipped: node_modules, dot-folders and vendor/ (third-party code copied unmodified).
 *
 * Opt-outs, for pages that show off-brand work on purpose:
 *   a comment "brand-check: ignore-colours" and/or "ignore-words" anywhere in a file
 *   a comment "brand-check: ignore-line" on the line itself
 *
 * No dependencies. Exits 1 when it finds an error, so it can run in CI.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const brandCss = readFileSync(join(root, 'assets/fieldwork/fieldwork.css'), 'utf8');
const norm = (h) => {
  h = h.toLowerCase();
  if (h.length === 4) h = '#' + [...h.slice(1)].map((c) => c + c).join('');
  return h;
};
const PALETTE = new Set((brandCss.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).map(norm));
const FAMILIES = ['Instrument Sans', 'IBM Plex Mono', 'Newsreader', 'Caveat', 'Source Sans 3'];
const NEVER = [
  'supercharge', 'unlock', 'unleash', 'game-changer', 'game changer', 'revolutionise', 'revolutionize',
  'seamless', 'cutting-edge', 'next-level', 'synergy', 'leverage', 'empower', '10x', 'magic', 'robot',
  '✨', '🚀', '🤖', '💡', '🔥',
];

const target = process.argv[2];
const base = join(root, 'slides', target ?? '');
const files = [];
const walk = (d) => {
  for (const n of readdirSync(d)) {
    // vendor/ holds third-party code copied unmodified (e.g. the Stageshow kit); decks restyle it through tokens.
    if (n === 'node_modules' || n === 'vendor' || n.startsWith('.')) continue;
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx|ts|css)$/.test(n)) files.push(p);
  }
};
walk(base);

const out = [];
const add = (sev, file, line, msg) => out.push({ sev, file: relative(root, file), line, msg });

for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const flags = [...src.matchAll(/brand-check:\s*([a-z, -]+)/g)].flatMap((m) => m[1].split(/[\s,]+/));
  const skipColours = flags.includes('ignore-colours');
  const skipWords = flags.includes('ignore-words');
  const isCss = f.endsWith('.css');
  src.split('\n').forEach((text, i) => {
    const ln = i + 1;
    if (text.includes('brand-check:')) return;
    // colours
    if (!skipColours) {
      for (const m of text.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
        const before = text.slice(0, m.index);
        if (/&$|url\(|href=|['"`]#[a-z-]+['"`]/.test(before.slice(-6)) || /^#[0-9]+$/.test(m[0]) && !isCss && !/color|background|fill|stroke|border|shadow/i.test(text)) continue;
        const len = m[0].length;
        if (len !== 4 && len !== 7 && len !== 9) continue;
        if (!PALETTE.has(norm(m[0].slice(0, len === 9 ? 7 : len)))) add('error', f, ln, `colour ${m[0]} is not in the brand palette`);
      }
    }
    // fonts
    for (const m of text.matchAll(/font-family\s*:\s*([^;}]+)/g)) {
      const v = m[1].trim();
      if (!/^(var\(--f-[a-z0-9]+\)|inherit|unset)$/.test(v)) add('error', f, ln, `font-family “${v}”: use var(--f-sans), var(--f-mono), var(--f-serif), var(--f-hand) or var(--f-body2)`);
    }
    for (const m of text.matchAll(/(?<![-\w])font\s*:\s*([^;}]+)/g)) {
      const v = m[1].trim();
      if (!/var\(--f-[a-z0-9]+\)|^inherit$|^unset$/.test(v)) add('error', f, ln, `font “${v}” has no brand family`);
    }
    for (const m of text.matchAll(/fontFamily\s*[:=]\s*\{?\s*['"`]([^'"`]+)['"`]/g)) {
      const v = m[1].trim();
      if (!/^var\(--f-[a-z0-9]+\)$/.test(v) && !FAMILIES.includes(v)) add('error', f, ln, `fontFamily “${v}” is not a brand font`);
    }
    // never-list words, in visible text only (skip CSS and import lines)
    if (!skipWords && !isCss && !/^\s*(import|\/\/|\*|\/\*)/.test(text)) {
      const low = text.toLowerCase();
      for (const w of NEVER) {
        const re = new RegExp(`(^|[^a-z])${w.replace(/[-]/g, '\\-')}([^a-z]|$)`, 'i');
        if (/^[a-z]/.test(w) ? re.test(low) : low.includes(w)) add('error', f, ln, `“${w}” is on the never list`);
      }
    }
    // yellow text
    if (/(?<![-\w])color\s*:\s*var\(--accent\)/.test(text)) add('warn', f, ln, 'yellow text: fine on an ink fill, never on paper');
  });
}

const errs = out.filter((o) => o.sev === 'error');
for (const o of out) console.log(`${o.sev === 'error' ? '✕' : '!'} ${o.file}:${o.line}  ${o.msg}`);
console.log(
  `\nbrand-check: ${files.length} files, ${errs.length} ${errs.length === 1 ? 'problem' : 'problems'}` +
    (out.length > errs.length ? `, ${out.length - errs.length} to eyeball` : '') +
    (errs.length ? '' : '. On brand.'),
);
process.exit(errs.length ? 1 : 0);

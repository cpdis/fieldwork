#!/usr/bin/env node
/*
 * Lists the real screenshots and clips a deck asks for, and which are still missing.
 *   node scripts/shot-list.mjs fieldwork-day          # table in the terminal
 *   node scripts/shot-list.mjs fieldwork-day --md     # markdown capture list
 * Reads slides/<deck>/shots.ts and looks in slides/<deck>/assets/shots/. No dependencies.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const deck = process.argv[2] || 'fieldwork-day';
const md = process.argv.includes('--md');
const dir = join('slides', deck);
const src = readFileSync(join(dir, 'shots.ts'), 'utf8');
const body = src.slice(src.indexOf('SHOTS: ShotSpec[] = ['));
const entries = body.split(/\n {2}\{\n/).slice(1);
const shots = entries.map((e) => {
  const o = {};
  for (const m of e.matchAll(/^\s{4}(\w+): '((?:[^'\\]|\\.)*)',?$/gm)) o[m[1]] = m[2].replace(/\\'/g, "'");
  return o;
});

const shotDir = join(dir, 'assets', 'shots');
const have = existsSync(shotDir) ? readdirSync(shotDir) : [];
const fileFor = (id) => have.find((f) => f.replace(/\.[^.]+$/, '') === id);

if (md) {
  const missing = shots.filter((s) => !fileFor(s.id));
  console.log(`# Screenshots and clips for ${deck}\n`);
  console.log(`${shots.length - missing.length} of ${shots.length} in place. Save each file as \`slides/${deck}/assets/shots/<id>.<ext>\`.\n`);
  console.log('Images: .jpg, .png or .webp, at least 1600 px wide where the source allows. Clips: .mp4 (H.264), no sound track, at most 1280 px wide, 8 to 20 seconds, under 4 MB.\n');
  console.log('| Done | File | What to capture | From | Used on |');
  console.log('|---|---|---|---|---|');
  for (const s of shots) {
    const f = fileFor(s.id);
    console.log(`| ${f ? 'yes' : ''} | \`${f || `${s.id}.${s.kind === 'clip' ? 'mp4' : 'png'}`}\` | ${s.capture} | ${s.url} | ${s.used} |`);
  }
} else {
  for (const s of shots) {
    const f = fileFor(s.id);
    console.log(`${f ? 'ok  ' : 'MISS'}  ${s.id.padEnd(12)} ${s.kind.padEnd(6)} ${s.url}`);
  }
  const n = shots.filter((s) => !fileFor(s.id)).length;
  console.log(`\n${shots.length - n} of ${shots.length} in place.`);
}

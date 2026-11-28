// Builds the course deck (open-slide, at the repo root) into this app, so the site can serve it
// behind the admin login and on share links. Runs before `next build` (see package.json).
//
//   public/admin/deck/**   the deck's assets for the admin copy (full open-slide UI, presenter view)
//   public/look/**         the deck's assets for share links (read-only player)
//   deck-build/admin.html  the two entry pages; served by route handlers that check access and
//   deck-build/look.html   add the tracker, so they never sit in public/
//   deck-build/manifest.json  page titles, blocks and the commit, for the admin and analytics
//
// Both public folders are gated by src/proxy.ts. If the deck isn't next to this app (a build
// with only site/ checked out), it writes nothing and the admin says the deck isn't built.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const SLIDE = 'fieldwork-day';
const site = resolve(import.meta.dirname, '..');
const root = resolve(site, '..');
const out = join(site, 'deck-build');
const targets = [
  { name: 'admin', base: '/admin/deck/', dir: join(site, 'public', 'admin', 'deck'), showSlideUi: true },
  { name: 'look', base: '/look/', dir: join(site, 'public', 'look'), showSlideUi: false },
];

await rm(out, { recursive: true, force: true });
for (const t of targets) await rm(t.dir, { recursive: true, force: true });

if (!existsSync(join(root, 'slides', SLIDE, 'index.tsx')) || !existsSync(join(root, 'package-lock.json'))) {
  console.warn(`[deck] slides/${SLIDE} not found next to site/; skipping the deck build.`);
  process.exit(0);
}

if (!existsSync(join(root, 'node_modules', '@open-slide', 'core'))) {
  console.log('[deck] installing the deck’s dependencies');
  execFileSync('npm', ['ci', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: root, stdio: 'inherit' });
}

const mod = (p) => import(pathToFileURL(join(root, 'node_modules', p)).href);
const { createViteConfig } = await mod('@open-slide/core/dist/vite/index.js');
const vite = await mod('vite/dist/node/index.js');

// open-slide.config.ts belongs to the deck and stays as it is; the site's builds add a base path
// and switch off the slide browser and HTML download on top of it.
const userConfig = (await vite.loadConfigFromFile({ command: 'build', mode: 'production' }, join(root, 'open-slide.config.ts'), root, 'silent'))?.config ?? {};
const tmp = join(site, '.deck-tmp');
await rm(tmp, { recursive: true, force: true });

for (const t of targets) {
  const config = {
    ...userConfig,
    base: t.base,
    build: { ...userConfig.build, showSlideBrowser: false, allowHtmlDownload: false, showSlideUi: t.showSlideUi },
  };
  const base = await createViteConfig({ userCwd: root, config, mode: 'build' });
  const outDir = join(tmp, t.name);
  await vite.build(vite.mergeConfig(base, { logLevel: 'warn', build: { outDir, emptyOutDir: true, chunkSizeWarningLimit: 4000 } }));
  await mkdir(out, { recursive: true });
  await writeFile(join(out, `${t.name}.html`), await readFile(join(outDir, 'index.html'), 'utf8'));
  await rm(join(outDir, 'index.html'));
  await mkdir(t.dir, { recursive: true });
  for (const entry of await readdir(outDir)) await cp(join(outDir, entry), join(t.dir, entry), { recursive: true });
  console.log(`[deck] built ${t.name} at ${t.base}`);
}
await rm(tmp, { recursive: true, force: true });

await writeFile(join(out, 'manifest.json'), JSON.stringify(await readManifest(), null, 2));
console.log('[deck] wrote manifest');

/** Page titles and blocks, read by rendering each page once on the server. */
async function readManifest() {
  const base = await createViteConfig({ userCwd: root, config: userConfig, mode: 'serve' });
  const server = await vite.createServer({
    ...base,
    server: { middlewareMode: true, hmr: false, watch: null },
    appType: 'custom',
    ssr: { noExternal: ['@open-slide/core'], external: ['react', 'react-dom'] },
    logLevel: 'error',
  });
  const { createElement } = await mod('react/index.js');
  const { renderToStaticMarkup } = await mod('react-dom/server.node.js');
  try {
    const deckDir = join(root, 'slides', SLIDE);
    const deck = await server.ssrLoadModule(join(deckDir, 'index.tsx'));
    const pages = deck.default;
    const notes = deck.notes ?? [];
    const blockFiles = (await readdir(join(deckDir, 'blocks'))).filter((f) => /^b\d.*\.tsx$/.test(f)).sort();
    const blockOf = new Map();
    for (const f of blockFiles) {
      const n = Number(f.match(/^b(\d+)/)[1]);
      const m = await server.ssrLoadModule(join(deckDir, 'blocks', f));
      for (const [p] of m.pages ?? []) blockOf.set(p, n);
    }
    const Ctx = globalThis.__open_slide_page_context__;
    const quiet = console.error;
    console.error = () => {};
    const out = pages.map((P, i) => {
      let title = '';
      try {
        const html = renderToStaticMarkup(createElement(Ctx.Provider, { value: { index: i, total: pages.length } }, createElement(P)));
        const h = html.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/);
        title = h ? decode(h[1].replace(/<[^>]+>/g, ' ')) : '';
      } catch {
        // A page that can't render on the server falls back to its note.
      }
      if (!title) title = i === 0 ? 'Cover' : firstSentence(notes[i] ?? '');
      const block = blockOf.has(P) ? blockOf.get(P) : null;
      return { n: i + 1, title: title.replace(/\s+/g, ' ').trim().slice(0, 90), block };
    });
    console.error = quiet;
    // A block's name is the title of its first page ("Block 3 · Context is everything").
    const blocks = [];
    for (const p of out) {
      if (p.block === null || blocks.some((b) => b.n === p.block)) continue;
      blocks.push({ n: p.block, name: p.block === 0 ? 'Opening' : `Block ${p.block} · ${p.title}`, first: p.n });
    }
    return {
      slide: SLIDE,
      title: deck.meta?.title ?? SLIDE,
      builtAt: new Date().toISOString(),
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? git(['rev-parse', 'HEAD']),
      message: process.env.VERCEL_GIT_COMMIT_MESSAGE?.split('\n')[0] ?? git(['log', '-1', '--format=%s']),
      pageCount: out.length,
      pages: out,
      blocks,
    };
  } finally {
    await server.close();
  }
}

function firstSentence(s) {
  const t = s.replace(/^[\d–-]+\s*(min|mins|sec|secs|seconds)\.\s*/i, '');
  return (t.match(/^[^.!?]{3,80}/)?.[0] ?? t.slice(0, 80)).trim();
}

function decode(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function git(args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

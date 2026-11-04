# Source

`dragology.js` is [Dragology](https://github.com/declarative-dragging/dragology) 0.1.7 (npm `dragology`, MIT; Horowitz, Blinn and Heer, "Declarative Dragging", UIST 2026), bundled into one file so the deck gains no package dependency. The deck's rules say no new dependencies, so the kit is vendored the same way Stageshow is in `../../stage/vendor/`.

- Built on 2026-11-04 from the npm tarball `dragology-0.1.7.tgz` (`dist-lib/index.js`), with esbuild 0.27:

  ```
  esbuild dist-lib/index.js --bundle --minify --format=esm --platform=browser --target=es2022 \
    --external:react --external:react-dom --external:react/jsx-runtime \
    --alias:lodash=lodash-es --alias:@joshuahhh/pretty-print=./stub/pretty-print.js \
    --legal-comments=none --outfile=dragology.js
  ```

- `react`, `react-dom` and `react/jsx-runtime` stay external (the deck's own React).
- `lodash` is satisfied by `lodash-es` 4.17.21 (same code, ESM build).
- `@joshuahhh/pretty-print` (a debugging printer that pulls in all of Prettier) is replaced by a ten-line stub that prints JSON. It is only used in Dragology's internal error overlays.
- Bundled in: lodash-es, immer, d3-delaunay, d3-color, d3-interpolate, d3-interpolate-path, d3-ease. Their licenses are in `LICENSES.md`.
- `dragology.d.ts` is the published `dist-lib/index.d.ts` with one change: the `Draft` import from immer is replaced by a local alias, since immer is not installed separately.
- `AGENTS.md` is Dragology's own authoring guide, copied unmodified. Read it before writing a draggable.

To upgrade: repeat the build with the new version, copy the new `index.d.ts` and `AGENTS.md`, and update this file.

#!/usr/bin/env node
/*
 * Compile src/styles/style.scss -> public/assets/style.css (GENERATED file).
 *
 * Preferred path: dart-sass (the `sass` devDependency), which supports the
 * full SCSS language. Fallback path (for environments where `sass` isn't
 * installed, e.g. restricted sandboxes): deterministically inline the entry's
 * `@use 'partials/x';` lines in order. The fallback only handles the plain-CSS
 * subset; it fails loudly if a partial uses SCSS-only syntax, in which case
 * `npm install` (bringing in sass) is required.
 *
 * Runs as `npm run css`, which is the first step of both dev and build.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ENTRY = path.join(ROOT, 'src', 'styles', 'style.scss');
const OUT = path.join(ROOT, 'public', 'assets', 'style.css');
const BANNER =
  '/* GENERATED from src/styles/style.scss by scripts/build_css.mjs - do not edit. */\n';

async function compileWithSass() {
  const sass = await import('sass');
  const result = sass.compile(ENTRY, { style: 'expanded', sourceMap: false });
  return result.css;
}

function compileFallback() {
  const entry = fs.readFileSync(ENTRY, 'utf8');
  const out = [];
  for (const line of entry.split('\n')) {
    const use = line.match(/^@use\s+'partials\/([\w-]+)';\s*$/);
    if (use) {
      const p = path.join(ROOT, 'src', 'styles', 'partials', `_${use[1]}.scss`);
      let css = fs.readFileSync(p, 'utf8');
      // the fallback only understands the plain-CSS subset of SCSS
      const scssOnly = css.match(
        /^\s*(\$[\w-]+\s*:|@(mixin|include|extend|if|each|function)\b)|[^&]&[\s.:#[]/m,
      );
      if (scssOnly) {
        console.error(
          `error: ${path.basename(p)} uses SCSS syntax (${scssOnly[0].trim()}); ` +
            'the plain-CSS fallback cannot compile it. Run npm install so the ' +
            'real sass compiler is available.',
        );
        process.exit(1);
      }
      // strip silent (//) comments the way sass does, preserving /* */ ones
      css = css
        .split('\n')
        .filter(l => !l.trim().startsWith('//'))
        .join('\n');
      out.push(css.trim());
    } else if (!line.trim().startsWith('//') && line.trim() !== '') {
      console.error(`error: fallback compiler can't handle entry line: ${line}`);
      process.exit(1);
    }
  }
  return out.join('\n\n') + '\n';
}

let css;
let mode;
try {
  css = await compileWithSass();
  mode = 'sass';
} catch (e) {
  if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e;
  css = compileFallback();
  mode = 'fallback (plain-CSS inline; run npm install for full SCSS support)';
}
fs.writeFileSync(OUT, BANNER + css);
console.log(`css: src/styles/style.scss -> public/assets/style.css via ${mode}`);

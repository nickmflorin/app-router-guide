import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

/* The built site goes straight to build/app-router-guide_html/ (the
   distributable folder form), same URLs and file names as always
   (sections/NN-slug.html), so every downstream tool (svg_lint,
   build_artifact.py, file:// viewing) reads one location. compressHTML
   stays off so the output remains diffable. */
export default defineConfig({
  outDir: './build/app-router-guide_html',
  build: { format: 'file' },
  compressHTML: false,
  vite: { plugins: [tailwindcss()] },
});

import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

/* The built site IS html-guide/: the same folder, URLs, and file names the
   guide has always had (sections/NN-slug.html), so every downstream tool
   (svg_lint, build_artifact.py, the annotation layer, file:// viewing)
   keeps working unchanged. compressHTML stays off so the output remains
   diffable and prettier-friendly. */
export default defineConfig({
  outDir: './html-guide',
  build: { format: 'file' },
  compressHTML: false,
  vite: { plugins: [tailwindcss()] },
});

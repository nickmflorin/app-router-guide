import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

/* Dev-only notes API. `apply: 'serve'` and the configureServer hook mean this runs ONLY under
   `astro dev`; `astro build` never applies it and never imports the middleware (the import is
   lazy), so the shipped site stays pure static HTML with no server code, no Prisma, and no DB. It
   serves /api/notes backed by the committed SQLite DB, so annotating writes straight through. */
const notesApiDev = {
  name: 'notes-api-dev',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/api/notes', async (req, res) => {
      const { handleNotes } = await import('./server/notes-middleware.mjs');
      return handleNotes(req, res);
    });
    server.middlewares.use('/api/deck', async (req, res) => {
      const { handleDeck } = await import('./server/deck-middleware.mjs');
      return handleDeck(req, res);
    });
  },
};

/* Dev-only /deck route. The deck viewer page lives in src/dev/ (outside
   src/pages/), and this integration injects the route only under `astro dev`,
   so `astro build` never emits deck.html or any deck content. */
const deckRouteDev = {
  name: 'deck-route-dev',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command === 'dev') {
        injectRoute({ pattern: '/deck', entrypoint: './src/dev/deck.astro' });
      }
    },
  },
};

/* The built site goes straight to build/output/app-router-guide_html/ (the distributable folder
   form), same URLs and file names as always (sections/NN-slug.html), so every downstream tool
   (svg_lint, build_artifact.py, file:// viewing) reads one location. compressHTML stays off so the
   output remains diffable. */
export default defineConfig({
  outDir: './build/output/app-router-guide_html',
  // The Astro dev toolbar floats bottom-center and collides with the deck HUD; this project
  // doesn't use it, so turn it off (dev-only, no build impact).
  devToolbar: { enabled: false },
  build: { format: 'file' },
  compressHTML: false,
  integrations: [deckRouteDev],
  vite: {
    plugins: [tailwindcss(), notesApiDev],
    // Junk drawers the dev server must not watch: _to_delete/ holds files the sandbox can't
    // delete (incl. stale HTML trees), .worktrees/ holds parallel git worktrees (a full second
    // copy of the project).
    server: { watch: { ignored: ['**/_to_delete/**', '**/.worktrees/**'] } },
  },
});

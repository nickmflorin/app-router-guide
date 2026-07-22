// Connect-style handler mounted at /api/notes by the dev server.
//   GET  /api/notes[?page=NN-slug.html]  -> { notes: [...] }
//   POST /api/notes  body: a note, or { notes: [...] }  -> upsert -> { notes: [...] }
// Dev-only; loaded lazily by astro.config.mjs so `astro build` never imports it.

import { listNotes, upsertNote } from './db.mjs';

function readBody(req) {
  return new Promise((resolve, reject) => {
    let b = '';
    req.on('data', c => (b += c));
    req.on('end', () => resolve(b));
    req.on('error', reject);
  });
}

function json(res, code, obj) {
  res.statusCode = code;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(obj));
}

export async function handleNotes(req, res) {
  try {
    // When mounted at /api/notes, connect strips the mount path; the query
    // string is preserved. The base is irrelevant, we only read the query.
    const url = new URL(req.url, 'http://localhost');

    if (req.method === 'GET') {
      const page = url.searchParams.get('page') || undefined;
      return json(res, 200, { notes: await listNotes(page) });
    }

    if (req.method === 'POST') {
      const body = JSON.parse((await readBody(req)) || '{}');
      const incoming = Array.isArray(body.notes) ? body.notes : [body];
      const saved = [];
      for (const n of incoming) {
        if (n && n.id) saved.push(await upsertNote(n));
      }
      return json(res, 200, { notes: saved });
    }

    res.statusCode = 405;
    res.end('Method Not Allowed');
  } catch (e) {
    // A bad enum value is the client's fault (400); anything else is ours (500).
    const code = e && e.code === 'ENUM' ? 400 : 500;
    json(res, code, { error: String((e && e.message) || e) });
  }
}

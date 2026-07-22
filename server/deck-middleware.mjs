// Connect-style handler mounted at /api/deck by the dev server.
//   GET    /api/deck                 -> { slides: [ { ...slide, items:[...] } ] }
//   POST   /api/deck/slide  {slide}  -> upsert -> { slide }
//   POST   /api/deck/item   {item}   -> upsert -> { item }
//   DELETE /api/deck/slide?id=       -> 204
//   DELETE /api/deck/item?id=        -> 204
// Dev-only; loaded lazily by astro.config.mjs so `astro build` never imports it.

import { listDeck, upsertSlide, upsertItem, deleteSlide, deleteItem } from './deck-db.mjs';

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

export async function handleDeck(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname.replace(/\/$/, ''); // '', '/slide', '/item'

    if (req.method === 'GET') {
      return json(res, 200, { slides: await listDeck() });
    }

    if (req.method === 'POST') {
      const body = JSON.parse((await readBody(req)) || '{}');
      if (path.endsWith('/slide') && body.slide) {
        return json(res, 200, { slide: await upsertSlide(body.slide) });
      }
      if (path.endsWith('/item') && body.item) {
        return json(res, 200, { item: await upsertItem(body.item) });
      }
      return json(res, 400, { error: 'POST /api/deck/slide {slide} or /api/deck/item {item}' });
    }

    if (req.method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (id && path.endsWith('/slide')) await deleteSlide(id);
      else if (id && path.endsWith('/item')) await deleteItem(id);
      res.statusCode = 204;
      return res.end();
    }

    res.statusCode = 405;
    res.end('Method Not Allowed');
  } catch (e) {
    const code = e && e.code === 'ENUM' ? 400 : 500;
    json(res, code, { error: String((e && e.message) || e) });
  }
}

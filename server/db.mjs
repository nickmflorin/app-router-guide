// Dev-only notes store: a Prisma client over the committed SQLite DB, plus the
// wire<->row mapping the browser annotation layer expects. Imported only by the
// dev server (astro.config.mjs) and the seed script; never bundled into the
// static build.

import { PrismaClient } from '@prisma/client';
import { NoteStatus, NoteKind, assertStatus, assertKind } from './note-enums.mjs';

// A singleton that survives Vite's dev-server HMR (which re-evaluates modules),
// so we don't open a new connection pool on every reload.
const g = globalThis;
export const prisma = g.__notesPrisma ?? new PrismaClient();
if (!g.__notesPrisma) g.__notesPrisma = prisma;

// Row -> the shape nav.js already understands ({ id, page, status, text,
// resolution, ts, target: { anchor, tag, snippet, path } }).
function toWire(n) {
  return {
    id: n.id,
    page: n.page,
    kind: n.kind,
    status: n.status,
    text: n.text,
    resolution: n.resolution ?? undefined,
    ts: n.createdAt.toISOString(),
    target: {
      anchor: n.targetAnchor ?? undefined,
      tag: n.targetTag ?? undefined,
      snippet: n.targetSnippet ?? undefined,
      path: n.targetPath ? JSON.parse(n.targetPath) : undefined,
    },
  };
}

// Wire note -> the column set. `target` is flattened; `path` is JSON-encoded.
function toColumns(n) {
  const t = n.target ?? {};
  const kind = assertKind(n.kind ?? NoteKind.Note);
  const status = assertStatus(n.status ?? NoteStatus.Open);
  return {
    page: n.page,
    kind,
    status,
    text: n.text ?? '',
    resolution: n.resolution ?? null,
    targetAnchor: t.anchor ?? null,
    targetTag: t.tag ?? null,
    targetSnippet: t.snippet ?? null,
    targetPath: t.path != null ? JSON.stringify(t.path) : null,
  };
}

export async function listNotes(page) {
  const rows = await prisma.note.findMany({
    where: page ? { page } : undefined,
    orderBy: { createdAt: 'asc' },
  });
  return rows.map(toWire);
}

export async function upsertNote(n) {
  const data = toColumns(n);
  const row = await prisma.note.upsert({
    where: { id: n.id },
    // Preserve the original timestamp when the client supplies one (e.g. seed).
    create: { id: n.id, ...data, ...(n.ts ? { createdAt: new Date(n.ts) } : {}) },
    update: data,
  });
  return toWire(row);
}

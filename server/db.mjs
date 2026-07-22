import { PrismaClient } from '@prisma/client';
import {
  NoteStatus,
  NoteKind,
  NoteSurface,
  assertStatus,
  assertKind,
  assertSurface,
} from './note-enums.mjs';

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
    surface: n.surface,
    status: n.status,
    text: n.text,
    resolution: n.resolution ?? undefined,
    ts: n.createdAt.toISOString(),
    slideId: n.slideId ?? undefined,
    slideItemId: n.slideItemId ?? undefined,
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
  const surface = assertSurface(n.surface ?? NoteSurface.Doc);
  return {
    page: n.page,
    kind,
    surface,
    status,
    text: n.text ?? '',
    resolution: n.resolution ?? null,
    targetAnchor: t.anchor ?? null,
    targetTag: t.tag ?? null,
    targetSnippet: t.snippet ?? null,
    targetPath: t.path != null ? JSON.stringify(t.path) : null,
    slideId: n.slideId ?? null,
    slideItemId: n.slideItemId ?? null,
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

export async function deleteNote(id) {
  // Ignore "record not found" so deleting an unsynced/already-gone note is a no-op.
  await prisma.note.delete({ where: { id } }).catch(() => {});
}

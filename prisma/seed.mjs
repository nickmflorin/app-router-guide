import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { upsertNote } from '../server/db.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const jsonPath = join(here, '..', 'public', 'page-notes.json');

let raw;
try {
  raw = JSON.parse(await readFile(jsonPath, 'utf8'));
} catch {
  console.log('no public/page-notes.json to import; nothing to seed.');
  process.exit(0);
}

let n = 0;
for (const note of raw.notes ?? []) {
  if (note && note.id) {
    await upsertNote(note);
    n++;
  }
}
console.log(`seeded ${n} note(s) into prisma/notes.db`);
process.exit(0);

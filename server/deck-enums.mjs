// Single source of truth for slide-deck enums. Like the note enums, SQLite
// can't store native Prisma enums, so these are plain string columns whose
// allowed values live here; every writer validates against them.

import { EnumError } from './note-enums.mjs';

/** How a slide arranges its items. */
export const SlideLayout = Object.freeze({
  Free: 'free', // stacked / author-arranged
  Row: 'row', // items side by side
  Column: 'column', // items stacked vertically
  Grid: 'grid', // items in a grid
});

export const SLIDE_LAYOUTS = Object.freeze(Object.values(SlideLayout));

export function assertLayout(v) {
  if (!SLIDE_LAYOUTS.includes(v)) {
    throw new EnumError(`invalid layout "${v}"; expected one of: ${SLIDE_LAYOUTS.join(', ')}`);
  }
  return v;
}

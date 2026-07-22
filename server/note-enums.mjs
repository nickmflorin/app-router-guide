/** @typedef {'open' | 'resolved'} NoteStatusValue */
/** @typedef {'note' | 'slide'} NoteKindValue */

export const NoteStatus = Object.freeze({
  Open: 'open',
  Resolved: 'resolved',
});

export const NoteKind = Object.freeze({
  Note: 'note',
  Slide: 'slide', // reserved for the future slide-deck designations
});

export const NOTE_STATUSES = Object.freeze(Object.values(NoteStatus));
export const NOTE_KINDS = Object.freeze(Object.values(NoteKind));

/** Thrown when a value is outside its enum; the API maps this to HTTP 400. */
export class EnumError extends Error {
  constructor(message) {
    super(message);
    this.name = 'EnumError';
    this.code = 'ENUM';
  }
}

export function assertStatus(v) {
  if (!NOTE_STATUSES.includes(v)) {
    throw new EnumError(`invalid status "${v}"; expected one of: ${NOTE_STATUSES.join(', ')}`);
  }
  return v;
}

export function assertKind(v) {
  if (!NOTE_KINDS.includes(v)) {
    throw new EnumError(`invalid kind "${v}"; expected one of: ${NOTE_KINDS.join(', ')}`);
  }
  return v;
}

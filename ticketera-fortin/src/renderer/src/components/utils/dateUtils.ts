// YYYY-MM-DD in the PC's timezone. toISOString() uses UTC, which in Argentina is already the
// next day after 21:00 — exactly when events run.
export const toLocalDateString = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

import { describe, expect, it } from 'vitest'
import { toLocalDateString } from './dateUtils'

describe('toLocalDateString', () => {
  it('uses the local calendar day, not the UTC one', () => {
    // 23:30 local time: toISOString() would already report the next day west of UTC.
    expect(toLocalDateString(new Date(2026, 9, 20, 23, 30))).toBe('2026-10-20')
  })

  it('pads month and day', () => {
    expect(toLocalDateString(new Date(2026, 0, 5, 12))).toBe('2026-01-05')
  })
})

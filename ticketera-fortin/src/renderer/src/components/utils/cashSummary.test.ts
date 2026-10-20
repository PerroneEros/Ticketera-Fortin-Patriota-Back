import { describe, expect, it } from 'vitest'
import { formatMoney } from './cashSummary'

// Dashboard totals are computed by the API now (salesSummaryService); its test keeps a frozen
// copy of the old screen logic as the reference.

describe('formatMoney', () => {
  it('formats whole pesos with Argentine thousands separators', () => {
    expect(formatMoney(1234567)).toBe('$1.234.567')
    expect(formatMoney(-500)).toBe('$-500')
  })
})

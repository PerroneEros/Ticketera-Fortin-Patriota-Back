import { describe, expect, it } from 'vitest'
import { escapeHtml } from './escapeHtml'

describe('escapeHtml', () => {
  it('neutralizes markup so it is shown as text', () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'
    )
  })

  it('escapes ampersands and single quotes', () => {
    expect(escapeHtml("Fernet & Coca 'grande'")).toBe('Fernet &amp; Coca &#39;grande&#39;')
  })

  it('leaves regular product names untouched', () => {
    expect(escapeHtml('Choripán 1/2')).toBe('Choripán 1/2')
  })
})

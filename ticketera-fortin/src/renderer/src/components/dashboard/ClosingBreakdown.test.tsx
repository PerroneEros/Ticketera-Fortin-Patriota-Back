// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { ClosingBreakdown } from './ClosingBreakdown'

afterEach(cleanup)

describe('ClosingBreakdown', () => {
  it('shows expected, counted and difference per method and in total', () => {
    render(
      <ClosingBreakdown
        register={{
          closing: 20000,
          expected_cash: 14300,
          counted_cash: 14000,
          expected_transfer: 6000,
          counted_transfer: 6000
        }}
      />
    )

    const cash = within(screen.getByText('Efectivo').closest('tr') as HTMLElement)
    expect(cash.getByText('$14.300')).toBeTruthy()
    expect(cash.getByText('$14.000')).toBeTruthy()
    expect(cash.getByText('$-300')).toBeTruthy()
    const transfer = within(screen.getByText('Transferencias').closest('tr') as HTMLElement)
    expect(transfer.getAllByText('$6.000')).toHaveLength(2)
    expect(transfer.getByText('$0')).toBeTruthy()
    const total = within(screen.getByText('Diferencia total').closest('tr') as HTMLElement)
    expect(total.getByText('$-300')).toBeTruthy()
  })

  it('marks registers closed by an older version and shows their counted total', () => {
    render(
      <ClosingBreakdown
        register={{
          closing: 25000,
          expected_cash: null,
          counted_cash: null,
          expected_transfer: null,
          counted_transfer: null
        }}
      />
    )

    expect(screen.getByText(/Cierre sin desglose \(versión anterior\)/).textContent).toContain(
      '$25.000'
    )
    expect(screen.queryByText('Diferencia total')).toBeNull()
  })
})

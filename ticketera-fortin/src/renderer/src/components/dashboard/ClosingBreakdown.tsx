import { formatMoney } from '../utils/cashSummary'

export interface ClosedRegisterAmounts {
  closing: number
  counted_cash?: number | null
  counted_transfer?: number | null
  expected_cash?: number | null
  expected_transfer?: number | null
}

const signed = (amount: number): string =>
  amount > 0 ? `+${formatMoney(amount)}` : formatMoney(amount)
const color = (amount: number): string =>
  amount > 0 ? '#22c55e' : amount < 0 ? '#ef4444' : '#9ca3af'

// Expected, counted and difference per method as stored when the register was closed (RF-16).
// Registers closed by older versions only have the counted total (RF-17).
export const ClosingBreakdown = ({
  register
}: {
  register: ClosedRegisterAmounts
}): React.JSX.Element => {
  const { counted_cash, counted_transfer, expected_cash, expected_transfer } = register
  if (
    counted_cash == null ||
    counted_transfer == null ||
    expected_cash == null ||
    expected_transfer == null
  ) {
    return (
      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
        Cierre sin desglose (versión anterior) · Total contado:{' '}
        {formatMoney(Number(register.closing))}
      </div>
    )
  }

  const rows = [
    { label: 'Efectivo', expected: expected_cash, counted: counted_cash },
    { label: 'Transferencias', expected: expected_transfer, counted: counted_transfer }
  ].map((row) => ({ ...row, diff: row.counted - row.expected }))
  const total = rows.reduce((sum, row) => sum + row.diff, 0)

  return (
    <table style={{ fontSize: '12px', marginTop: '6px', marginLeft: 'auto', textAlign: 'right' }}>
      <thead>
        <tr style={{ color: '#94a3b8' }}>
          <th />
          <th style={{ padding: '0 6px' }}>Esperado</th>
          <th style={{ padding: '0 6px' }}>Contado</th>
          <th style={{ padding: '0 6px' }}>Diferencia</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <td style={{ textAlign: 'left', color: '#475569' }}>{row.label}</td>
            <td style={{ padding: '0 6px' }}>{formatMoney(row.expected)}</td>
            <td style={{ padding: '0 6px' }}>{formatMoney(row.counted)}</td>
            <td style={{ padding: '0 6px', color: color(row.diff), fontWeight: 'bold' }}>
              {signed(row.diff)}
            </td>
          </tr>
        ))}
        <tr>
          <td style={{ textAlign: 'left', color: '#475569' }} colSpan={3}>
            Diferencia total
          </td>
          <td style={{ padding: '0 6px', color: color(total), fontWeight: 'bold' }}>
            {signed(total)}
          </td>
        </tr>
      </tbody>
    </table>
  )
}

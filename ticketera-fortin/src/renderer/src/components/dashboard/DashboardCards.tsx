import React from 'react'
import { Sale } from '../context/dashboardContext'

export const DashboardCards = ({ sales }: { sales: Sale[] }) => {
  const ventasReales = sales.filter(
    (s) =>
      s.paymentMethod !== 'apertura' &&
      s.paymentMethod !== 'cierre' &&
      s.paymentMethod !== 'ingreso' &&
      s.paymentMethod !== 'egreso'
  )

  const cantidadVentas = ventasReales.length

  const cantidadProductos = ventasReales.reduce((acc, sale) => {
    const itemsCount = sale.Sale_items
      ? sale.Sale_items.reduce((sum: any, item: any) => sum + (Number(item.quantity) || 0), 0)
      : 0
    return acc + itemsCount
  }, 0)

  let granTotal = 0

  sales.forEach((sale) => {
    if (sale.paymentMethod === 'cierre') return

    const cash = Number(sale.cashAmount) || 0
    const transfer = Number(sale.transferAmount) || 0
    const sumaMovimiento = cash + transfer

    if (sale.paymentMethod === 'egreso') {
      granTotal -= sumaMovimiento
    } else {
      granTotal += sumaMovimiento
    }
  })

  const cardStyle = {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px'
  }

  return (
    <div className="dashboard-cards" style={{ display: 'flex', gap: '20px', width: '100%' }}>
      <div style={cardStyle}>
        <span style={{ color: 'gray', fontSize: '14px' }}>Ventas</span>
        <span style={{ fontSize: '24px', color: '#334155' }}>{cantidadVentas}</span>
      </div>

      <div style={cardStyle}>
        <span style={{ color: 'gray', fontSize: '14px' }}>Total en Caja</span>
        <span style={{ fontSize: '24px', color: '#0ea5e9' }}>
          $
          {granTotal.toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </span>
      </div>

      <div style={cardStyle}>
        <span style={{ color: 'gray', fontSize: '14px' }}>Productos</span>
        <span style={{ fontSize: '24px', color: '#334155' }}>{cantidadProductos}</span>
      </div>
    </div>
  )
}

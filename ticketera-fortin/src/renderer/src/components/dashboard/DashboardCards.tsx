import React from 'react'
import { SalesSummary } from '../service/salesService'

export const DashboardCards = ({ summary }: { summary: SalesSummary }) => {
  const cantidadVentas = summary.salesCount
  const cantidadProductos = summary.unitsCount
  const granTotal = summary.money.total

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

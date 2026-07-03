import React from 'react'

export const DashboardCards = () => {
  // Estos son los Mocks (datos falsos por ahora)
  const stats = {
    ventas: 1,
    ingresos: 330.60,
    productos: 8
  }

  const cardStyle = {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    flex: 1
  }

  return (
    <div className="dashboard-cards" style={{ display: 'flex', gap: '20px' }}>
      <div style={cardStyle}>
        <p style={{ margin: 0, color: 'gray', fontSize: '14px' }}>Ventas</p>
        <h2 style={{ margin: '5px 0 0 0' }}>{stats.ventas}</h2>
      </div>

      <div style={cardStyle}>
        <p style={{ margin: 0, color: 'gray', fontSize: '14px' }}>Total ingresos</p>
        <h2 style={{ margin: '5px 0 0 0', color: '#0ea5e9' }}>${stats.ingresos.toFixed(2)}</h2>
      </div>

      <div style={cardStyle}>
        <p style={{ margin: 0, color: 'gray', fontSize: '14px' }}>Productos</p>
        <h2 style={{ margin: '5px 0 0 0' }}>{stats.productos}</h2>
      </div>
    </div>
  )
}
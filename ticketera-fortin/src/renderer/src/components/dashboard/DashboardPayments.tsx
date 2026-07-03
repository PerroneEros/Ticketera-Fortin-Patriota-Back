import React from 'react'

export const DashboardPayments = () => {
  const pagoStyle = {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    flex: 1
  }

  return (
    <div className="dashboard-payments" style={{ display: 'flex', gap: '20px' }}>
      {/* Caja Efectivo */}
      <div style={pagoStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, color: 'gray', fontSize: '14px' }}>Efectivo</p>
            <h3 style={{ margin: '5px 0', color: '#22c55e' }}>$120.00</h3>
            <span style={{ fontSize: '12px', color: 'gray' }}>1 venta</span>
          </div>
        </div>
        {/* Barra de progreso visual */}
        <div style={{ width: '100%', height: '6px', background: '#e5e7eb', borderRadius: '3px', marginTop: '10px' }}>
          <div style={{ width: '35%', height: '100%', background: '#22c55e', borderRadius: '3px' }}></div>
        </div>
      </div>

      {/* Caja Transferencia */}
      <div style={pagoStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, color: 'gray', fontSize: '14px' }}>Transferencia</p>
            <h3 style={{ margin: '5px 0', color: '#3b82f6' }}>$210.60</h3>
            <span style={{ fontSize: '12px', color: 'gray' }}>1 venta</span>
          </div>
        </div>
        {/* Barra de progreso visual */}
        <div style={{ width: '100%', height: '6px', background: '#e5e7eb', borderRadius: '3px', marginTop: '10px' }}>
          <div style={{ width: '65%', height: '100%', background: '#3b82f6', borderRadius: '3px' }}></div>
        </div>
      </div>
    </div>
  )
}
import React from 'react'

export const DashboardHistory = () => {
  const mockTickets = [
    { 
      id: '0001', 
      method: 'combinado', 
      total: 330.60, 
      items: 8, 
      date: '2/7/2026 - 06:36 p.m.',
      type: 'ticket',
      cashAmount: 120.00,
      transferAmount: 210.60
    },
    { 
      id: '0002', 
      method: 'efectivo', 
      total: 150.00, 
      items: 3, 
      date: '2/7/2026 - 07:15 p.m.',
      type: 'ticket'
    },
    { 
      id: '0003', 
      method: 'ingreso', 
      total: 5000.00, 
      date: '2/7/2026 - 08:00 p.m.',
      type: 'movimiento',
      description: 'Fondo de caja extra'
    },
    { 
      id: '0004', 
      method: 'egreso', 
      total: 1500.00, 
      date: '2/7/2026 - 08:30 p.m.',
      type: 'movimiento',
      description: 'Pago a proveedor de hielo'
    }
  ]

  const getMethodBadge = (method: string) => {
    let bgColor = '#e5e7eb'
    let color = 'gray'

    if (method === 'combinado') {
      bgColor = '#dbeafe'; color = '#3b82f6' 
    } else if (method === 'efectivo') {
      bgColor = '#dcfce7'; color = '#22c55e' 
    } else if (method === 'transferencia') {
      bgColor = '#f3e8ff'; color = '#a855f7' 
    } else if (method === 'ingreso') {
      bgColor = '#dcfce7'; color = '#16a34a' 
    } else if (method === 'egreso') {
      bgColor = '#fee2e2'; color = '#ef4444' 
    }

    return (
      <span style={{ 
        background: bgColor, 
        color: color, 
        padding: '3px 10px', 
        borderRadius: '12px', 
        fontSize: '11px', 
        fontWeight: 'bold',
        marginLeft: '10px',
        textTransform: 'uppercase'
      }}>
        {method}
      </span>
    )
  }

  return (
    <div className="dashboard-history" style={{ 
      background: 'white', 
      padding: '25px', 
      borderRadius: '10px', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)' 
    }}>
      <h3 style={{ margin: '0 0 20px 0', color: 'gray', fontSize: '16px' }}>
        💲 Historial de tickets y movimientos
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {mockTickets.map((item, index) => (
          <div key={item.id} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '16px 0',
            borderBottom: index === mockTickets.length - 1 ? 'none' : '1px solid #f3f4f6'
          }}>
            
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                <strong style={{ fontSize: '15px' }}>
                  {item.type === 'ticket' ? `Ticket #${item.id}` : `Movimiento #${item.id}`}
                </strong>
                {getMethodBadge(item.method)}
              </div>
              <div style={{ color: 'gray', fontSize: '13px' }}>
                {item.date}
              </div>
              
              {item.method === 'combinado' && item.cashAmount && item.transferAmount && (
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  Efectivo: <strong>${item.cashAmount.toFixed(2)}</strong> | Transf: <strong>${item.transferAmount.toFixed(2)}</strong>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <strong style={{ 
                color: item.method === 'egreso' ? '#ef4444' : '#0ea5e9', 
                fontSize: '16px', 
                display: 'block' 
              }}>
                {item.method === 'egreso' ? '-' : ''}${item.total.toFixed(2)}
              </strong>
              <span style={{ color: 'gray', fontSize: '13px' }}>
                {item.type === 'ticket' ? `${item.items} productos` : item.description}
              </span>
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}
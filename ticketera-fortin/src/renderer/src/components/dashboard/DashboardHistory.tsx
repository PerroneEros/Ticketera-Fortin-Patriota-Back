import React from 'react'
import { useDashboardContext } from '../context/dashboardContext'

export const DashboardHistory = () => {
  const { sales, isLoading } = useDashboardContext()

  const getMethodBadge = (method: string) => {
    let bgColor = '#e5e7eb'; let color = 'gray'
    if (method === 'combinado') { bgColor = '#dbeafe'; color = '#3b82f6' }
    else if (method === 'efectivo') { bgColor = '#dcfce7'; color = '#22c55e' }
    else if (method === 'transferencia') { bgColor = '#f3e8ff'; color = '#a855f7' }
    else if (method === 'ingreso') { bgColor = '#dcfce7'; color = '#16a34a' }
    else if (method === 'egreso') { bgColor = '#fee2e2'; color = '#ef4444' }
    else if (method === 'apertura') { bgColor = '#fef08a'; color = '#a16207' }

    return (
      <span style={{ 
        background: bgColor, 
        color: color, 
        padding: '2px 8px',
        borderRadius: '12px', 
        fontSize: '10px', 
        fontWeight: 'bold',
        marginLeft: '8px',
        textTransform: 'uppercase',
        display: 'inline-block',
        verticalAlign: 'middle'
      }}>
        {method}
      </span>
    )
  }

  if (isLoading) return <p>Cargando...</p>

  return (
    <div className="dashboard-history" style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <h3 style={{ margin: '0 0 20px 0', color: 'gray', fontSize: '16px' }}>Historial</h3>
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '400px', overflowY: 'auto' }}>
        
        {sales.map((sale) => (
          <div key={sale.sales_id} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '16px 0',
            borderBottom: '1px solid #f3f4f6'
          }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {getMethodBadge(sale.paymentMethod)}
              </div>
              
              <span style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px', marginLeft: '10px' }}>
                {new Date(sale.date).toLocaleString()}
              </span>
              
              {(sale as any).description && (
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', marginLeft: '10px' }}>
                  Detalle: <strong>{(sale as any).description}</strong>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <strong style={{ color: sale.paymentMethod === 'egreso' ? '#ef4444' : '#0ea5e9', fontSize: '16px' }}>
                {sale.paymentMethod === 'egreso' ? '-' : ''}${sale.total.toFixed(2)}
              </strong>
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}
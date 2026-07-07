import React from 'react'
import { useDashboardContext } from '../context/dashboardContext'

export const DashboardHistory = () => {
  const { sales, isLoading, currentCashBox, timeFilter } = useDashboardContext()

  const filteredSales = (timeFilter === 'Día' && currentCashBox) 
    ? sales.filter(s => new Date(s.date).getTime() >= new Date(currentCashBox.opened_at).getTime())
    : sales

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
        background: bgColor, color: color, padding: '2px 8px', borderRadius: '12px', 
        fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase',
        display: 'inline-block'
      }}>
        {method}
      </span>
    )
  }

  const renderMethodDetails = (sale: any) => {
    if (sale.paymentMethod === 'combinado') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
          {getMethodBadge('combinado')}
          <span style={{ fontSize: '9px', color: '#6b7280' }}>
            Efectivo: ${sale.cashAmount?.toFixed(2)} | Transf: ${sale.transferAmount?.toFixed(2)}
          </span>
        </div>
      )
    }
    return getMethodBadge(sale.paymentMethod)
  }

  if (isLoading) return <p>Cargando historial...</p>

  return (
    <div className="dashboard-history" style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <h3 style={{ margin: '0 0 20px 0', color: 'gray', fontSize: '16px' }}>
        Historial {currentCashBox && timeFilter === 'Día' ? '(Turno Actual)' : '(General)'}
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '400px', overflowY: 'auto' }}>
        {filteredSales.map((sale) => (
          <div key={sale.sales_id} style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 0', borderBottom: '1px solid #f3f4f6'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              {renderMethodDetails(sale)}
              
              <span style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>
                {new Date(sale.date).toLocaleString()}
              </span>
              
              {sale.description && (
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  Descripción: <strong>{sale.description}</strong>
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
import React from 'react'
import { Sale } from '../context/dashboardContext'

interface Props {
  sales: Sale[]
  cashBox: any
}

export const DashboardHistory = ({ sales, cashBox }: Props) => {
  const getMethodBadge = (sale: any) => {
    const method = sale.paymentMethod
    let bgColor = '#e5e7eb'
    let color = 'gray'
    let displayText = method

    if (method === 'combinado') {
      bgColor = '#dbeafe'
      color = '#3b82f6'
    } else if (method === 'efectivo') {
      bgColor = '#dcfce7'
      color = '#22c55e'
    } else if (method === 'transferencia') {
      bgColor = '#f3e8ff'
      color = '#a855f7'
    } else if (method === 'ingreso') {
      bgColor = '#dcfce7'
      color = '#16a34a'
      // Verificamos si la plata entró en efectivo o por transferencia
      displayText = sale.cashAmount > 0 ? 'INGRESO EFECTIVO' : 'INGRESO TRANSFERENCIA'
    } else if (method === 'egreso') {
      bgColor = '#fee2e2'
      color = '#ef4444'
      // Lo mismo para los egresos
      displayText = sale.cashAmount > 0 ? 'EGRESO EFECTIVO' : 'EGRESO TRANSFERENCIA'
    } else if (method === 'apertura') {
      bgColor = '#fef08a'
      color = '#a16207'
    } else if (method === 'cierre') {
      bgColor = '#cbd5e1'
      color = '#334155'
    }

    return (
      <span
        style={{
          background: bgColor,
          color: color,
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '10px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          display: 'inline-block'
        }}
      >
        {displayText}
      </span>
    )
  }

  const renderMethodDetails = (sale: any) => {
    if (sale.paymentMethod === 'combinado') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
          {getMethodBadge(sale)}
          <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
            Efvo: $
            {sale.cashAmount?.toLocaleString('es-AR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}{' '}
            | Transf: $
            {sale.transferAmount?.toLocaleString('es-AR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </span>
        </div>
      )
    }
    return getMethodBadge(sale)
  }

  const displaySales = [...sales]
  if (cashBox.status === 'closed') {
    displaySales.unshift({
      sales_id: cashBox.cash_register_id + 900000,
      total: cashBox.closing,
      paymentMethod: 'cierre',
      cashAmount: 0,
      transferAmount: 0,
      date: cashBox.closed_at,
      Sale_items: [],
      description: `Cierre de Caja`
    } as any)
  }

  return (
    <div
      className="dashboard-history"
      style={{
        background: 'white',
        padding: '25px',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}
    >
      <h3
        style={{
          margin: '0 0 20px 0',
          color: '#475569',
          fontSize: '15px',
          textTransform: 'uppercase',
          fontWeight: 'bold'
        }}
      >
        HISTORIAL
      </h3>

      <div
        style={{ display: 'flex', flexDirection: 'column', maxHeight: '400px', overflowY: 'auto' }}
      >
        {displaySales.length === 0 ? (
          <p style={{ color: 'gray', textAlign: 'center', fontSize: '14px', padding: '20px 0' }}>
            No hay movimientos en esta caja
          </p>
        ) : (
          displaySales.map((sale) => (
            <div
              key={sale.sales_id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 0',
                borderBottom: '1px solid #f8fafc'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                {renderMethodDetails(sale)}

                <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                  {new Date(sale.date).toLocaleString()}
                </span>

                {sale.description && (
                  <div style={{ fontSize: '13px', color: '#475569', marginTop: '6px' }}>
                    {sale.description}
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'right' }}>
                <strong
                  style={{
                    color: sale.paymentMethod === 'egreso' ? '#ef4444' : '#0ea5e9',
                    fontSize: '18px'
                  }}
                >
                  {sale.paymentMethod === 'egreso' ? '-' : ''}$
                  {sale.total.toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </strong>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

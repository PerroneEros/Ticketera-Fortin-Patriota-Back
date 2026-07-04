import React from 'react'
import { useDashboardContext } from '../context/dashboardContext'

export const DashboardHistory = () => {
  // Nos traemos las ventas reales desde tu contexto
  const { sales, isLoading } = useDashboardContext()

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

  // Función para formatear la fecha que viene del backend
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true
    }).format(date)
  }

  // Mensaje mientras esperamos que el backend responda
  if (isLoading) {
    return (
      <div className="dashboard-history" style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 20px 0', color: 'gray', fontSize: '16px' }}>
          Historial de tickets y movimientos
        </h3>
        <p style={{ color: 'gray', textAlign: 'center' }}>Cargando historial...</p>
      </div>
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
        Historial de tickets y movimientos
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        
        {/* Si no hay ventas, mostramos un aviso */}
        {sales.length === 0 ? (
          <p style={{ color: 'gray', textAlign: 'center', padding: '20px 0' }}>
            No hay movimientos registrados.
          </p>
        ) : (
          /* Mapeamos el array REAL de ventas */
          sales.map((sale, index) => {
            // Contamos los productos dentro de este ticket
            const itemsCount = sale.Sale_items ? sale.Sale_items.reduce((sum, item) => sum + item.quantity, 0) : 0
            const isMovement = sale.paymentMethod === 'ingreso' || sale.paymentMethod === 'egreso'

            return (
              <div key={sale.sales_id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '16px 0',
                borderBottom: index === sales.length - 1 ? 'none' : '1px solid #f3f4f6'
              }}>
                
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <strong style={{ fontSize: '15px' }}>
                      {isMovement ? `Movimiento #${sale.sales_id}` : `Ticket #${sale.sales_id}`}
                    </strong>
                    {getMethodBadge(sale.paymentMethod)}
                  </div>
                  <div style={{ color: 'gray', fontSize: '13px' }}>
                    {formatDate(sale.date)}
                  </div>
                  
                  {/* Desglose para pagos combinados */}
                  {sale.paymentMethod === 'combinado' && (
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      Efectivo: <strong>${sale.cashAmount.toFixed(2)}</strong> | Transf: <strong>${sale.transferAmount.toFixed(2)}</strong>
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <strong style={{ 
                    color: sale.paymentMethod === 'egreso' ? '#ef4444' : '#0ea5e9', 
                    fontSize: '16px', 
                    display: 'block' 
                  }}>
                    {sale.paymentMethod === 'egreso' ? '-' : ''}${sale.total.toFixed(2)}
                  </strong>
                  <span style={{ color: 'gray', fontSize: '13px' }}>
                    {isMovement ? 'Ajuste de caja' : `${itemsCount} productos`}
                  </span>
                </div>

              </div>
            )
          })
        )}

      </div>
    </div>
  )
}
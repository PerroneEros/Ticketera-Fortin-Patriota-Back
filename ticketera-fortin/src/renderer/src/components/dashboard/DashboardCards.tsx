import React from 'react'
import { Sale } from '../context/dashboardContext'

export const DashboardCards = ({ sales }: { sales: Sale[] }) => {
  
  //Filtramos para ignorar aperturas, cierres, ingresos y egresos manuales.
  const ventasReales = sales.filter(sale => 
    sale.paymentMethod !== 'ingreso' && 
    sale.paymentMethod !== 'egreso' && 
    sale.paymentMethod !== 'apertura' &&
    sale.paymentMethod !== 'cierre'
  )

  const totalVentas = ventasReales.length

  // Sumamos el total SOLO de las ventas reales
  const totalIngresos = ventasReales.reduce((acc, sale) => acc + sale.total, 0)

  const totalProductos = ventasReales.reduce((acc, sale) => {
    const itemsCount = sale.Sale_items ? sale.Sale_items.reduce((sum: any, item: any) => sum + item.quantity, 0) : 0
    return acc + itemsCount
  }, 0)
  
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
        <h2 style={{ margin: '5px 0 0 0', color: '#1f2937' }}>{totalVentas}</h2>
      </div>
      <div style={cardStyle}>
        <p style={{ margin: 0, color: 'gray', fontSize: '14px' }}>Total ventas</p>
        <h2 style={{ margin: '5px 0 0 0', color: '#0ea5e9' }}>${totalIngresos.toFixed(2)}</h2>
      </div>
      <div style={cardStyle}>
        <p style={{ margin: 0, color: 'gray', fontSize: '14px' }}>Productos</p>
        <h2 style={{ margin: '5px 0 0 0', color: '#1f2937' }}>{totalProductos}</h2>
      </div>
  </div>
  )
}
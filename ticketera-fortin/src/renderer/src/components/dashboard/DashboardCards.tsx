import React from 'react'
import { useDashboardContext } from '../context/dashboardContext'

export const DashboardCards = () => {
  //Nos traemos la lista de ventas y el estado de carga desde el contexto
  const { sales, isLoading } = useDashboardContext()

  
  // Filtro para separar las ventas reales de los movimientos de caja Y de la apertura
  const ventasReales = sales.filter(sale => 
    sale.paymentMethod !== 'ingreso' && 
    sale.paymentMethod !== 'egreso' && 
    sale.paymentMethod !== 'apertura' 
  )

  // Total de tickets vendidos 
  const totalVentas = ventasReales.length

  // Suma de la plata de todos los tickets 
  const totalIngresos = sales.reduce((acc, sale) => {
    if (sale.paymentMethod === 'egreso') {
      return acc - sale.total 
    }
    return acc + sale.total   
  }, 0)

  // Suma de todos los productos
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

  // Si está cargando la data del backend, mostramos un mensajito 
  if (isLoading) {
    return (
      <div className="dashboard-cards" style={{ display: 'flex', gap: '20px', width: '100%' }}>
        <div style={cardStyle}>
          <p style={{ margin: 0, color: 'gray', fontSize: '14px', textAlign: 'center' }}>Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
  <div className="dashboard-cards" style={{ display: 'flex', gap: '20px' }}>
      
      <div style={cardStyle}>
        <p style={{ margin: 0, color: 'gray', fontSize: '14px' }}>Ventas</p>
        <h2 style={{ margin: '5px 0 0 0', color: '#1f2937' }}>{totalVentas}</h2>
      </div>

      <div style={cardStyle}>
        <p style={{ margin: 0, color: 'gray', fontSize: '14px' }}>Total ingresos</p>
        <h2 style={{ margin: '5px 0 0 0', color: '#0ea5e9' }}>${totalIngresos.toFixed(2)}</h2>
      </div>

      <div style={cardStyle}>
        <p style={{ margin: 0, color: 'gray', fontSize: '14px' }}>Productos</p>
        <h2 style={{ margin: '5px 0 0 0', color: '#1f2937' }}>{totalProductos}</h2>
      </div>

  </div>
  )
}
import React from 'react'
import { useDashboardContext } from '../context/dashboardContext'

export const DashboardProducts = () => {
  const { sales, isLoading } = useDashboardContext()

  //Agrupamos y sumamos los productos de todas las ventas
  const productStats: Record<string, { quantity: number; total: number }> = {}

  sales.forEach(sale => {
    // Filtramos para no contar los movimientos de caja vacíos (ingresos/egresos manuales)
    if (sale.paymentMethod !== 'ingreso' && sale.paymentMethod !== 'egreso' && sale.Sale_items) {
      sale.Sale_items.forEach(item => {
        // Si el backend no trajo el nombre, le ponemos un genérico por las dudas
        const productName = item.Product?.name || `Producto #${item.id_product}`
        
        if (!productStats[productName]) {
          productStats[productName] = { quantity: 0, total: 0 }
        }
        
        productStats[productName].quantity += item.quantity
        productStats[productName].total += item.total 
      })
    }
  })

  //Convertimos el objeto en un array y lo ordenamos de mayor a menor por cantidad
  const sortedProducts = Object.entries(productStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.quantity - a.quantity)

  //Buscamos cuál es el producto más vendido para calcular el ancho de las barritas
  const maxQuantity = sortedProducts.length > 0 ? sortedProducts[0].quantity : 1

  if (isLoading) {
    return (
      <div className="dashboard-products" style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 20px 0', color: 'gray', fontSize: '16px' }}>Productos vendidos</h3>
        <p style={{ color: 'gray', textAlign: 'center' }}>Calculando ranking...</p>
      </div>
    )
  }

  return (
    <div className="dashboard-products" style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <h3 style={{ margin: '0 0 20px 0', color: 'gray', fontSize: '16px' }}>
        Productos vendidos
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {sortedProducts.length === 0 ? (
          <p style={{ color: 'gray', textAlign: 'center', padding: '10px 0' }}>No hay productos registrados en este periodo.</p>
        ) : (
          sortedProducts.map((product, index) => {
            // Calculamos el porcentaje para que la barra se llene en base al más vendido
            const widthPercent = (product.quantity / maxQuantity) * 100
            
            return (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#4b5563' }}>
                  <span>{product.name}</span>
                  <div>
                    <span style={{ color: 'gray', marginRight: '10px' }}>{product.quantity} pzs</span>
                    <strong style={{ color: '#0ea5e9' }}>${product.total.toFixed(2)}</strong>
                  </div>
                </div>

                <div style={{ width: '100%', height: '4px', background: '#f3f4f6', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${widthPercent}%`, 
                    height: '100%', 
                    background: '#0ea5e9', 
                    borderRadius: '2px',
                    transition: 'width 0.4s ease-out'
                  }} />
                </div>
                
              </div>
            )
          })
        )}
        
      </div>
    </div>
  )
}
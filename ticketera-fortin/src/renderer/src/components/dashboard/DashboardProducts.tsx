import React from 'react'

export const DashboardProducts = () => {
  const mockProducts = [
    { id: 1, name: 'Jugo de Naranja', qty: 2, total: 60.00, percentage: 80 },
    { id: 2, name: 'Café Americano', qty: 2, total: 70.00, percentage: 90 },
    { id: 3, name: 'Quesadilla', qty: 1, total: 50.00, percentage: 40 },
    { id: 4, name: 'Tacos (3 pzs)', qty: 1, total: 60.00, percentage: 45 },
  ]

  return (
    <div className="dashboard-products" style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <h3 style={{ margin: '0 0 20px 0', color: 'gray', fontSize: '16px' }}>Productos vendidos</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {mockProducts.map(prod => (
          <div key={prod.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>{prod.name}</span>
              <span style={{ color: 'gray', fontSize: '14px' }}>
                {prod.qty} pzs <strong style={{ color: '#0ea5e9', marginLeft: '10px' }}>${prod.total.toFixed(2)}</strong>
              </span>
            </div>
            {/* Barra azul debajo de cada producto */}
            <div style={{ width: '100%', height: '4px', background: '#e5e7eb', borderRadius: '2px' }}>
              <div style={{ width: `${prod.percentage}%`, height: '100%', background: '#0ea5e9', borderRadius: '2px' }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
import React from 'react'
import { SalesSummary } from '../service/salesService'

export const DashboardProducts = ({ summary }: { summary: SalesSummary }) => {
  // Already grouped by name and sorted by quantity by the API.
  const sortedProducts = summary.products

  const maxQuantity = sortedProducts.length > 0 ? sortedProducts[0].quantity : 1

  return (
    <div
      className="dashboard-products"
      style={{
        background: 'white',
        padding: '25px',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}
    >
      <h3 style={{ margin: '0 0 20px 0', color: 'gray', fontSize: '16px' }}>Productos vendidos</h3>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          maxHeight: '300px',
          overflowY: 'auto',
          paddingRight: '10px'
        }}
      >
        {sortedProducts.length === 0 ? (
          <p style={{ color: 'gray', textAlign: 'center', padding: '10px 0' }}>
            No hay productos registrados en este periodo.
          </p>
        ) : (
          sortedProducts.map((product, index) => {
            const widthPercent = (product.quantity / maxQuantity) * 100

            return (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    color: '#4b5563'
                  }}
                >
                  <span>{product.name}</span>
                  <div>
                    <span style={{ color: 'gray', marginRight: '10px' }}>
                      {product.quantity} pzs
                    </span>
                    <strong style={{ color: '#0ea5e9' }}>
                      $
                      {product.total.toLocaleString('es-AR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    width: '100%',
                    height: '4px',
                    background: '#f3f4f6',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: `${widthPercent}%`,
                      height: '100%',
                      background: '#0ea5e9',
                      borderRadius: '2px',
                      transition: 'width 0.4s ease-out'
                    }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

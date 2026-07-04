import React from 'react'
import { useDashboardContext } from '../context/dashboardContext'

export const DashboardPayments = () => {
  // Nos traemos las ventas reales desde el contexto
  const { sales, isLoading } = useDashboardContext()

  //Calculamos los totales acumulados de cada método de pago
  const totalEfectivo = sales.reduce((acc, sale) => acc + (sale.cashAmount || 0), 0)
  const totalTransferencia = sales.reduce((acc, sale) => acc + (sale.transferAmount || 0), 0)

  //Contamos cuántas transacciones tocaron cada método
  const ventasEfectivo = sales.filter(sale => sale.cashAmount > 0).length
  const ventasTransferencia = sales.filter(sale => sale.transferAmount > 0).length

  //Calculamos los porcentajes para las barras de progreso
  const granTotal = totalEfectivo + totalTransferencia
  const porcEfectivo = granTotal > 0 ? (totalEfectivo / granTotal) * 100 : 0
  const porcTransferencia = granTotal > 0 ? (totalTransferencia / granTotal) * 100 : 0

  const cardStyle = {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px'
  }

  const progressTrackStyle = {
    width: '100%',
    height: '6px',
    background: '#f3f4f6',
    borderRadius: '10px',
    overflow: 'hidden'
  }

  if (isLoading) {
    return (
      <div className="dashboard-payments" style={{ display: 'flex', gap: '20px', width: '100%' }}>
        <div style={cardStyle}><p style={{ color: 'gray', textAlign: 'center', margin: 0 }}>Cargando montos...</p></div>
      </div>
    )
  }

  return (
    <div className="dashboard-payments" style={{ display: 'flex', gap: '20px' }}>
      
      {/* Caja de Efectivo */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ color: 'gray', fontSize: '14px' }}>Efectivo</span>
          <span style={{ color: '#10b981', fontSize: '20px', fontWeight: 'bold' }}>
            ${totalEfectivo.toFixed(2)}
          </span>
        </div>
        <span style={{ color: 'gray', fontSize: '12px' }}>
          {ventasEfectivo} {ventasEfectivo === 1 ? 'operación' : 'operaciones'}
        </span>
        <div style={progressTrackStyle}>
          <div style={{ 
            width: `${porcEfectivo}%`, 
            height: '100%', 
            background: '#10b981', 
            transition: 'width 0.4s ease-out' 
          }} />
        </div>
      </div>

      {/* Caja de Transferencia */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ color: 'gray', fontSize: '14px' }}>Transferencia</span>
          <span style={{ color: '#3b82f6', fontSize: '20px', fontWeight: 'bold' }}>
            ${totalTransferencia.toFixed(2)}
          </span>
        </div>
        <span style={{ color: 'gray', fontSize: '12px' }}>
          {ventasTransferencia} {ventasTransferencia === 1 ? 'operación' : 'operaciones'}
        </span>
        <div style={progressTrackStyle}>
          <div style={{ 
            width: `${porcTransferencia}%`, 
            height: '100%', 
            background: '#3b82f6', 
            transition: 'width 0.4s ease-out' 
          }} />
        </div>
      </div>

    </div>
  )
}
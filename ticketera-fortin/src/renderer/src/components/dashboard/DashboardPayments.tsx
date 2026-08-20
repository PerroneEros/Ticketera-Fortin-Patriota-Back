import React from 'react'
import { Sale } from '../context/dashboardContext'

export const DashboardPayments = ({ sales }: { sales: Sale[] }) => {
  let totalEfectivo = 0
  let totalTransferencia = 0
  let opsEfectivo = 0
  let opsTransferencia = 0

  // Recorremos todos los movimientos de la caja
  sales.forEach((sale) => {
    if (sale.paymentMethod === 'cierre') return // Ignoramos el cierre informativo

    const cash = Number(sale.cashAmount) || 0
    const transfer = Number(sale.transferAmount) || 0

    // Lógica para el Efectivo
    if (cash > 0) {
      if (sale.paymentMethod === 'egreso') {
        totalEfectivo -= cash // Si es egreso, restamos plata
      } else {
        totalEfectivo += cash // Aperturas, ventas e ingresos suman plata
      }
      opsEfectivo++ // Contamos que hubo un movimiento
    }

    // Lógica para la Transferencia
    if (transfer > 0) {
      if (sale.paymentMethod === 'egreso') {
        totalTransferencia -= transfer
      } else {
        totalTransferencia += transfer
      }
      opsTransferencia++
    }
  })

  const efectivoVisual = Math.max(0, totalEfectivo)
  const transferenciaVisual = Math.max(0, totalTransferencia)
  const granTotal = efectivoVisual + transferenciaVisual

  const porcEfectivo = granTotal > 0 ? (efectivoVisual / granTotal) * 100 : 0
  const porcTransferencia = granTotal > 0 ? (transferenciaVisual / granTotal) * 100 : 0

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

  return (
    <div className="dashboard-payments" style={{ display: 'flex', gap: '20px' }}>
      {/* Caja de Efectivo */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ color: 'gray', fontSize: '14px' }}>Efectivo Total</span>
          <span style={{ color: '#10b981', fontSize: '20px', fontWeight: 'bold' }}>
            $
            {totalEfectivo.toLocaleString('es-AR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </span>
        </div>
        <span style={{ color: 'gray', fontSize: '12px' }}>
          {opsEfectivo} {opsEfectivo === 1 ? 'movimiento' : 'movimientos'}
        </span>
        <div style={progressTrackStyle}>
          <div
            style={{
              width: `${porcEfectivo}%`,
              height: '100%',
              background: '#10b981',
              transition: 'width 0.4s ease-out'
            }}
          />
        </div>
      </div>

      {/* Caja de Transferencia */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ color: 'gray', fontSize: '14px' }}>Transferencia Total</span>
          <span style={{ color: '#3b82f6', fontSize: '20px', fontWeight: 'bold' }}>
            $
            {totalTransferencia.toLocaleString('es-AR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </span>
        </div>
        <span style={{ color: 'gray', fontSize: '12px' }}>
          {opsTransferencia} {opsTransferencia === 1 ? 'movimiento' : 'movimientos'}
        </span>
        <div style={progressTrackStyle}>
          <div
            style={{
              width: `${porcTransferencia}%`,
              height: '100%',
              background: '#3b82f6',
              transition: 'width 0.4s ease-out'
            }}
          />
        </div>
      </div>
    </div>
  )
}

import React from 'react'
import { SalesSummary } from '../service/salesService'

export const DashboardPayments = ({ summary }: { summary: SalesSummary }) => {
  const totalEfectivo = summary.money.cashBalance
  const totalTransferencia = summary.money.transferBalance
  const ingresoEfectivo = summary.money.cashIn
  const egresoEfectivo = summary.money.cashOut
  const ingresoTransferencia = summary.money.transferIn
  const egresoTransferencia = summary.money.transferOut
  const ingresoTotal = summary.money.cashIn + summary.money.transferIn
  const egresoTotal = summary.money.cashOut + summary.money.transferOut
  // Cantidad de operaciones (ventas, movimientos y aperturas) que usaron cada medio
  const opsEfectivo = summary.operations.cash
  const opsTransferencia = summary.operations.transfer

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
          <span style={{ color: 'gray', fontSize: '18px' }}>Ingreso Total</span>
          <span style={{ color: '#10b981', fontSize: '28px', fontWeight: 'bold' }}>
            $
            {ingresoTotal.toLocaleString('es-AR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ color: 'gray', fontSize: '18px' }}>Efectivo Total Esperado</span>
          <span style={{ color: '#10b981', fontSize: '28px', fontWeight: 'bold' }}>
            $
            {totalEfectivo.toLocaleString('es-AR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ color: 'gray', fontSize: '14px' }}>ingreso Efectivo</span>
          <span style={{ color: '#10b981', fontSize: '15px', fontWeight: 'bold' }}>
            $
            {ingresoEfectivo.toLocaleString('es-AR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ color: 'gray', fontSize: '14px' }}>Egreso Efectivo</span>
          <span style={{ color: '#ff1b1bff', fontSize: '15px', fontWeight: 'bold' }}>
            $
            {egresoEfectivo.toLocaleString('es-AR', {
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
              width: '${porcEfectivo}%',
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
          <span style={{ color: 'gray', fontSize: '18px' }}>Egreso Total</span>
          <span style={{ color: '#ff1b1bff', fontSize: '28px', fontWeight: 'bold' }}>
            $
            {egresoTotal.toLocaleString('es-AR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ color: 'gray', fontSize: '18px' }}>Transferencia Total Esperado</span>
          <span style={{ color: '#3b82f6', fontSize: '28px', fontWeight: 'bold' }}>
            $
            {totalTransferencia.toLocaleString('es-AR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ color: 'gray', fontSize: '14px' }}>Ingreso Transferencia</span>
          <span style={{ color: '#10b981', fontSize: '15px', fontWeight: 'bold' }}>
            $
            {ingresoTransferencia.toLocaleString('es-AR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ color: 'gray', fontSize: '14px' }}>Egreso Transferencia</span>
          <span style={{ color: '#ff1b1bff', fontSize: '15px', fontWeight: 'bold' }}>
            $
            {egresoTransferencia.toLocaleString('es-AR', {
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
              width: '${porcTransferencia}%',
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

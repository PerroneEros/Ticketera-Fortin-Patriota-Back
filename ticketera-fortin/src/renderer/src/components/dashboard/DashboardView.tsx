import React, { useState, useEffect } from 'react'
import { DashboardHeader } from './DashboardHeader'
import { DashboardMovementModal } from './DashboardMovementModal'
import { DashboardProvider, useDashboardContext } from '../context/dashboardContext'
import { DashboardCashBox } from './DashboardCashBox'

const DashboardContent = ({ onOpenModal }: { onOpenModal: () => void }) => {
  const { registersList, sales, isLoading, currentCashBox, isFiltering } = useDashboardContext()

  const boxesToShow = isFiltering ? registersList : currentCashBox ? [currentCashBox] : []

  const ventasReales = sales.filter(
    (s) =>
      s.paymentMethod !== 'apertura' &&
      s.paymentMethod !== 'cierre' &&
      s.paymentMethod !== 'ingreso' &&
      s.paymentMethod !== 'egreso'
  )

  const totalSalesCount = ventasReales.length
  const totalProductsCount = ventasReales.reduce((acc, sale) => {
    const itemsCount = sale.Sale_items
      ? sale.Sale_items.reduce((sum: any, item: any) => sum + item.quantity, 0)
      : 0
    return acc + itemsCount
  }, 0)

  let globalEfectivo = 0
  let globalTransferencia = 0

  sales.forEach((s) => {
    if (s.paymentMethod === 'cierre') return
    const cash = Number(s.cashAmount) || 0
    const transfer = Number(s.transferAmount) || 0

    if (s.paymentMethod === 'egreso') {
      globalEfectivo -= cash
      globalTransferencia -= transfer
    } else {
      globalEfectivo += cash
      globalTransferencia += transfer
    }
  })

  const totalMoney = globalEfectivo + globalTransferencia

  return (
    <div
      style={{
        width: '100%',
        height: 'calc(100vh - 180px)',
        overflowY: 'auto',
        paddingTop: '80px',
        position: 'relative'
      }}
    >
      <div
        className="dashboard-container"
        style={{
          padding: '20px',
          gap: '20px',
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '900px',
          margin: '0 auto',
          paddingBottom: '120px'
        }}
      >
        <DashboardHeader onOpenModal={onOpenModal} />

        {isLoading ? (
          <p style={{ textAlign: 'center', marginTop: '50px', color: 'gray', fontWeight: 'bold' }}>
            Cargando datos...
          </p>
        ) : (
          <>
            {boxesToShow.length === 0 ? (
              <p style={{ textAlign: 'center', marginTop: '50px', color: 'gray' }}>
                {!isFiltering
                  ? 'No hay ninguna caja abierta actualmente.'
                  : 'No se encontraron cajas en las fechas seleccionadas.'}
              </p>
            ) : (
              boxesToShow.map((box) => (
                <DashboardCashBox key={box.cash_register_id} cashBox={box} sales={sales} />
              ))
            )}
          </>
        )}
      </div>

      {isFiltering && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            background: '#555843',
            padding: '15px 20px',
            display: 'flex',
            justifyContent: 'center',
            boxShadow: '0 -10px 20px rgba(0,0,0,0.2)',
            zIndex: 100
          }}
        >
          <div
            style={{
              maxWidth: '900px',
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontWeight: 'bold',
                  fontSize: '14px',
                  color: 'white',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                TOTAL EN RANGO
              </span>
              <span style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '4px' }}>
                Ventas: <strong style={{ color: 'white' }}>{totalSalesCount}</strong> | Productos:{' '}
                <strong style={{ color: 'white' }}>{totalProductsCount}</strong>
              </span>
            </div>

            <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#38bdf8' }}>
              $
              {totalMoney.toLocaleString('es-AR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

const DashboardViewInternal = ({ onOpenModal }: { onOpenModal: () => void }) => {
  const { refreshData } = useDashboardContext()

  useEffect(() => {
    const handleCajaCambiada = () => {
      refreshData()
    }
    window.addEventListener('caja-actualizada', handleCajaCambiada)
    return () => window.removeEventListener('caja-actualizada', handleCajaCambiada)
  }, [refreshData])

  return <DashboardContent onOpenModal={onOpenModal} />
}

export const DashboardView = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <DashboardProvider>
      <DashboardViewInternal onOpenModal={() => setIsModalOpen(true)} />
      {isModalOpen && <DashboardMovementModal onClose={() => setIsModalOpen(false)} />}
    </DashboardProvider>
  )
}

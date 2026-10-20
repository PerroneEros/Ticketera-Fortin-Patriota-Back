import { useState } from 'react'
import { DashboardHeader } from './DashboardHeader'
import { DashboardMovementModal } from './DashboardMovementModal'
import { DashboardProvider, useDashboardContext } from '../context/dashboardContext'
import { DashboardCashBox } from './DashboardCashBox'
import { isEmptySummary } from '../service/salesService'

export const DashboardContent = ({ onOpenModal }: { onOpenModal: () => void }) => {
  const { registersList, summary, isLoading, currentCashBox, isFiltering, dateRange } =
    useDashboardContext()

  const boxesToShow = isFiltering ? registersList : currentCashBox ? [currentCashBox] : []

  const totalSalesCount = summary?.salesCount ?? 0
  const totalProductsCount = summary?.unitsCount ?? 0
  const totalMoney = summary?.money.total ?? 0
  const emptyPeriod =
    isFiltering && boxesToShow.length === 0 && (!summary || isEmptySummary(summary))

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
          maxWidth: '1200px',
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
              <p style={{ textAlign: 'center', marginTop: '50px', color: 'white' }}>
                {!isFiltering
                  ? 'No hay ninguna caja abierta actualmente.'
                  : emptyPeriod
                    ? 'Sin movimientos en el período'
                    : 'No se encontraron cajas en las fechas seleccionadas.'}
              </p>
            ) : (
              boxesToShow.map((box) => (
                <DashboardCashBox key={box.cash_register_id} cashBox={box} />
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
                TOTAL DE VENTAS DESDE:{' '}
                <strong style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '20px' }}>
                  {dateRange.from.split('-').reverse().join('/')}{' '}
                </strong>{' '}
                HASTA:{' '}
                <strong style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '20px' }}>
                  {dateRange.to.split('-').reverse().join('/')}
                </strong>
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

export const DashboardView = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <DashboardProvider>
      <DashboardContent onOpenModal={() => setIsModalOpen(true)} />
      {isModalOpen && <DashboardMovementModal onClose={() => setIsModalOpen(false)} />}
    </DashboardProvider>
  )
}

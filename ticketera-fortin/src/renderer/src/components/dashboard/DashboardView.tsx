import React, { useState } from 'react'
import { DashboardHeader } from './DashboardHeader'
import { DashboardMovementModal } from './DashboardMovementModal'
import { DashboardProvider, useDashboardContext } from '../context/dashboardContext'
import { DashboardCashBox } from './DashboardCashBox'

const DashboardContent = ({ onOpenModal }: { onOpenModal: () => void }) => {
  const { registersList, sales, isLoading } = useDashboardContext()

  // 1. Filtramos las ventas reales para sacar la cantidad de tickets y productos
  const ventasReales = sales.filter(s => 
    s.paymentMethod !== 'apertura' && 
    s.paymentMethod !== 'cierre' && 
    s.paymentMethod !== 'ingreso' && 
    s.paymentMethod !== 'egreso'
  );
  
  const totalSalesCount = ventasReales.length;
  
  const totalProductsCount = ventasReales.reduce((acc, sale) => {
    const itemsCount = sale.Sale_items ? sale.Sale_items.reduce((sum: any, item: any) => sum + item.quantity, 0) : 0;
    return acc + itemsCount;
  }, 0);

  // 2. CÁLCULO ESTRICTO GLOBAL 
  // Efectivo = Monto Inicial + Ventas (Ef) + Ingresos (Ef) - Egresos (Ef)
  // Transferencia = Ventas (Tr) + Ingresos (Tr) - Egresos (Tr)
  let globalEfectivo = 0;
  let globalTransferencia = 0;

  sales.forEach(s => {
    // Ignoramos el cierre porque es solo un registro informativo
    if (s.paymentMethod === 'cierre') return;

    // Agarramos cuánta plata se movió en cada método en esta transacción
    const cash = Number(s.cashAmount) || 0;
    const transfer = Number(s.transferAmount) || 0;

    if (s.paymentMethod === 'egreso') {
      // Egresos restan
      globalEfectivo -= cash;
      globalTransferencia -= transfer;
    } else {
      // Acá entran sumando automáticamente:
      // - El monto inicial (viene como 'apertura' con plata en cashAmount)
      // - Las ventas reales (vienen con cashAmount o transferAmount según cómo pagaron)
      // - Los ingresos manuales (vienen con cashAmount o transferAmount)
      globalEfectivo += cash;
      globalTransferencia += transfer;
    }
  });

  // El total de todas las cajas es la suma del Efectivo final + Transferencia final
  const totalMoney = globalEfectivo + globalTransferencia;

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 180px)', overflowY: 'auto', paddingTop: '80px', position: 'relative' }}>
      
      <div className="dashboard-container" style={{ 
        padding: '20px', 
        gap: '20px', 
        display: 'flex', 
        flexDirection: 'column', 
        maxWidth: '900px', 
        margin: '0 auto', 
        paddingBottom: '120px' 
      }}>
        
        <DashboardHeader onOpenModal={onOpenModal} />

        {isLoading ? (
          <p style={{ textAlign: 'center', marginTop: '50px', color: 'gray', fontWeight: 'bold' }}>
            Cargando datos del período...
          </p>
        ) : (
          <>
            {registersList.length === 0 ? (
               <p style={{ textAlign: 'center', marginTop: '50px', color: 'gray' }}>
                 No se encontraron cajas en las fechas seleccionadas.
               </p>
            ) : (
              registersList.map((box) => (
                <DashboardCashBox key={box.cash_register_id} cashBox={box} sales={sales} />
              ))
            )}
          </>
        )}

      </div>

      {/* BANNER TOTALIZADOR */}
      <div style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        width: '100%', 
        background: '#fff', 
        borderTop: '4px solid #000', 
        padding: '15px 20px', 
        display: 'flex', 
        justifyContent: 'center', 
        boxShadow: '0 -4px 10px rgba(0,0,0,0.1)',
        zIndex: 100
      }}>
        <div style={{ maxWidth: '900px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#374151', textTransform: 'uppercase' }}>
              TOTAL DE TODAS LAS CAJAS EN ESE RANGO
            </span>
            <span style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
              Ventas realizadas: <strong>{totalSalesCount}</strong> | Productos vendidos: <strong>{totalProductsCount}</strong>
            </span>
          </div>
          
          <div>
             <span style={{ fontSize: '26px', fontWeight: 'bold', color: '#0ea5e9' }}>
               ${totalMoney.toFixed(2)}
             </span>
          </div>

        </div>
      </div>
    </div>
  )
}

export const DashboardView = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <DashboardProvider>
      <DashboardContent onOpenModal={() => setIsModalOpen(true)} />
      {isModalOpen && (
        <DashboardMovementModal onClose={() => setIsModalOpen(false)} />
      )}
    </DashboardProvider>
  )
}
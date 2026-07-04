import React, { useState } from 'react'
import { DashboardHeader } from './DashboardHeader'
import { DashboardCards } from './DashboardCards'
import { DashboardPayments } from './DashboardPayments'
import { DashboardProducts } from './DashboardProducts'
import { DashboardHistory } from './DashboardHistory'
import { DashboardMovementModal } from './DashboardMovementModal'
import { DashboardProvider } from '../context/dashboardContext'

export const DashboardView = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <DashboardProvider>
      
      <div style={{ 
        width: '100%', 
        height: 'calc(100vh - 180px)', 
        overflowY: 'auto',
        paddingTop: '80px' 
      }}>

        <div className="dashboard-container" style={{ 
          padding: '20px', 
          gap: '20px', 
          display: 'flex', 
          flexDirection: 'column',
          maxWidth: '900px', 
          margin: '0 auto',   
          paddingBottom: '40px'
        }}>

          {/*Botonera de arriba (Día, Semana, Mes y Movimiento) */}
          <DashboardHeader onOpenModal={() => setIsModalOpen(true)} />

          {/*Tarjetitas de Resumen */}
          <DashboardCards />

          {/* Barras de Efectivo y Transferencia */}
          <DashboardPayments />

          {/*Lista de productos más vendidos */}
          <DashboardProducts />

          {/*Historial*/}
          <DashboardHistory />
          
        </div>
        
      </div>

      {isModalOpen && (
        <DashboardMovementModal onClose={() => setIsModalOpen(false)} />
      )}

    </DashboardProvider>
  )
}
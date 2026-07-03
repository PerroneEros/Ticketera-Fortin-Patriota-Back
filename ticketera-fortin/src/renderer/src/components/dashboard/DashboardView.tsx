import React from 'react'
import { DashboardHeader } from './DashboardHeader'
import { DashboardCards } from './DashboardCards'
import { DashboardPayments } from './DashboardPayments'
import { DashboardProducts } from './DashboardProducts'
import { DashboardProvider } from '../context/dashboardContext'

export const DashboardView = () => {
  return (
    // Envolvemos todo en el Provider para que escuche los filtros de tiempo
    <DashboardProvider>
      <div className="dashboard-container" style={{ padding: '20px', gap: '20px', display: 'flex', flexDirection: 'column' }}>
        
        {/*Botonera de arriba (Día, Semana, Mes y Movimiento) */}
        <DashboardHeader />

        {/*Tarjetitas de Resumen */}
        <DashboardCards />

        {/* Barras de Efectivo y Transferencia */}
        <DashboardPayments />

        {/*Lista de productos más vendidos */}
        <DashboardProducts />

      </div>
    </DashboardProvider>
  )
}
import React, { createContext, useState, ReactNode, useContext } from 'react'

export type TimeFilter = 'Día' | 'Semana' | 'Mes' | 'Todo'

interface DashboardContextType {
  timeFilter: TimeFilter
  setTimeFilter: (filter: TimeFilter) => void
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  // Arranca por defecto mostrando las ventas del Día
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('Día')

  return (
    <DashboardContext.Provider value={{ timeFilter, setTimeFilter }}>
      {children}
    </DashboardContext.Provider>
  )
}

// Hook personalizado para usarlo más fácil en los componentes
export const useDashboardContext = () => {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboardContext debe usarse dentro de un DashboardProvider')
  }
  return context
}
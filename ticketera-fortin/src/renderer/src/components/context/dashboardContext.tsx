import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react'
import { salesServiceFront } from '../service/salesService'

export type TimeFilter = 'Día' | 'Semana' | 'Mes' | 'Todo'

export interface SaleItem {
  sale_items_id: number
  id_product: number
  quantity: number
  unit_price: number
  total: number
  Product?: { name: string }
}

export interface Sale {
  sales_id: number
  total: number
  paymentMethod: 'efectivo' | 'transferencia' | 'combinado' | 'ingreso' | 'egreso'
  cashAmount: number
  transferAmount: number
  date: string
  Sale_items: SaleItem[]
}

interface DashboardContextType {
  timeFilter: TimeFilter
  setTimeFilter: (filter: TimeFilter) => void
  sales: Sale[]         
  isLoading: boolean    
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('Día')
  const [sales, setSales] = useState<Sale[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchSales = async () => {
      setIsLoading(true)
      try {
        let data;
        if (timeFilter === 'Todo') {
          data = await salesServiceFront.getSales()
        } else {
          data = await salesServiceFront.getSalesByFilter(timeFilter.toLowerCase())
        }

        setSales(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error al traer las ventas desde el back:', error)
        setSales([]) 
      } finally {
        setIsLoading(false)
      }
    }

    fetchSales()
  }, [timeFilter])

  return (
    <DashboardContext.Provider value={{ timeFilter, setTimeFilter, sales, isLoading }}>
      {children}
    </DashboardContext.Provider>
  )
}

export const useDashboardContext = () => {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboardContext debe usarse dentro de un DashboardProvider')
  }
  return context
}
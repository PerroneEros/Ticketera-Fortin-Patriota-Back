import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react'
import { salesServiceFront } from '../service/salesService'
import * as cashRegisterService from '../service/cashRegisterService'

export interface DateRange {
  from: string; 
  to: string;
}

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
  paymentMethod: 'efectivo' | 'transferencia' | 'combinado' | 'ingreso' | 'egreso'| 'apertura' | 'cierre'
  cashAmount: number
  transferAmount: number
  date: string
  Sale_items: SaleItem[]
  description?: string
}

interface DashboardContextType {
  dateRange: DateRange; 
  setDateRange: (range: DateRange) => void; 
  isAllTime: boolean; 
  setIsAllTime: (val: boolean) => void; 
  isFiltering: boolean; // <-- NUEVO ESTADO
  setIsFiltering: (val: boolean) => void; // <-- NUEVO ESTADO
  sales: Sale[]        
  registersList: any[]; 
  isLoading: boolean
  refreshData: () => void 
  currentCashBox: any | null 
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const today = new Date().toISOString().split('T')[0];
  const [dateRange, setDateRange] = useState<DateRange>({ from: today, to: today })
  
  const [isAllTime, setIsAllTime] = useState(false) 
  const [isFiltering, setIsFiltering] = useState(false) // Arranca falso, muestra solo caja actual
  
  const [sales, setSales] = useState<Sale[]>([])
  const [registersList, setRegistersList] = useState<any[]>([]) 
  const [isLoading, setIsLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [currentCashBox, setCurrentCashBox] = useState<any | null>(null)

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)
      try {
        const fromLocal = isAllTime ? '' : `${dateRange.from}T00:00:00`;
        const toLocal = isAllTime ? '' : `${dateRange.to}T23:59:59`;

        const [salesData, registersData, activeBox] = await Promise.all([
          salesServiceFront.getSalesByDateRange(fromLocal, toLocal),
          cashRegisterService.getRegistersByDateRange(fromLocal, toLocal),
          cashRegisterService.getCurrentRegister() 
        ])

        setSales(Array.isArray(salesData) ? salesData : [])
        setRegistersList(Array.isArray(registersData) ? registersData : [])
        setCurrentCashBox(activeBox)
      } catch (error) {
        console.error('Error al traer los datos del dashboard:', error)
        setSales([]) 
        setRegistersList([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [dateRange, isAllTime, refreshTrigger]) 

  return (
    <DashboardContext.Provider value={{ 
      dateRange, setDateRange, isAllTime, setIsAllTime, isFiltering, setIsFiltering, sales, registersList, isLoading, refreshData, currentCashBox 
    }}>
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
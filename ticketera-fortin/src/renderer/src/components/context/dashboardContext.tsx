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
  isFiltering: boolean;
  setIsFiltering: (val: boolean) => void;
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
  const [isFiltering, setIsFiltering] = useState(false)
  
  const [sales, setSales] = useState<Sale[]>([])
  const [registersList, setRegistersList] = useState<any[]>([]) 
  const [isLoading, setIsLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [currentCashBox, setCurrentCashBox] = useState<any | null>(null)

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  useEffect(() => {
    const handleCajaCambiada = () => {
      refreshData();
    };

    window.addEventListener('caja-actualizada', handleCajaCambiada);
    return () => {
      window.removeEventListener('caja-actualizada', handleCajaCambiada);
    };
  }, []);

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

        const salesArray = Array.isArray(salesData) ? salesData : [];
        const registersArray = Array.isArray(registersData) ? registersData : [];

        setSales(salesArray)
        setRegistersList(registersArray)
        setCurrentCashBox(activeBox)

        if (isAllTime && registersArray.length > 0) {
          const getLocalDate = (dateString: string) => {
            const d = new Date(dateString);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          };

          const newestDate = getLocalDate(registersArray[0].opened_at);
          const oldestDate = getLocalDate(registersArray[registersArray.length - 1].opened_at);

          setDateRange(prev => {
            if (prev.from !== oldestDate || prev.to !== newestDate) {
              return { from: oldestDate, to: newestDate };
            }
            return prev;
          });
        }
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
      dateRange, setDateRange, 
      isAllTime, setIsAllTime, 
      isFiltering, setIsFiltering, 
      sales, registersList, 
      isLoading, refreshData, 
      currentCashBox 
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
import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react'
import { salesServiceFront, SalesSummary } from '../service/salesService'
import * as cashRegisterService from '../service/cashRegisterService'
import { toLocalDateString } from '../utils/dateUtils'

export interface DateRange {
  from: string
  to: string
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
  paymentMethod:
    | 'efectivo'
    | 'transferencia'
    | 'combinado'
    | 'ingreso'
    | 'egreso'
    | 'apertura'
    | 'cierre'
  cashAmount: number
  transferAmount: number
  date: string
  Sale_items: SaleItem[]
  description?: string
}

interface DashboardContextType {
  dateRange: DateRange
  setDateRange: (range: DateRange) => void
  isAllTime: boolean
  setIsAllTime: (val: boolean) => void
  isFiltering: boolean
  setIsFiltering: (val: boolean) => void
  // Totals of the selected range computed by the API; the detail of each register is loaded
  // only when it is expanded (DashboardCashBox).
  summary: SalesSummary | null
  registersList: any[]
  isLoading: boolean
  refreshData: () => void
  // Changes on every refreshData, so expanded registers reload their detail.
  refreshKey: number
  currentCashBox: any | null
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const today = toLocalDateString(new Date())
  const [dateRange, setDateRange] = useState<DateRange>({ from: today, to: today })

  const [isAllTime, setIsAllTime] = useState(false)
  const [isFiltering, setIsFiltering] = useState(false)

  const [summary, setSummary] = useState<SalesSummary | null>(null)
  const [registersList, setRegistersList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [currentCashBox, setCurrentCashBox] = useState<any | null>(null)

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)
      try {
        const fromLocal = isAllTime ? '' : `${dateRange.from}T00:00:00`
        const toLocal = isAllTime ? '' : `${dateRange.to}T23:59:59`

        const [summaryData, registersData, activeBox] = await Promise.all([
          salesServiceFront.getSummary(isAllTime ? {} : { from: fromLocal, to: toLocal }),
          cashRegisterService.getRegistersByDateRange(fromLocal, toLocal),
          cashRegisterService.getCurrentRegister()
        ])

        const registersArray = Array.isArray(registersData) ? registersData : []

        setSummary(summaryData)
        setRegistersList(registersArray)
        setCurrentCashBox(activeBox)

        if (isAllTime && registersArray.length > 0) {
          const newestDate = toLocalDateString(new Date(registersArray[0].opened_at))
          const oldestDate = toLocalDateString(
            new Date(registersArray[registersArray.length - 1].opened_at)
          )

          setDateRange((prev) => {
            if (prev.from !== oldestDate || prev.to !== newestDate) {
              return { from: oldestDate, to: newestDate }
            }
            return prev
          })
        }
      } catch (error) {
        console.error('Error al traer los datos del dashboard:', error)
        setSummary(null)
        setRegistersList([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [dateRange, isAllTime, refreshTrigger])

  return (
    <DashboardContext.Provider
      value={{
        dateRange,
        setDateRange,
        isAllTime,
        setIsAllTime,
        isFiltering,
        setIsFiltering,
        summary,
        registersList,
        isLoading,
        refreshData,
        refreshKey: refreshTrigger,
        currentCashBox
      }}
    >
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

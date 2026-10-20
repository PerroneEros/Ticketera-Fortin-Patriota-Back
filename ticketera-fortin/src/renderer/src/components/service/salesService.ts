import { apiClient } from './apiClient'
import type { Sale } from '../context/dashboardContext'

export interface CreateSalePayload {
  paymentMethod: 'efectivo' | 'transferencia' | 'combinado'
  cashAmount: number
  transferAmount: number
  // Total the cashier saw; the API rejects the sale if prices changed meanwhile.
  expectedTotal: number
  items: { id_product: number; quantity: number }[]
}

// Dashboard totals computed by the API, for a date range, one register or all time.
export interface SalesSummary {
  salesCount: number
  unitsCount: number
  money: {
    cashIn: number
    cashOut: number
    transferIn: number
    transferOut: number
    cashBalance: number
    transferBalance: number
    total: number
  }
  operations: { cash: number; transfer: number }
  products: { name: string; quantity: number; total: number }[]
}

export type SummaryParams = { from: string; to: string } | { cash_register_id: number } | object

export const isEmptySummary = (summary: SalesSummary): boolean =>
  summary.salesCount === 0 &&
  summary.operations.cash === 0 &&
  summary.operations.transfer === 0 &&
  summary.money.total === 0

export const salesServiceFront = {
  async getSummary(params: SummaryParams): Promise<SalesSummary> {
    const response = await apiClient.get('/sales/summary', { params })
    return response.data
  },
  // Sales, movements and opening of one register, for its history list.
  async getSalesByRegister(cashRegisterId: number): Promise<Sale[]> {
    const response = await apiClient.get(`/sales/cash-register/${cashRegisterId}`)
    return response.data
  },
  async createSale(saleData: CreateSalePayload) {
    try {
      const response = await apiClient.post('/sales', saleData)
      return response.data
    } catch (error) {
      console.error('error registrando la venta', error)
      throw error
    }
  }
}

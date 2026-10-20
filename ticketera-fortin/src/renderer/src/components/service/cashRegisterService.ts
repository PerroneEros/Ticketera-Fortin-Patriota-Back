import { apiClient } from './apiClient'

// 1. Obtiene la caja que está actualmente abierta (si existe)
export const getCurrentRegister = async () => {
  const response = await apiClient.get('/cash-registers/current')
  return response.data
}

// 2. Trae TODAS las cajas filtradas por un rango de fechas (para el Dashboard)
export const getRegistersByDateRange = async (from: string, to: string) => {
  const response = await apiClient.get('/cash-registers', {
    params: { from, to }
  })
  return response.data
}

// 3. Abre un nuevo turno de caja con un monto inicial
export const openRegister = async (openingAmount: number) => {
  const response = await apiClient.post('/cash-registers/open', { opening: openingAmount })
  return response.data
}

export interface CloseSummary {
  opening: number
  sales: { cash: number; transfer: number }
  movements: { cashIn: number; cashOut: number; transferIn: number; transferOut: number }
  expected: { cash: number; transfer: number }
}

export interface CloseRegisterBody {
  countedCash: number
  countedTransfer: number
  // What the cashier saw: the server refuses the close (409) if its own calculation differs.
  shownExpectedCash: number
  shownExpectedTransfer: number
}

// 4. Cierra el turno de caja con lo contado por medio de pago
export const closeRegister = async (
  id: number | string,
  body: CloseRegisterBody
): Promise<unknown> => {
  const response = await apiClient.put(`/cash-registers/close/${id}`, body)
  return response.data
}

// 5. Esperado del cierre calculado por el servidor. Si falla, el error sube: mostrar un esperado
// en 0 haría cerrar la caja con una diferencia falsa.
export const getCloseSummary = async (id: number | string): Promise<CloseSummary> => {
  const response = await apiClient.get(`/cash-registers/totals/${id}`)
  return response.data
}

// 6. Registra un movimiento pegándole a la ruta de movements
export const registerMovement = async (data: {
  type: 'ingreso' | 'egreso'
  amount: number
  description: string
  method: 'efectivo' | 'transferencia'
}) => {
  const response = await apiClient.post('/movements', data)
  return response.data
}

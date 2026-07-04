export interface CashMovementsAttributes {
  movement_id?: number
  cash_register_id: number
  type: 'ingreso' | 'egreso'
  amount: number
  description: string
  method: 'efectivo' | 'transferencia'
  date: Date
}
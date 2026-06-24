export type PaymentMethod = 'efectivo' | 'transferencia' | 'combinado'
interface SalesAttributes {
  sales_id: number
  date: Date
  cash_register_id: number
  total: number
  paymentMethod: PaymentMethod
  cashAmount: number
  transferAmount: number
}
export default SalesAttributes

import { PaymentMethod } from './salesAttributes'

export interface SaleItemInput {
  id_product: number
  quantity: number
}

export interface CreateSaleInput {
  cash_register_id: number
  paymentMethod: PaymentMethod
  cashAmount?: number
  transferAmount?: number
  items: SaleItemInput[]
}
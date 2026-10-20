interface cash_registerAttributes {
  cash_register_id: number
  opening: number
  closing: number
  opened_at: Date
  closed_at: Date
  status: string
  counted_cash?: number | null
  counted_transfer?: number | null
  expected_cash?: number | null
  expected_transfer?: number | null
}
export default cash_registerAttributes

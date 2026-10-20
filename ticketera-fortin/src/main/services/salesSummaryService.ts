import { QueryTypes } from 'sequelize'
import sequelize from '../database/db'

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
  // Operations that moved money through each method (sales, movements and openings).
  operations: { cash: number; transfer: number }
  products: { name: string; quantity: number; total: number }[]
}

// No filter means all time. Dates are the local day bounds the dashboard sends.
export type SummaryFilter = { from?: string; to?: string } | { cashRegisterId: number }

// Sequelize stores dates in SQLite as UTC text like "2026-10-03 17:13:11.442 +00:00", which
// sorts chronologically, so bounds in the same format can be compared directly.
const toDbDate = (date: Date): string =>
  date.toISOString().replace('T', ' ').replace('Z', ' +00:00')

interface Where {
  sales: string
  movements: string
  registers: string
  params: Record<string, string | number>
}

// Same semantics the dashboard always had: sales and movements by their date, openings by the
// register's opening date; or everything that belongs to one register.
function buildWhere(filter: SummaryFilter): Where {
  if ('cashRegisterId' in filter) {
    const clause = 'cash_register_id = :id'
    return {
      sales: clause,
      movements: clause,
      registers: clause,
      params: { id: filter.cashRegisterId }
    }
  }
  if (filter.from && filter.to) {
    const start = new Date(filter.from)
    start.setHours(0, 0, 0, 0)
    const end = new Date(filter.to)
    end.setHours(23, 59, 59, 999)
    return {
      sales: 's.date BETWEEN :start AND :end',
      movements: 'date BETWEEN :start AND :end',
      registers: 'opened_at BETWEEN :start AND :end',
      params: { start: toDbDate(start), end: toDbDate(end) }
    }
  }
  return { sales: '1 = 1', movements: '1 = 1', registers: '1 = 1', params: {} }
}

async function one<T extends object>(sql: string, params: Where['params']): Promise<T> {
  const [row] = await sequelize.query<T>(sql, { replacements: params, type: QueryTypes.SELECT })
  // Aggregates without GROUP BY always return exactly one row.
  return row as T
}

// Totals for the dashboard computed with aggregates, so the screen never downloads every sale
// of the range (RF-18). Must match what the screen used to compute (RF-19).
async function getSummary(filter: SummaryFilter): Promise<SalesSummary> {
  const where = buildWhere(filter)
  const salesWhere = where.sales.replace('cash_register_id', 's.cash_register_id')

  const sales = await one<{
    count: number
    cash: number
    transfer: number
    cashOps: number
    transferOps: number
  }>(
    `SELECT COUNT(*) AS count,
       COALESCE(SUM(s.cash_amount), 0) AS cash,
       COALESCE(SUM(s.transfer_amount), 0) AS transfer,
       COALESCE(SUM(s.cash_amount > 0), 0) AS cashOps,
       COALESCE(SUM(s.transfer_amount > 0), 0) AS transferOps
     FROM Sales s WHERE ${salesWhere}`,
    where.params
  )

  // Non-numeric amounts (kept by migration 0002 and reported) count as 0, as on screen.
  const numeric = "typeof(amount) IN ('integer', 'real')"
  const movements = await one<{
    cashIn: number
    cashOut: number
    transferIn: number
    transferOut: number
    cashOps: number
    transferOps: number
  }>(
    `SELECT
       COALESCE(SUM(CASE WHEN ${numeric} AND type <> 'egreso' AND method = 'efectivo' THEN amount END), 0) AS cashIn,
       COALESCE(SUM(CASE WHEN ${numeric} AND type = 'egreso' AND method = 'efectivo' THEN amount END), 0) AS cashOut,
       COALESCE(SUM(CASE WHEN ${numeric} AND type <> 'egreso' AND method = 'transferencia' THEN amount END), 0) AS transferIn,
       COALESCE(SUM(CASE WHEN ${numeric} AND type = 'egreso' AND method = 'transferencia' THEN amount END), 0) AS transferOut,
       COALESCE(SUM(${numeric} AND method = 'efectivo' AND amount > 0), 0) AS cashOps,
       COALESCE(SUM(${numeric} AND method = 'transferencia' AND amount > 0), 0) AS transferOps
     FROM Cash_movements WHERE ${where.movements}`,
    where.params
  )

  const openings = await one<{ cash: number; ops: number }>(
    `SELECT COALESCE(SUM(opening), 0) AS cash, COALESCE(SUM(opening > 0), 0) AS ops
     FROM cash_register WHERE ${where.registers}`,
    where.params
  )

  const products = await sequelize.query<{ name: string; quantity: number; total: number }>(
    `SELECT COALESCE(p.name, 'Producto #' || i.id_product) AS name,
       SUM(i.quantity) AS quantity, SUM(i.total) AS total
     FROM Sale_items i
     JOIN Sales s ON s.sales_id = i.sale_id
     LEFT JOIN Products p ON p.id_product = i.id_product
     WHERE ${salesWhere}
     GROUP BY 1
     ORDER BY quantity DESC, name ASC`,
    { replacements: where.params, type: QueryTypes.SELECT }
  )

  const cashIn = sales.cash + movements.cashIn + openings.cash
  const transferIn = sales.transfer + movements.transferIn
  const cashBalance = cashIn - movements.cashOut
  const transferBalance = transferIn - movements.transferOut

  return {
    salesCount: sales.count,
    unitsCount: products.reduce((sum, product) => sum + product.quantity, 0),
    money: {
      cashIn,
      cashOut: movements.cashOut,
      transferIn,
      transferOut: movements.transferOut,
      cashBalance,
      transferBalance,
      total: cashBalance + transferBalance
    },
    operations: {
      cash: sales.cashOps + movements.cashOps + openings.ops,
      transfer: sales.transferOps + movements.transferOps
    },
    products
  }
}

export const salesSummaryService = { getSummary }

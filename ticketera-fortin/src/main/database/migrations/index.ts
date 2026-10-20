import { baseline } from './0001_baseline'
import { cashMovementsIntegerAmount } from './0002_cash_movements_integer_amount'
import { cashRegisterClosingBreakdown } from './0003_cash_register_closing_breakdown'
import { indexes } from './0004_indexes'
import { Migration } from './runner'

// Append only: never edit, reorder or remove a migration that has shipped.
export const MIGRATIONS: Migration[] = [
  baseline,
  cashMovementsIntegerAmount,
  cashRegisterClosingBreakdown,
  indexes
]

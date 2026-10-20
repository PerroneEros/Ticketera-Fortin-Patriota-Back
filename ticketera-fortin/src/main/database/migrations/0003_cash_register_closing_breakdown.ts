import { Migration } from './runner'

// Closing breakdown per payment method, computed by the server at closing time. NULL means the
// register is still open or was closed by a version that did not store it (shown as
// "sin desglose"). `closing` keeps being the counted total, for older versions and the PDF.
export const cashRegisterClosingBreakdown: Migration = {
  id: 3,
  name: 'cash_register_closing_breakdown',
  async up(db) {
    for (const column of [
      'counted_cash',
      'counted_transfer',
      'expected_cash',
      'expected_transfer'
    ]) {
      await db.exec(`ALTER TABLE cash_register ADD COLUMN ${column} INTEGER`)
    }
  }
}

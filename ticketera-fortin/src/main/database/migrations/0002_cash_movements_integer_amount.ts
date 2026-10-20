import { Migration } from './runner'

// Amounts are whole pesos (constitution, principle 5). The column keeps its declared
// DECIMAL(10,2) type: rebuilding the table would fail on orphan movements, which must be kept.
// What is stored becomes integer, and the triggers keep it that way.
const REJECT_DECIMALS =
  "SELECT RAISE(ABORT, 'El monto del movimiento debe ser un número entero de pesos.')"

export const cashMovementsIntegerAmount: Migration = {
  id: 2,
  name: 'cash_movements_integer_amount',
  async up(db, report) {
    const rows = await db.all<{ movement_id: number; amount: unknown; kind: string }>(
      `SELECT movement_id, amount, typeof(amount) AS kind FROM Cash_movements
       WHERE typeof(amount) <> 'integer' OR amount <= 0 ORDER BY movement_id`
    )

    for (const row of rows) {
      if (row.kind !== 'integer' && row.kind !== 'real') {
        report.inconsistencies.push(
          `Movimiento ${row.movement_id}: monto ${JSON.stringify(row.amount)} no es un número; se conservó sin cambios.`
        )
        continue
      }
      const amount = row.amount as number
      if (amount <= 0) {
        report.inconsistencies.push(
          `Movimiento ${row.movement_id}: monto ${amount} no es positivo; se conservó sin cambios.`
        )
        continue
      }
      // SQLite's ROUND goes half away from zero: half up for the positive amounts handled here.
      const [{ rounded }] = await db.all<{ rounded: number }>(
        'SELECT CAST(ROUND(?) AS INTEGER) AS rounded',
        [amount]
      )
      await db.run('UPDATE Cash_movements SET amount = ? WHERE movement_id = ?', [
        rounded,
        row.movement_id
      ])
      report.rounded.push({ movementId: row.movement_id, original: amount, rounded })
    }

    await db.exec(`
      CREATE TRIGGER cash_movements_amount_integer_insert
      BEFORE INSERT ON Cash_movements
      WHEN typeof(NEW.amount) <> 'integer'
      BEGIN ${REJECT_DECIMALS}; END;

      CREATE TRIGGER cash_movements_amount_integer_update
      BEFORE UPDATE OF amount ON Cash_movements
      WHEN typeof(NEW.amount) <> 'integer'
      BEGIN ${REJECT_DECIMALS}; END;
    `)
  }
}

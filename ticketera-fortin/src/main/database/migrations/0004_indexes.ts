import { Migration } from './runner'

// Foreign keys are not indexed by SQLite. These back the per-register detail and expected
// amounts (cash_register_id, sale_id) and the summary by date range (date).
export const indexes: Migration = {
  id: 4,
  name: 'indexes',
  async up(db) {
    await db.exec(`
      CREATE INDEX sales_date ON Sales (date);
      CREATE INDEX sales_cash_register_id ON Sales (cash_register_id);
      CREATE INDEX sale_items_sale_id ON Sale_items (sale_id);
      CREATE INDEX cash_movements_cash_register_id ON Cash_movements (cash_register_id);
      CREATE INDEX cash_movements_date ON Cash_movements (date);
    `)
  }
}

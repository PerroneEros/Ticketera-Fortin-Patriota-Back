import Product from './product'
import Category from './category'
import Sale_items from './sale_items'
import Sales from './sales'
import Cash_register from './cash_registers'

export function initAssociations(): void {
  // 1. product <--> category
  Category.hasMany(Product, { foreignKey: 'category_id' })
  Product.belongsTo(Category, { foreignKey: 'category_id' })

  // 2. sale_items <--> product
  Product.hasMany(Sale_items, { foreignKey: 'id_product' })
  Sale_items.belongsTo(Product, { foreignKey: 'id_product' })
  // 3. sale_items <--> sales
  Sales.hasMany(Sale_items, { foreignKey: 'sales_id' })
  Sale_items.belongsTo(Sales, { foreignKey: 'sales_id' })

  // 4. sale_items <--> cash_register
  Cash_register.hasMany(Sales, { foreignKey: 'cash_register_id' })
  Sales.belongsTo(Cash_register, { foreignKey: 'cash_register_id' })
}

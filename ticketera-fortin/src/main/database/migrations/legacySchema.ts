// Schema that `sequelize.sync()` created in every installation before migrations existed,
// captured verbatim from a real database on 2026-10-20. Migrations start from here: it must
// never change, even when the models do.
export const LEGACY_TABLES = [
  'Category',
  'Products',
  'cash_register',
  'Sales',
  'Sale_items',
  'Cash_movements'
] as const

export type LegacyTable = (typeof LEGACY_TABLES)[number]

// Columns the app reads from each table. An existing database missing any of them comes from a
// version we do not know, and is not touched.
export const LEGACY_COLUMNS: Record<LegacyTable, readonly string[]> = {
  Category: ['category_id', 'name', 'created_at', 'updated_at'],
  Products: ['id_product', 'name', 'price', 'category_id', 'is_active', 'created_at', 'updated_at'],
  cash_register: [
    'cash_register_id',
    'opening',
    'closing',
    'opened_at',
    'closed_at',
    'status',
    'created_at',
    'updated_at'
  ],
  Sales: [
    'sales_id',
    'cash_register_id',
    'date',
    'total',
    'payment_method',
    'cash_amount',
    'transfer_amount',
    'created_at',
    'updated_at'
  ],
  Sale_items: [
    'sale_items_id',
    'sale_id',
    'id_product',
    'quantity',
    'unit_price',
    'total',
    'printed',
    'created_at',
    'updated_at'
  ],
  Cash_movements: [
    'movement_id',
    'cash_register_id',
    'type',
    'amount',
    'description',
    'method',
    'date',
    'created_at',
    'updated_at'
  ]
}

export const LEGACY_DDL: Record<LegacyTable, string> = {
  Category:
    'CREATE TABLE `Category` (`category_id` INTEGER PRIMARY KEY AUTOINCREMENT, `name` VARCHAR(100) NOT NULL, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL)',
  Products:
    'CREATE TABLE `Products` (`id_product` INTEGER PRIMARY KEY AUTOINCREMENT, `name` VARCHAR(100) NOT NULL, `price` INTEGER NOT NULL, `category_id` INTEGER NOT NULL REFERENCES `Category` (`category_id`) ON DELETE CASCADE ON UPDATE CASCADE, `is_active` TINYINT(1) NOT NULL DEFAULT 1, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL)',
  cash_register:
    'CREATE TABLE `cash_register` (`cash_register_id` INTEGER PRIMARY KEY AUTOINCREMENT, `opening` INTEGER NOT NULL, `closing` INTEGER NOT NULL, `opened_at` DATETIME NOT NULL, `closed_at` DATETIME, `status` VARCHAR(255) NOT NULL, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL)',
  Sales:
    'CREATE TABLE `Sales` (`sales_id` INTEGER PRIMARY KEY AUTOINCREMENT, `cash_register_id` INTEGER NOT NULL REFERENCES `cash_register` (`cash_register_id`) ON DELETE CASCADE ON UPDATE CASCADE, `date` DATETIME NOT NULL, `total` INTEGER NOT NULL, `payment_method` TEXT NOT NULL, `cash_amount` INTEGER NOT NULL, `transfer_amount` INTEGER NOT NULL, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL)',
  Sale_items:
    'CREATE TABLE `Sale_items` (`sale_items_id` INTEGER PRIMARY KEY AUTOINCREMENT, `sale_id` INTEGER NOT NULL REFERENCES `Sales` (`sales_id`) ON DELETE CASCADE ON UPDATE CASCADE, `id_product` INTEGER NOT NULL REFERENCES `Products` (`id_product`) ON DELETE CASCADE ON UPDATE CASCADE, `quantity` INTEGER NOT NULL, `unit_price` INTEGER NOT NULL, `total` INTEGER NOT NULL, `printed` TINYINT(1) NOT NULL, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL)',
  Cash_movements:
    'CREATE TABLE `Cash_movements` (`movement_id` INTEGER PRIMARY KEY AUTOINCREMENT, `cash_register_id` INTEGER NOT NULL REFERENCES `cash_register` (`cash_register_id`), `type` TEXT NOT NULL, `amount` DECIMAL(10,2) NOT NULL, `description` VARCHAR(255) NOT NULL, `method` TEXT NOT NULL, `date` DATETIME NOT NULL, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL)'
}

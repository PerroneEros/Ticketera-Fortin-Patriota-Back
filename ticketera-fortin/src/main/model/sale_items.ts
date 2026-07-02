import { DataTypes, Model, Optional } from 'sequelize'
import Sale_itemsAttributes from './interface/sale_itemsAttributes'
import sequelize from '../database/db'
type Sale_itemsCreationAttributes = Optional<Sale_itemsAttributes, 'sale_items_id'>
class Sale_items
  extends Model<Sale_itemsAttributes, Sale_itemsCreationAttributes>
  implements Sale_itemsAttributes
{
  declare sale_items_id: number
  declare sale_id: number
  declare id_product: number
  declare quantity: number
  declare unit_price: number
  declare total: number
  declare printed: boolean
  declare created_at: Date
}
Sale_items.init(
  {
    sale_items_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true
    },
    sale_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Sales',
        key: 'sales_id'
      },
      allowNull: false
    },
    id_product: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Products',
        key: 'id_product'
      },
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    unit_price: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    total: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    printed: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'Sale_items',
    timestamps: true,
    underscored: true
  }
)

export default Sale_items

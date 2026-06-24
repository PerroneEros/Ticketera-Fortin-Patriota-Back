import { DataTypes, Model, Optional } from 'sequelize'
import ProductAttributes from './interface/productAttributes'
import sequelize from '../database/db'
type productCreationAttributes = Optional<ProductAttributes, 'id_product'>
class Product
  extends Model<ProductAttributes, productCreationAttributes>
  implements ProductAttributes
{
  declare id_product: number
  declare name: string
  declare price: number
  declare category_id: number
}
Product.init(
  {
    id_product: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    category_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Category',
        key: 'category_id'
      },
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'Products',
    timestamps: true,
    underscored: true
  }
)

export default Product

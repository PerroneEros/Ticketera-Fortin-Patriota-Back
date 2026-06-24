import { DataTypes, Model, Optional } from 'sequelize'
import CategoryAttributes from './interface/categoryAttributes'
import sequelize from '../database/db'
type categoryCreationAttributes = Optional<CategoryAttributes, 'category_id'>
class Category
  extends Model<CategoryAttributes, categoryCreationAttributes>
  implements CategoryAttributes
{
  declare category_id: number
  declare name: string
}
Category.init(
  {
    category_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'Category',
    timestamps: true,
    underscored: true
  }
)

export default Category

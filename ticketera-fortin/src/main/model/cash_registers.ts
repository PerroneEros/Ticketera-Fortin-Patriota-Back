import { DataTypes, Model, Optional } from 'sequelize'
import cash_registerAttributes from './interface/cash_registersAttributes'
import sequelize from '../database/db'
type cash_registerCreationAttributes = Optional<cash_registerAttributes, 'cash_register_id'>
class Cash_register
  extends Model<cash_registerAttributes, cash_registerCreationAttributes>
  implements cash_registerAttributes
{
  declare cash_register_id: number
  declare opening: number
  declare closing: number
  declare opened_at: Date
  declare closed_at: Date
  declare status: string
}
Cash_register.init(
  {
    cash_register_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true
    },
    opening: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    closing: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    opened_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    closed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'cash_register',
    timestamps: true,
    underscored: true
  }
)

export default Cash_register

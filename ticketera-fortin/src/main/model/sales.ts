import { DataTypes, Model, Optional } from 'sequelize'
import salesAttributes from './interface/salesAttributes'
import sequelize from '../database/db'
import { PaymentMethod } from './interface/salesAttributes'
type salesCreationAttributes = Optional<salesAttributes, 'sales_id'>
class Sales extends Model<salesAttributes, salesCreationAttributes> implements salesAttributes {
  declare sales_id: number
  declare cash_register_id: number
  declare date: Date
  declare total: number
  declare paymentMethod: PaymentMethod
  declare cashAmount: number
  declare transferAmount: number
}
Sales.init(
  {
    sales_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true
    },
    cash_register_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'cash_register',
        key: 'cash_register_id'
      },
      allowNull: false
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    total: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.ENUM('efectivo', 'transferencia', 'combinado'),
      allowNull: false
    },
    cashAmount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    transferAmount: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'Sales',
    timestamps: true,
    underscored: true
  }
)

export default Sales

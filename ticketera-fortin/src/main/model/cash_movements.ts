import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../database/db'
import { CashMovementsAttributes } from './interface/cashMovementsAttributes'

type CashMovementsCreationAttributes = Optional<CashMovementsAttributes, 'movement_id'>

class Cash_movements extends Model<CashMovementsAttributes, CashMovementsCreationAttributes> implements CashMovementsAttributes {
  declare movement_id: number
  declare cash_register_id: number
  declare type: 'ingreso' | 'egreso'
  declare amount: number
  declare description: string
  declare method: 'efectivo' | 'transferencia'
  declare date: Date
}

Cash_movements.init(
  {
    movement_id: {
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
    type: {
      type: DataTypes.ENUM('ingreso', 'egreso'),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2), 
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    method: {
      type: DataTypes.ENUM('efectivo', 'transferencia'),
      allowNull: false
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'Cash_movements',
    timestamps: true,
    underscored: true
  }
)

export default Cash_movements
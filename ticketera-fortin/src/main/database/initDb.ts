import sequelize from './db'
import { initAssociations } from '../model/associations'
import '../model/cash_registers'
import '../model/category'
import '../model/product'
import '../model/sale_items'
import '../model/sales'
// promise sirve para evitar el error de eslint de que la funcion no retorna nada :)
export const initDB = async (): Promise<void> => {
  try {
    initAssociations()
    await sequelize.sync({ force: false })
    console.log('base de datos sincronizada correctamente')
  } catch (error) {
    console.error('error al conectar con la base de datos: ', error)
  }
}

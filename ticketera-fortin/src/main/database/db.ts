import { Sequelize } from 'sequelize'
import path from 'path'

// Se creará en la raíz de tu proyecto con este nombre
const dbPath = path.join(__dirname, '..', 'ticketera_fortin.sqlite')

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false // Para que no te llene la consola de consultas SQL
})

export default sequelize

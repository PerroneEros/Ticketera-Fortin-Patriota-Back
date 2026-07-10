import { app } from 'electron'
import { Sequelize } from 'sequelize'
import path from 'path'

const dbPath = path.join(app.getPath('userData'), 'baseTicketera.sqlite')

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false // Para que no te llene la consola de consultas SQL
})

export default sequelize

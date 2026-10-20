import { app } from 'electron'
import { Sequelize } from 'sequelize'
import path from 'path'

export const dbPath = path.join(app.getPath('userData'), 'baseTicketera.sqlite')
// Copies taken before each schema update, and the update reports.
export const backupDir = path.join(app.getPath('userData'), 'copias-actualizacion')

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false // Para que no te llene la consola de consultas SQL
})

export default sequelize

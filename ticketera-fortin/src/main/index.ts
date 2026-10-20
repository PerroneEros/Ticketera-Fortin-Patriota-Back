import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/logo.jpeg?asset'
import { initDB } from './database/initDb'
import { describeMigration, describeStartupError } from './database/startupMessages'
import express from 'express'
import cors from 'cors'
import apiRouter from './routes/index'
// evita el error de eslint de any porque .listen devuelve server de http
import { Server } from 'http'
import { checkLicense, activateLicense } from './license'
import {
  API_HOST,
  API_PORT,
  API_TOKEN_HEADER,
  createApiTokenMiddleware,
  generateApiToken,
  getAllowedOrigins
} from './apiAuth'

// es como se crea la ventana
function createWindow(): void {
  // indica el tamaño de la ventana
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true
    }
  })
  // la ventana se mantiene invisble y cuando esta lista se despliega
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })
  // hace que los links se abran en un navegador y no en la app
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
  //si estas en modo dev hace que los cambias se reflejen en tiempo real si esta en modo .exe lee index.html
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Una segunda instancia chocaría con el puerto y con la base de la primera
if (!app.requestSingleInstanceLock()) {
  app.quit()
}

// variable para guardar el servidor cuando se encuentra y despues poder cerrarlo
let expressServer: Server | null = null
// token nuevo en cada arranque: solo lo recibe el renderer de la app por el preload
const apiToken = generateApiToken()

// este metodo se llama cuando electron se termina de armar
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('check-license', () => checkLicense())
  ipcMain.handle('activate-license', (_, key: unknown) => activateLicense(String(key ?? '')))
  ipcMain.handle('get-api-token', () => apiToken)

  //inicia la base de datos
  try {
    const migration = await initDB()
    const notice = describeMigration(migration)
    if (notice) {
      await dialog.showMessageBox({ type: 'warning', title: notice.title, message: notice.message })
    }
  } catch (error) {
    console.error('no se pudo iniciar la base de datos ', error)
    const text = describeStartupError(error)
    dialog.showErrorBox(text.title, text.message)
    app.quit()
    return
  }

  //creacion de express
  const expressAPP = express()
  // cors() responde los preflight, así que OPTIONS nunca llega al chequeo del token
  expressAPP.use(
    cors({
      origin: getAllowedOrigins(process.env['ELECTRON_RENDERER_URL']),
      allowedHeaders: ['Content-Type', API_TOKEN_HEADER]
    })
  )
  // se usa para que express acepte json
  expressAPP.use(express.json())
  expressAPP.use('/api', createApiTokenMiddleware(apiToken), apiRouter)
  // solo escucha en la propia PC: nada de la red puede llegar a la API
  const server = expressAPP.listen(API_PORT, API_HOST, () => {
    console.log(`el servidor esta escuchando en http://${API_HOST}:${API_PORT}`)
  })
  expressServer = server
  server.on('error', (error) => {
    console.error('no se pudo iniciar el servidor local ', error)
    dialog.showErrorBox(
      'Error al iniciar',
      `No se pudo usar el puerto ${API_PORT}. Cerrá otras copias de la app y volvé a abrirla.`
    )
    app.quit()
  })

  //llama a la funcion para que aparezca la ventana
  createWindow()
})

// hace que cuando se cierra la ventana deje de andar la app lo de darwin es para mac
app.on('window-all-closed', () => {
  // express se para cuando se cierra la ventana
  if (expressServer) {
    expressServer.close()
    console.log('server cerrado')
  }
  app.quit()
})

import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/logo.jpeg?asset'
import { initDB } from './database/initDb'
import express from 'express'
import cors from 'cors'
import apiRouter from './routes/index'
// evita el error de eslint de any porque .listen devuelve server de http
import { Server } from 'http'
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
      sandbox: false
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
// variable para guardar el servidor cuando se encuentra y despues poder cerrarlo
// al asignarle tipo server evitamos que salte el error de eslint por usar la variable any
let expressServer: Server | null = null
// este metodo se llama cuando electron se termina de armar
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Si desde tu HTML le mandan un mensaje llamado 'ping', él responde 'pong' en la consola.
  // Acá mismo es donde vas a poner tus escuchadores para imprimir tickets o buscar productos en SQLite
  ipcMain.on('ping', () => console.log('pong'))
  //inicia la base de datos
  try {
    await initDB()
  } catch (error) {
    console.error('no se pudo iniciar la base de datos ', error)
    return
  }
  //creacion de express
  const expressAPP = express()
  expressAPP.use(cors())
  // se usa para que express acepte json
  expressAPP.use(express.json())
  expressAPP.use('/api', apiRouter)
  //log para mostrar donde funciona express reemplazar en el futuro para que busque el puerto libre solo
  expressServer = expressAPP.listen(34567, () => {
    console.log('el servidor esta escuchando en el puerto http://localhost:34567 ')
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

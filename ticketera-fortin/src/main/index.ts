import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDB } from './database/initDb'
// es como se crea la ventana
function createWindow(): void {
  // indica el tamaño de la ventana
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
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
  }

  //llama a la funcion para que aparezca la ventana
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// hace que cuando se cierra la ventana deje de andar la app lo de darwin es para mac
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
